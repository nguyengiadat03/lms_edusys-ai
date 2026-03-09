const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearCollectionsData() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    console.log('=== XÓA DỮ LIỆU COLLECTION ===');

    // Xóa dữ liệu trong các bảng liên quan đến collection theo thứ tự để tránh foreign key constraint
    console.log('1. Xóa document_collection_favorites...');
    await connection.execute('DELETE FROM document_collection_favorites');

    console.log('2. Xóa document_collection_permissions...');
    await connection.execute('DELETE FROM document_collection_permissions');

    console.log('3. Xóa document_collections...');
    await connection.execute('DELETE FROM document_collections');

    // Reset auto increment
    console.log('4. Reset AUTO_INCREMENT cho document_collections...');
    await connection.execute('ALTER TABLE document_collections AUTO_INCREMENT = 1');

    console.log('5. Reset AUTO_INCREMENT cho document_collection_permissions...');
    await connection.execute('ALTER TABLE document_collection_permissions AUTO_INCREMENT = 1');

    console.log('6. Reset AUTO_INCREMENT cho document_collection_favorites...');
    await connection.execute('ALTER TABLE document_collection_favorites AUTO_INCREMENT = 1');

    // Kiểm tra kết quả
    const [collections] = await connection.execute('SELECT COUNT(*) as count FROM document_collections');
    const [permissions] = await connection.execute('SELECT COUNT(*) as count FROM document_collection_permissions');
    const [favorites] = await connection.execute('SELECT COUNT(*) as count FROM document_collection_favorites');

    console.log('\n=== KẾT QUẢ SAU KHI XÓA ===');
    console.log(`document_collections: ${collections[0].count} records`);
    console.log(`document_collection_permissions: ${permissions[0].count} records`);
    console.log(`document_collection_favorites: ${favorites[0].count} records`);

    console.log('\n✅ Đã xóa sạch dữ liệu collection!');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearCollectionsData();