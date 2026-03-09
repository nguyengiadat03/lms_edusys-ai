const { PrismaClient } = require('@prisma/client');

async function clearDocumentCollections() {
  const prisma = new PrismaClient();

  try {
    console.log('Clearing document collections...');

    // Delete related records first due to foreign key constraints
    await prisma.document_collection_favorites.deleteMany({});
    console.log('Deleted document_collection_favorites');

    await prisma.document_collection_permissions.deleteMany({});
    console.log('Deleted document_collection_permissions');

    // Delete main table records
    const result = await prisma.document_collections.deleteMany({});
    console.log(`Deleted ${result.count} document collections`);

    console.log('All document collections cleared successfully!');
  } catch (error) {
    console.error('Error clearing document collections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDocumentCollections();