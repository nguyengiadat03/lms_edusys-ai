const mysql = require("mysql2/promise");

async function debugKCTCount() {
  const config = {
    host: "45.32.100.86",
    port: 3306,
    user: "root",
    password: "Tepa@123456",
    database: "edusys_ai_2025_v1",
    connectTimeout: 5000,
  };

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database");

    // Check course_kct_mappings table
    console.log("\n📊 Checking course_kct_mappings table:");
    const [mappings] = await connection.execute(
      "SELECT COUNT(*) as total FROM course_kct_mappings"
    );
    console.log(`   Total mappings: ${mappings[0].total}`);

    if (mappings[0].total > 0) {
      const [sampleMappings] = await connection.execute(
        "SELECT kct_id, course_id FROM course_kct_mappings LIMIT 5"
      );
      console.log("   Sample mappings:", sampleMappings);
    }

    // Check curriculum_frameworks table
    console.log("\n📋 Checking curriculum_frameworks table:");
    const [frameworks] = await connection.execute(
      "SELECT id, code, name FROM curriculum_frameworks LIMIT 5"
    );
    console.log("   Frameworks:", frameworks);

    // Test the exact JOIN query (same as curriculum API)
    console.log("\n🔗 Testing JOIN query (same as API):");
    const [results] = await connection.execute(`
      SELECT cf.id, cf.code, cf.name, COUNT(ckm.course_id) as courses_count
      FROM curriculum_frameworks cf
      LEFT JOIN users u ON cf.owner_user_id = u.id
      LEFT JOIN course_kct_mappings ckm ON ckm.kct_id = cf.code
      WHERE cf.tenant_id = 1 AND cf.deleted_at IS NULL
        AND cf.status IN ('approved', 'published')
      GROUP BY cf.id
      ORDER BY cf.updated_at DESC
      LIMIT 10
    `);
    console.log("   JOIN results (with API filters):", results);

    // Test without status filter to see all KCTs
    console.log("\n🔗 Testing JOIN query (without status filter):");
    const [resultsAll] = await connection.execute(`
      SELECT cf.id, cf.code, cf.name, cf.status, cf.tenant_id, COUNT(ckm.course_id) as courses_count
      FROM curriculum_frameworks cf
      LEFT JOIN users u ON cf.owner_user_id = u.id
      LEFT JOIN course_kct_mappings ckm ON ckm.kct_id = cf.code
      WHERE cf.tenant_id = 1 AND cf.deleted_at IS NULL
      GROUP BY cf.id, cf.code, cf.name, cf.status, cf.tenant_id
      ORDER BY cf.updated_at DESC
      LIMIT 10
    `);
    console.log("   JOIN results (all statuses):", resultsAll);

    // Check if codes match exactly
    console.log("\n🔍 Checking code matching:");
    if (mappings[0].total > 0 && frameworks.length > 0) {
      const [codes] = await connection.execute(`
        SELECT DISTINCT ckm.kct_id as mapping_kct_id, cf.code as framework_code
        FROM course_kct_mappings ckm
        LEFT JOIN curriculum_frameworks cf ON ckm.kct_id = cf.code
        LIMIT 10
      `);
      console.log("   Code matching check:", codes);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugKCTCount();
