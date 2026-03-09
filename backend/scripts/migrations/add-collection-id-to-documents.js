const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCollectionIdToDocuments() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    console.log('=== THÊM CỘT collection_id VÀO BẢNG documents ===');

    // Kiểm tra xem cột đã tồn tại chưa
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM documents LIKE 'collection_id'"
    );

    if (columns.length === 0) {
      console.log('1. Thêm cột collection_id vào bảng documents...');
      await connection.execute(`
        ALTER TABLE documents
        ADD COLUMN collection_id BIGINT UNSIGNED NULL,
        ADD CONSTRAINT fk_documents_collection_id
        FOREIGN KEY (collection_id) REFERENCES document_collections(id) ON DELETE SET NULL
      `);
      console.log('✅ Đã thêm cột collection_id thành công!');
    } else {
      console.log('⚠️ Cột collection_id đã tồn tại');
    }

    // Tạo index cho collection_id
    console.log('2. Tạo index cho collection_id...');
    try {
      await connection.execute(`
        CREATE INDEX idx_documents_collection_id ON documents(collection_id)
      `);
      console.log('✅ Đã tạo index cho collection_id');
    } catch (indexError) {
      console.log('⚠️ Index đã tồn tại hoặc lỗi:', indexError.message);
    }

    // Kiểm tra kết quả
    const [newColumns] = await connection.execute(
      "SHOW COLUMNS FROM documents LIKE 'collection_id'"
    );

    if (newColumns.length > 0) {
      console.log('\n=== CỘT collection_id ĐÃ ĐƯỢC THÊM ===');
      console.log('Cột:', newColumns[0]);
    }

    console.log('\n✅ Hoàn thành! Bảng documents giờ có thể lưu collection_id');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addCollectionIdToDocuments();