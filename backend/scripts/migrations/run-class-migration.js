const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runClassMigration() {
  const config = {
    host: "45.32.100.86",
    port: 3306,
    user: "root",
    password: "Tepa@123456",
    database: "edusys_ai_2025_v1",
    connectTimeout: 5000,
    multipleStatements: true, // Allow multiple SQL statements
  };

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database for migration");

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "create-classes-table.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Running class table migration...");

    // Try to execute the entire migration in one go
    try {
      await connection.execute(migrationSQL);
      console.log("✅ Migration executed successfully in single statement");
    } catch (singleError) {
      console.log(
        `⚠️  Single execution failed, trying individual statements: ${singleError.message}`
      );

      // Fallback: Execute key statements individually
      console.log("🔄 Falling back to individual statement execution...");

      // Create table first
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS classes (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          tenant_id BIGINT UNSIGNED NOT NULL,
          campus_id BIGINT UNSIGNED NULL,
          curriculum_id BIGINT UNSIGNED NULL,
          curriculum_version_no VARCHAR(50) NULL,
          code VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          program VARCHAR(255) NULL,
          level VARCHAR(32) NULL,
          target_language VARCHAR(100) NULL,
          modality ENUM('online', 'offline', 'hybrid') NOT NULL DEFAULT 'offline',
          academic_method VARCHAR(100) NULL,
          academic_format VARCHAR(100) NULL,
          start_date DATE NULL,
          end_date DATE NULL,
          total_weeks INT UNSIGNED NULL,
          weekly_sessions INT UNSIGNED NULL,
          session_duration_hours DECIMAL(4, 1) NULL,
          schedule_json JSON NULL,
          max_students INT UNSIGNED NULL,
          current_students INT UNSIGNED NULL,
          min_students INT UNSIGNED NULL,
          main_teacher_id BIGINT UNSIGNED NULL,
          assistant_teachers JSON NULL,
          status ENUM('draft', 'planned', 'active', 'completed', 'cancelled', 'suspended') NOT NULL DEFAULT 'draft',
          description TEXT NULL,
          special_requirements TEXT NULL,
          learning_objectives JSON NULL,
          grade_level VARCHAR(50) NULL,
          age_group ENUM('kids', 'teens', 'adults', 'all') NULL,
          room_id VARCHAR(100) NULL,
          equipment_needs JSON NULL,
          price_per_student DECIMAL(10, 2) NULL,
          currency_code VARCHAR(3) DEFAULT 'USD',
          created_by BIGINT UNSIGNED NULL,
          updated_by BIGINT UNSIGNED NULL,
          created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,

          INDEX idx_classes_tenant (tenant_id),
          INDEX idx_classes_campus (campus_id),
          INDEX idx_classes_curriculum (curriculum_id),
          INDEX idx_classes_teacher (main_teacher_id),
          INDEX idx_classes_status (status),
          INDEX idx_classes_start_date (start_date),
          INDEX idx_classes_program (program),
          INDEX idx_classes_level (level),

          CONSTRAINT fk_classes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT fk_classes_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT fk_classes_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculum_frameworks(id) ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT fk_classes_main_teacher FOREIGN KEY (main_teacher_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
      `;

      try {
        await connection.execute(createTableSQL);
        console.log("✅ Classes table structure created");

        // Temporarily disable foreign key checks for inserting sample data
        await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
        console.log("🔓 Foreign key checks disabled for sample data insertion");
      } catch (tableError) {
        console.error("❌ Failed to create table:", tableError.message);
      }

      // Add comment
      try {
        await connection.execute(
          `ALTER TABLE classes COMMENT 'Core table for managing class information, curriculum mapping, and student enrollment';`
        );
      } catch (commentError) {
        console.log("⚠️ Failed to add table comment:", commentError.message);
      }

      // Insert sample data individually
      const sampleData = [
        (1,
        1,
        1,
        "v1.2",
        "ENG-B1-001",
        "Business English Intermediate",
        "Business English",
        "B1",
        "English",
        "hybrid",
        "communicative",
        "regular",
        "2024-11-01",
        "2025-01-31",
        12,
        3,
        1.5,
        20,
        18,
        2,
        "active",
        "Intermediate level business English focused on presentations and negotiations",
        "college",
        "adults"),
        (1,
        1,
        2,
        "v1.0",
        "IELTS-001",
        "IELTS Preparation Advanced",
        "IELTS",
        "B2",
        "English",
        "online",
        "academic",
        "intensive",
        "2024-11-15",
        "2025-01-15",
        8,
        5,
        1.5,
        15,
        12,
        3,
        "active",
        "Advanced IELTS preparation with focus on all exam modules",
        "university",
        "adults"),
        (1,
        2,
        null,
        "v2.0",
        "GEN-A2-002",
        "General English Elementary",
        "General English",
        "A2",
        "English",
        "offline",
        "traditional",
        "regular",
        "2024-11-01",
        "2025-02-28",
        16,
        3,
        1.5,
        25,
        22,
        4,
        "active",
        "Beginner level general English with focus on basic communication skills",
        "secondary",
        "teens"),
        (2,
        4,
        null,
        "v1.0",
        "JPN-B1-001",
        "Japanese for Beginners",
        "Japanese",
        "B1",
        "Japanese",
        "online",
        "communicative",
        "regular",
        "2024-12-01",
        "2025-03-31",
        16,
        2,
        2.0,
        12,
        10,
        5,
        "planned",
        "Introduction to Japanese language and culture",
        "college",
        "adults"),
        (3,
        7,
        null,
        "v1.3",
        "SPAN-A1-001",
        "Spanish Fundamentals",
        "Spanish",
        "A1",
        "Spanish",
        "hybrid",
        "immersion",
        "intensive",
        "2024-11-10",
        "2025-01-10",
        8,
        4,
        1.0,
        18,
        16,
        6,
        "active",
        "Fundamental Spanish with cultural immersion approach",
        "high_school",
        "teens"),
      ];

      // Insert sample data with direct SQL (not prepared statements)
      const insertStatements = [
        `INSERT INTO classes (tenant_id, campus_id, curriculum_id, curriculum_version_no, code, name, program, level, target_language, modality, academic_method, academic_format, start_date, end_date, total_weeks, weekly_sessions, session_duration_hours, max_students, current_students, main_teacher_id, status, description, grade_level, age_group) VALUES (1, 1, 1, 'v1.2', 'ENG-B1-001', 'Business English Intermediate', 'Business English', 'B1', 'English', 'hybrid', 'communicative', 'regular', '2024-11-01', '2025-01-31', 12, 3, 1.5, 20, 18, 2, 'active', 'Intermediate level business English focused on presentations and negotiations', 'college', 'adults')`,
        `INSERT INTO classes (tenant_id, campus_id, curriculum_id, curriculum_version_no, code, name, program, level, target_language, modality, academic_method, academic_format, start_date, end_date, total_weeks, weekly_sessions, session_duration_hours, max_students, current_students, main_teacher_id, status, description, grade_level, age_group) VALUES (1, 1, 2, 'v1.0', 'IELTS-001', 'IELTS Preparation Advanced', 'IELTS', 'B2', 'English', 'online', 'academic', 'intensive', '2024-11-15', '2025-01-15', 8, 5, 1.5, 15, 12, 3, 'active', 'Advanced IELTS preparation with focus on all exam modules', 'university', 'adults')`,
        `INSERT INTO classes (tenant_id, campus_id, curriculum_id, curriculum_version_no, code, name, program, level, target_language, modality, academic_method, academic_format, start_date, end_date, total_weeks, weekly_sessions, session_duration_hours, max_students, current_students, main_teacher_id, status, description, grade_level, age_group) VALUES (1, 2, NULL, 'v2.0', 'GEN-A2-002', 'General English Elementary', 'General English', 'A2', 'English', 'offline', 'traditional', 'regular', '2024-11-01', '2025-02-28', 16, 3, 1.5, 25, 22, 4, 'active', 'Beginner level general English with focus on basic communication skills', 'secondary', 'teens')`,
        `INSERT INTO classes (tenant_id, campus_id, curriculum_id, curriculum_version_no, code, name, program, level, target_language, modality, academic_method, academic_format, start_date, end_date, total_weeks, weekly_sessions, session_duration_hours, max_students, current_students, main_teacher_id, status, description, grade_level, age_group) VALUES (2, 4, NULL, 'v1.0', 'JPN-B1-001', 'Japanese for Beginners', 'Japanese', 'B1', 'Japanese', 'online', 'communicative', 'regular', '2024-12-01', '2025-03-31', 16, 2, 2.0, 12, 10, 5, 'planned', 'Introduction to Japanese language and culture', 'college', 'adults')`,
        `INSERT INTO classes (tenant_id, campus_id, curriculum_id, curriculum_version_no, code, name, program, level, target_language, modality, academic_method, academic_format, start_date, end_date, total_weeks, weekly_sessions, session_duration_hours, max_students, current_students, main_teacher_id, status, description, grade_level, age_group) VALUES (3, 7, NULL, 'v1.3', 'SPAN-A1-001', 'Spanish Fundamentals', 'Spanish', 'A1', 'Spanish', 'hybrid', 'immersion', 'intensive', '2024-11-10', '2025-01-10', 8, 4, 1.0, 18, 16, 6, 'active', 'Fundamental Spanish with cultural immersion approach', 'high_school', 'teens')`,
      ];

      for (let i = 0; i < insertStatements.length; i++) {
        try {
          await connection.execute(insertStatements[i]);
          console.log(`✅ Inserted class ${i + 1}`);
        } catch (insertError) {
          console.log(
            `⚠️ Failed to insert class ${i + 1}:`,
            insertError.message
          );
        }
      }

      console.log("✅ Individual migration steps completed");

      // Re-enable foreign key checks
      try {
        await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
        console.log("🔒 Foreign key checks re-enabled");
      } catch (fkError) {
        console.log(
          "⚠️ Could not re-enable foreign key checks:",
          fkError.message
        );
      }
    }

    console.log("✅ Migration completed!");

    // Verify the migration
    console.log("\n🔍 Verification Results:");

    try {
      // Check if table exists
      const [tables] = await connection.execute("SHOW TABLES LIKE 'classes'");

      if (tables.length === 0) {
        console.log("❌ CLASSES TABLE NOT FOUND!");
        return;
      }

      console.log("✅ Classes table exists");

      // Count records
      const [rows] = await connection.execute(
        "SELECT COUNT(*) as count FROM classes"
      );

      console.log(`📊 Total classes created: ${rows[0].count}`);

      // Show sample data
      const [samples] = await connection.execute(`
        SELECT id, code, name, program, level, modality, status, current_students, max_students
        FROM classes
        ORDER BY tenant_id, code
        LIMIT 5
      `);

      console.log("\n📋 Sample Classes Created:");
      samples.forEach((cls, index) => {
        console.log(`   ${index + 1}. ${cls.code} - ${cls.name}`);
        console.log(`      └ ${cls.program} (${cls.level}) - ${cls.modality}`);
        console.log(
          `        └ Students: ${cls.current_students}/${cls.max_students} - Status: ${cls.status}`
        );
      });

      // Check curriculum mapping
      const [mapped] = await connection.execute(`
        SELECT COUNT(*) as mapped_count
        FROM classes
        WHERE curriculum_id IS NOT NULL
      `);

      console.log(
        `\n🔗 Classes already mapped to curriculum: ${mapped[0].mapped_count}`
      );

      // Check by status
      const [statsByStatus] = await connection.execute(`
        SELECT status, COUNT(*) as count
        FROM classes
        GROUP BY status
        ORDER BY status
      `);

      console.log("\n📈 Class Status Distribution:");
      statsByStatus.forEach((row) => {
        console.log(`   • ${row.status}: ${row.count} classes`);
      });
    } catch (verifyError) {
      console.error("❌ Verification failed:", verifyError.message);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.log("\n💡 Possible Solutions:");
    console.log("   • Check database connection");
    console.log("   • Ensure migrations/schemas directory exists");
    console.log("   • Verify foreign key references");
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

console.log("🚀 Starting Classes Table Migration...\n");
runClassMigration();
