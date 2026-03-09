const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseCollections() {
  let connection;

  try {
    // Sử dụng thông tin từ .env
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    console.log('=== KIỂM TRA CỘT TRONG BẢNG document_collections ===');

    // Kiểm tra cấu trúc bảng document_collections
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM document_collections"
    );

    console.log('Cột trong document_collections:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default ? `Default: ${col.Default}` : ''}`);
    });

    // Kiểm tra dữ liệu mẫu
    const [rows] = await connection.execute(
      "SELECT * FROM document_collections LIMIT 3"
    );

    console.log('\nDữ liệu mẫu:');
    rows.forEach(row => {
      console.log(JSON.stringify(row, null, 2));
    });

    // Kiểm tra xem có cột collection_id trong documents không
    console.log('\n=== KIỂM TRA CỘT collection_id TRONG documents ===');

    const [docColumns] = await connection.execute(
      "SHOW COLUMNS FROM documents WHERE Field = 'collection_id'"
    );

    if (docColumns.length > 0) {
      console.log('✅ Cột collection_id đã tồn tại trong bảng documents');
      console.log(`   Type: ${docColumns[0].Type}, Null: ${docColumns[0].Null}`);

      // Kiểm tra documents có collection_id
      const [docsWithCollections] = await connection.execute(
        "SELECT COUNT(*) as count FROM documents WHERE collection_id IS NOT NULL"
      );

      console.log(`   Số documents có collection_id: ${docsWithCollections[0].count}`);

      // Kiểm tra documents không có collection_id
      const [docsWithoutCollections] = await connection.execute(
        "SELECT COUNT(*) as count FROM documents WHERE collection_id IS NULL"
      );

      console.log(`   Số documents không có collection_id: ${docsWithoutCollections[0].count}`);

    } else {
      console.log('❌ Cột collection_id chưa tồn tại trong bảng documents');
    }

  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseCollections();