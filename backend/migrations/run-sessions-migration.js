const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config({ path: "./backend/.env" });

async function runMigration() {
  let connection;

  try {
    console.log("🔗 Connecting to MySQL...");

    // Connect to remote database using .env credentials
    const dbName = process.env.DB_DATABASE || "edusys_ai_2025_v1";
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME || process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
      database: dbName,
      multipleStatements: true,
    });

    console.log("📄 Reading migration file...");
    const migrationSQL = fs.readFileSync(
      "./backend/migrations/add-course-sessions-column.sql",
      "utf8"
    );

    console.log("🚀 Executing migration...");
    await connection.query(migrationSQL);

    console.log(
      "✅ SUCCESS: sessions column added to course_blueprints table!"
    );
    console.log("📊 Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Connection closed");
    }
  }
}

console.log("===============================================");
console.log("MIGRATION: Adding sessions column to course_blueprints");
console.log("===============================================\n");

runMigration()
  .then(() => {
    console.log("\n✅ Migration script finished successfully!");
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
