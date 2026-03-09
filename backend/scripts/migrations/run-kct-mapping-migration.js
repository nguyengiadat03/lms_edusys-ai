const mysql = require("mysql2/promise");
const fs = require("fs");

async function runKCTMappingMigration() {
  const config = {
    host: "45.32.100.86",
    port: 3306,
    user: "root",
    password: "Tepa@123456",
    database: "edusys_ai_2025_v1",
    multipleStatements: true,
  };

  let connection;

  try {
    console.log("🔗 Connecting to database for KCT mapping...");
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database");

    console.log("\n📄 Reading KCT mapping migration file...");
    const migrationPath = "./backend/migrations/create-course-kct-mapping.sql";
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("🚀 Executing KCT mapping migration...");

    // Execute the migration (CREATE TABLE and INSERT statements)
    await connection.query(migrationSQL);

    console.log("✅ KCT mapping migration completed successfully!");

    // Verify the mapping data
    console.log("\n🔍 Verifying KCT mappings...");
    const [mappings] = await connection.query(`
      SELECT
        ckm.id,
        cb.code as course_code,
        cb.title as course_title,
        ckm.kct_id,
        ckm.kct_type,
        ckm.mapping_level,
        LEFT(ckm.description, 50) as description_prefix
      FROM course_kct_mappings ckm
      INNER JOIN course_blueprints cb ON ckm.course_id = cb.id
      ORDER BY cb.order_index
    `);

    console.log(`📊 Total KCT mappings created: ${mappings.length}`);
    console.log("\n📋 KCT Mappings:");
    mappings.forEach((mapping, index) => {
      console.log(
        `${index + 1}. ${mapping.course_code} → ${mapping.kct_id} (${
          mapping.mapping_level
        }) - ${mapping.description_prefix}...`
      );
    });

    // Get mapping summary
    const [summary] = await connection.query(`
      SELECT
        kct_id,
        kct_type,
        mapping_level,
        COUNT(*) as count
      FROM course_kct_mappings
      GROUP BY kct_id, kct_type, mapping_level
      ORDER BY kct_id, count DESC
    `);

    console.log("\n📊 Mapping Summary by KCT Framework:");
    summary.forEach((item) => {
      console.log(
        `  ${item.kct_id} (${item.kct_type}): ${item.count} ${item.mapping_level} mappings`
      );
    });

    console.log("\n🎉 KCT mapping simulation completed successfully!");
  } catch (error) {
    console.error("❌ KCT mapping migration failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

console.log("=========================================");
console.log("KCT MAPPING MIGRATION SIMULATION");
console.log("=========================================\n");

runKCTMappingMigration()
  .then(() => {
    console.log("\n✅ KCT mapping migration simulation finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ KCT mapping migration simulation failed:", error);
    process.exit(1);
  });
