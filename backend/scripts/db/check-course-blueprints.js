const mysql = require("mysql2/promise");

async function checkCourseBlueprintsColumns() {
  const config = {
    host: "45.32.100.86",
    port: 3306,
    user: "root",
    password: "Tepa@123456",
    database: "edusys_ai_2025_v1",
  };

  let connection;

  try {
    console.log("🔍 Checking course_blueprints table columns...");
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database");

    // Check table structure
    const [columns] = await connection.query("DESCRIBE course_blueprints");
    console.log("📋 Current columns in course_blueprints:");
    columns.forEach((col) => {
      console.log(
        `  ${col.Field}: ${col.Type} - ${
          col.Null === "YES" ? "NULL" : "NOT NULL"
        } ${col.Default ? `(Default: ${col.Default})` : ""}`
      );
    });

    const hasLearningMethod = columns.some(
      (col) => col.Field === "learning_method"
    );
    const hasState = columns.some((col) => col.Field === "state");

    console.log("\n🔍 Column status:");
    console.log(
      `learning_method: ${hasLearningMethod ? "✅ EXISTS" : "❌ MISSING"}`
    );
    console.log(`state: ${hasState ? "✅ EXISTS" : "❌ MISSING"}`);

    if (!hasLearningMethod || !hasState) {
      console.log("\n🚀 Migration needed - adding missing columns...");

      // Add missing columns individually with proper error handling
      try {
        if (!hasLearningMethod) {
          console.log("🔄 Adding learning_method column...");
          await connection.query(
            "ALTER TABLE course_blueprints ADD COLUMN learning_method VARCHAR(100) DEFAULT 'online' COMMENT 'Hình thức học (online, offline, hybrid, blended)'"
          );
          console.log("✅ learning_method column added");
        }
        if (!hasState) {
          console.log("🔄 Adding state column...");
          await connection.query(
            "ALTER TABLE course_blueprints ADD COLUMN state ENUM('draft', 'review', 'approved', 'published', 'archived') DEFAULT 'draft' COMMENT 'Trạng thái của khóa học'"
          );
          console.log("✅ state column added");
        }
      } catch (addColumnError) {
        if (addColumnError.code === "ER_DUP_FIELDNAME") {
          console.log("ℹ️  Some columns may already exist");
        } else {
          console.error("❌ Error adding columns:", addColumnError.message);
          throw addColumnError;
        }
      }

      // Add indexes with error handling
      try {
        if (!hasLearningMethod) {
          console.log("🔄 Adding index for learning_method...");
          await connection.query(
            "ALTER TABLE course_blueprints ADD INDEX idx_learning_method (learning_method)"
          );
          console.log("✅ Index for learning_method added");
        }
        if (!hasState) {
          console.log("🔄 Adding index for state...");
          await connection.query(
            "ALTER TABLE course_blueprints ADD INDEX idx_state (state)"
          );
          console.log("✅ Index for state added");
        }
      } catch (indexError) {
        console.warn("⚠️  Error adding indexes:", indexError.message);
      }

      // Update existing records
      try {
        if (!hasLearningMethod) {
          console.log("🔄 Updating existing records for learning_method...");
          await connection.query(
            "UPDATE course_blueprints SET learning_method = 'online' WHERE learning_method IS NULL"
          );
          console.log("✅ Existing records updated for learning_method");
        }
        if (!hasState) {
          console.log("🔄 Updating existing records for state...");
          await connection.query(
            "UPDATE course_blueprints SET state = 'published' WHERE state IS NULL"
          );
          console.log("✅ Existing records updated for state");
        }
      } catch (updateError) {
        console.warn(
          "⚠️  Error updating existing records:",
          updateError.message
        );
      }

      console.log("✅ Migration completed successfully!");

      // Verify after migration
      console.log("\n🔄 Verifying migration...");
      const [newColumns] = await connection.query("DESCRIBE course_blueprints");
      const newHasLearningMethod = newColumns.some(
        (col) => col.Field === "learning_method"
      );
      const newHasState = newColumns.some((col) => col.Field === "state");

      console.log("✅ Verification:");
      console.log(
        `learning_method: ${
          newHasLearningMethod ? "✅ EXISTS" : "❌ STILL MISSING"
        }`
      );
      console.log(`state: ${newHasState ? "✅ EXISTS" : "❌ STILL MISSING"}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("ℹ️  Columns already exist, migration already applied");
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

console.log("=========================================");
console.log("CHECK: Course Blueprints Table");
console.log("=========================================\n");

checkCourseBlueprintsColumns()
  .then(() => {
    console.log("\n✅ Check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });
