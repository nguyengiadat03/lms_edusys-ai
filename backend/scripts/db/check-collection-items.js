const { PrismaClient } = require('@prisma/client');

async function checkCollectionItems() {
  const prisma = new PrismaClient();

  try {
    const items = await prisma.document_collection_items.findMany({
      include: {
        documents: {
          select: {
            id: true,
            name: true
          }
        },
        document_collections: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    console.log('Document collection items count:', items.length);

    if (items.length > 0) {
      console.log('Collection items found:');
      items.forEach(item => {
        console.log(`- ID: ${item.id}, Collection: ${item.document_collections.name} (${item.collection_id}), Document: ${item.documents.name} (${item.document_id}), Added: ${item.added_at}`);
      });
    } else {
      console.log('No collection items found in database');
    }
  } catch (error) {
    console.error('Error checking collection items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollectionItems();