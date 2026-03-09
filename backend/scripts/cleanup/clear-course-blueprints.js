const mysql = require("mysql2/promise");

async function clearCourseBlueprints() {
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

    // Check current count
    const [beforeCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM course_blueprints"
    );

    console.log(
      `📊 Records in course_blueprints table BEFORE clearing: ${beforeCount[0].count}`
    );

    // Clear the table
    console.log("🗑️ Clearing course_blueprints table...");
    await connection.execute("DELETE FROM course_blueprints");

    // Reset auto-increment
    console.log("🔄 Resetting auto-increment...");
    await connection.execute(
      "ALTER TABLE course_blueprints AUTO_INCREMENT = 1"
    );

    // Check after count
    const [afterCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM course_blueprints"
    );

    console.log(
      `📊 Records in course_blueprints table AFTER clearing: ${afterCount[0].count}`
    );

    if (afterCount[0].count === 0) {
      console.log("✅ SUCCESS: course_blueprints table is now empty!");
    } else {
      console.log("❌ ERROR: Table was not cleared properly!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

clearCourseBlueprints();
