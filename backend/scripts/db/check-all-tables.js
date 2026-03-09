const mysql = require("mysql2/promise");

async function checkAllTables() {
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
    console.log("✅ Connected to database: edusys_ai_2025_v1");

    // Get all tables
    const [tables] = await connection.execute("SHOW TABLES");

    console.log("\n📋 ALL TABLES in database:");
    const tableNames = tables.map((table) => Object.values(table)[0]);

    for (const tableName of tableNames) {
      console.log(`\n🗄️ Table: ${tableName}`);

      // Count rows for this table
      try {
        const [rows] = await connection.execute(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        console.log(`   📊 Records: ${rows[0].count}`);

        // Check if this is curriculum related
        if (
          tableName.toLowerCase().includes("curriculum") ||
          tableName.toLowerCase().includes("kct") ||
          tableName.toLowerCase().includes("course")
        ) {
          console.log(`   🎓 This appears to be CURRICULUM related!`);
        }
      } catch (countError) {
        console.log(`   ❌ Could not count rows: ${countError.message}`);
      }
    }

    // Specifically check curriculum tables
    console.log("\n🔍 CURRICULUM TABLES CHECK:");
    const curriculumTables = tableNames.filter(
      (table) =>
        table.toLowerCase().includes("curriculum") ||
        table.toLowerCase().includes("kct")
    );

    if (curriculumTables.length === 0) {
      console.log("❌ No curriculum tables found!");
      console.log("📝 You may need to run database migrations");
    } else {
      console.log("✅ Found curriculum-related tables:");
      for (const tableName of curriculumTables) {
        console.log(`   - ${tableName}`);
      }
    }

    // Check if courses table exists
    const hasCoursesTable = tableNames.some(
      (table) =>
        table.toLowerCase() === "courses" ||
        table.toLowerCase().includes("course")
    );

    console.log(
      `\n📚 COURSES TABLE: ${hasCoursesTable ? "✅ EXISTS" : "❌ NOT FOUND"}`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAllTables();
