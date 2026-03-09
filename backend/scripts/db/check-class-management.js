const mysql = require("mysql2/promise");

async function checkClassManagement() {
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
    const tableNames = tables.map((table) => Object.values(table)[0]);

    console.log("\n🔍 BẢNG LIÊN QUAN ĐẾN CLASS MANAGEMENT:");

    // Check for common class management patterns
    const classRelatedTables = tableNames.filter(
      (table) =>
        table.toLowerCase().includes("class") ||
        table.toLowerCase().includes("lop") ||
        table.toLowerCase().includes("group") ||
        table.toLowerCase().includes("batch") ||
        table.toLowerCase().includes("cohort") ||
        table.toLowerCase().includes("section") ||
        table.toLowerCase().includes("enrollment") ||
        table.toLowerCase().includes("student") ||
        table.toLowerCase().includes("schedule") ||
        table.toLowerCase().includes("calendar") ||
        table.toLowerCase().includes("attendance")
    );

    if (classRelatedTables.length === 0) {
      console.log("❌ Không tìm thấy bảng nào liên quan đến class management!");
      console.log(
        "\n📋 Từ góc nhìn ứng dụng frontend, chúng ta có components:"
      );
      console.log("   • ClassManagementPage.tsx");
      console.log("   • ClassCard.tsx");
      console.log("   • ClassOverview.tsx");
      console.log("   • AttendanceManagement.tsx");
      console.log("   • ScheduleCalendar.tsx");
      console.log("   → Nhưng database chưa có backend tables!");
    } else {
      console.log("✅ Tìm thấy bảng liên quan class management:");
      for (const tableName of classRelatedTables) {
        console.log(`\n🗄️ Bảng: ${tableName}`);

        try {
          // Check record count
          const [rows] = await connection.execute(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );
          console.log(`   📊 Số records: ${rows[0].count}`);

          // Show some sample data structure
          const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
          console.log("   📋 Cấu trúc bảng:");

          // Show first 5 columns only
          columns.slice(0, 5).forEach((col) => {
            const nullable = col.Null === "YES" ? "NULL" : "NOT NULL";
            console.log(`     - ${col.Field}: ${col.Type} ${nullable}`);
          });

          if (columns.length > 5) {
            console.log(`     ... và ${columns.length - 5} cột khác`);
          }
        } catch (error) {
          console.log(`   ❌ Lỗi truy cập bảng: ${error.message}`);
        }
      }
    }

    // Check specific tables that might contain class-like data
    console.log("\n🔎 KIỂM TRA CÁC BẢNG CÓ THỂ CHỨA DỮ LIỆU CLASS:");

    const potentiallyClassTables = {
      users: {
        reason: "Có thể chứa học sinh / giáo viên (students/teachers)",
        checkField: "role",
      },
      assignments: {
        reason: "Assignments có thể được gán cho classes",
        checkField: "assigned_to",
      },
      campuses: {
        reason: "Campuses có thể chứa class groups",
        checkField: "name",
      },
    };

    for (const [tableName, info] of Object.entries(potentiallyClassTables)) {
      if (tableNames.includes(tableName)) {
        try {
          // Check record count
          const [rows] = await connection.execute(
            `SELECT COUNT(*) as count FROM ${tableName}`
          );

          console.log(`\n📝 ${tableName} (${rows[0].count} records)`);
          console.log(`   Lý do: ${info.reason}`);

          // Check for relevant data
          const [sampleData] = await connection.execute(
            `SELECT * FROM ${tableName} LIMIT 3`
          );

          if (sampleData.length > 0) {
            console.log("   📋 Sample data:");
            const fields = Object.keys(sampleData[0])
              .filter(
                (f) =>
                  f.includes(info.checkField.split("_")[0]) ||
                  f.includes(info.checkField.split("_")[1]) ||
                  f.includes("name") ||
                  f.includes("email")
              )
              .slice(0, 3);

            sampleData.forEach((row, index) => {
              console.log(`     Record ${index + 1}:`);
              fields.forEach((field) => {
                if (row[field] !== null && row[field] !== undefined) {
                  console.log(`       ${field}: ${JSON.stringify(row[field])}`);
                }
              });
            });
          }
        } catch (error) {
          console.log(`   ❌ Lỗi truy vấn ${tableName}: ${error.message}`);
        }
      }
    }

    // Final assessment
    console.log("\n📊 TỔNG KẾT CLASS MANAGEMENT:");

    const hasClassTable = tableNames.some(
      (table) =>
        table.toLowerCase().includes("class") ||
        table.toLowerCase().includes("lop")
    );

    if (hasClassTable) {
      console.log("✅ Có bảng classes - sẵn sàng cho quản lý");
    } else {
      console.log("❌ Không có bảng classes chuyên dụng");
      console.log("⚠️ Cần tạo bảng classes để:");
      console.log("   • Quản lý thông tin lớp học");
      console.log("   • Mapping với curriculum frameworks");
      console.log("   • Track attendance và schedules");
      console.log("   • Manage students enrollment");

      console.log("\n💡 Front-end Class Management components hiện tại:");
      console.log("   - ClassManagementPage");
      console.log("   - ClassCard, ClassOverview");
      console.log("   - AttendanceManagement, ScheduleCalendar");
      console.log("   → Đang chạy với mock data!");
    }
  } catch (error) {
    console.error("❌ Error connecting to database:", error.message);
    console.log("\n🔄 Database có thể đang không khả dụng");
    console.log("   • Kiểm tra kết nối mạng");
    console.log("   • Kiểm tra database server");
    console.log("   • Thử lại sau");
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkClassManagement();
