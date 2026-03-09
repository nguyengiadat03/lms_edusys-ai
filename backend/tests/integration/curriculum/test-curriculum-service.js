const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCurriculumService() {
  try {
    console.log('Testing curriculum service query...');
    
    const tenantId = BigInt(1);
    const page = 1;
    const page_size = 20;
    const skip = (page - 1) * page_size;

    // Build where clause
    const where = {
      tenant_id: tenantId,
      deleted_at: null
    };

    // Tag filtering - need to use include with where
    const include = {
      users: {
        select: {
          full_name: true
        }
      },
      curriculum_framework_tags: {
        include: {
          tags: true
        }
      }
    };

    console.log('Where clause:', JSON.stringify(where, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));
    console.log('Include clause:', JSON.stringify(include, null, 2));

    const [frameworks, total] = await Promise.all([
      prisma.curriculum_frameworks.findMany({
        where,
        include,
        orderBy: { updated_at: 'desc' },
        skip,
        take: page_size
      }),
      prisma.curriculum_frameworks.count({ where })
    ]);

    console.log('Query successful!');
    console.log('Total frameworks:', total);
    console.log('Frameworks returned:', frameworks.length);
    
    if (frameworks.length > 0) {
      console.log('First framework:', JSON.stringify(frameworks[0], (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));
    }
    
  } catch (error) {
    console.error('Error in curriculum service test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurriculumService();