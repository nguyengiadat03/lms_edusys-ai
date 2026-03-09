const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCollections() {
  try {
    console.log('=== KIỂM TRA CÁC BẢNG COLLECTION ===');

    // Kiểm tra document_collections
    const collections = await prisma.document_collections.findMany({
      include: {
        document_collection_permissions: true,
        document_collection_favorites: true
      }
    });

    console.log(`\nTìm thấy ${collections.length} collections:`);
    collections.forEach(collection => {
      console.log(`\nCollection: ${collection.name} (ID: ${collection.id})`);
      console.log(`  - Mô tả: ${collection.description || 'Không có'}`);
      console.log(`  - Public: ${collection.is_public}`);
      console.log(`  - Số permissions: ${collection.document_collection_permissions.length}`);
      console.log(`  - Số favorites: ${collection.document_collection_favorites.length}`);
    });

    // Vì chưa generate Prisma client mới, chúng ta sẽ kiểm tra bằng SQL trực tiếp
    console.log(`\n=== CẦN GENERATE PRISMA CLIENT TRƯỚC ===`);
    console.log(`Chạy lệnh: npx prisma generate`);
    console.log(`Sau đó chạy lại script này để kiểm tra documents với collection_id`);

  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollections();