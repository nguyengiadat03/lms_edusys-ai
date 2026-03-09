const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkActualDatabaseCollections() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    console.log('=== KIỂM TRA DATABASE THỰC TẾ - CÁC BẢNG COLLECTION ===\n');

    // 1. Liệt kê tất cả các bảng có chứa "collection"
    console.log('1. TẤT CẢ BẢNG CÓ CHỨA "COLLECTION":');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE '%collection%'
    `);

    if (tables.length === 0) {
      console.log('❌ Không tìm thấy bảng nào có chứa "collection"');
    } else {
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`📋 Bảng: ${tableName}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Kiểm tra từng bảng collection cụ thể
    const collectionTables = [
      'document_collections',
      'document_collection_permissions',
      'document_collection_favorites',
      'document_collection_items'
    ];

    for (const tableName of collectionTables) {
      console.log(`2. KIỂM TRA BẢNG: ${tableName.toUpperCase()}`);

      try {
        // Kiểm tra cấu trúc bảng
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log(`📊 Cấu trúc bảng ${tableName}:`);
        columns.forEach(col => {
          console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Default ? `Default: ${col.Default}` : ''} ${col.Key ? `Key: ${col.Key}` : ''}`);
        });

        // Đếm số bản ghi
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult[0].count;
        console.log(`📈 Số bản ghi: ${count}`);

        // Hiển thị một vài bản ghi mẫu nếu có
        if (count > 0) {
          const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
          console.log(`📝 Dữ liệu mẫu:`);
          sampleData.forEach((row, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(row, null, 2)}`);
          });
        }

      } catch (tableError) {
        console.log(`❌ Lỗi truy vấn bảng ${tableName}: ${tableError.message}`);
      }

      console.log('\n' + '-'.repeat(40) + '\n');
    }

    // 3. Kiểm tra cột collection_id trong bảng documents
    console.log('3. KIỂM TRA CỘT collection_id TRONG BẢNG documents');
    try {
      const [docColumns] = await connection.execute("SHOW COLUMNS FROM documents LIKE 'collection_id'");
      if (docColumns.length > 0) {
        console.log('✅ Cột collection_id đã tồn tại trong documents:');
        console.log(`   - Field: ${docColumns[0].Field}`);
        console.log(`   - Type: ${docColumns[0].Type}`);
        console.log(`   - Null: ${docColumns[0].Null}`);
        console.log(`   - Key: ${docColumns[0].Key}`);
        console.log(`   - Default: ${docColumns[0].Default}`);
        console.log(`   - Extra: ${docColumns[0].Extra}`);

        // Đếm số documents có collection_id
        const [collectionCount] = await connection.execute(`
          SELECT
            COUNT(CASE WHEN collection_id IS NOT NULL THEN 1 END) as with_collection,
            COUNT(CASE WHEN collection_id IS NULL THEN 1 END) as without_collection,
            COUNT(*) as total
          FROM documents
        `);
        const stats = collectionCount[0];
        console.log(`📊 Thống kê collection_id trong documents:`);
        console.log(`   - Có collection_id: ${stats.with_collection}`);
        console.log(`   - Không có collection_id: ${stats.with_collection}`);
        console.log(`   - Tổng số documents: ${stats.total}`);

      } else {
        console.log('❌ Cột collection_id KHÔNG tồn tại trong documents');
      }
    } catch (docError) {
      console.log(`❌ Lỗi kiểm tra documents: ${docError.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Kiểm tra các foreign key constraints
    console.log('4. KIỂM TRA FOREIGN KEY CONSTRAINTS');
    try {
      const [constraints] = await connection.execute(`
        SELECT
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_SCHEMA = ? AND TABLE_NAME LIKE '%collection%'
        ORDER BY TABLE_NAME, COLUMN_NAME
      `, [process.env.DB_DATABASE]);

      if (constraints.length > 0) {
        console.log('🔗 Foreign Key Constraints liên quan đến collection:');
        constraints.forEach(constraint => {
          console.log(`   ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
        });
      } else {
        console.log('⚠️ Không tìm thấy foreign key constraints nào liên quan đến collection');
      }
    } catch (fkError) {
      console.log(`❌ Lỗi kiểm tra foreign keys: ${fkError.message}`);
    }

  } catch (error) {
    console.error('❌ Lỗi kết nối database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkActualDatabaseCollections();