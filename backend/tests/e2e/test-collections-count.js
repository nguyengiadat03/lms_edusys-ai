const { PrismaClient } = require('@prisma/client');

async function testCollectionsCount() {
  const prisma = new PrismaClient();

  try {
    const count = await prisma.document_collections.count();
    console.log('Collections count:', count);

    if (count === 0) {
      console.log('No collections found, creating a test collection...');

      const collection = await prisma.document_collections.create({
        data: {
          tenant_id: BigInt(1),
          name: 'Test Collection',
          description: 'Test collection for API testing',
          is_public: true,
          created_by: BigInt(1),
          updated_by: BigInt(1)
        }
      });

      console.log('Created test collection:', collection.id.toString());
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCollectionsCount();