const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrismaRelationships() {
  try {
    console.log('Testing available relationships for curriculumFramework...');
    
    // Try to get one record with all possible includes to see what's available
    try {
      const framework = await prisma.curriculumFramework.findFirst({
        include: {
          // Try all possible relationships
          tenants: true,
          campuses: true,
          users: true,
          curriculumFrameworkTags: true,
          curriculumFrameworkVersions: true,
          kctMappings: true,
          kctUsageTracking: true,
          learningOutcomesTracking: true
        }
      });
      
      if (framework) {
        console.log('Available relationships found:');
        Object.keys(framework).forEach(key => {
          if (typeof framework[key] === 'object' && framework[key] !== null) {
            console.log(`- ${key}: ${Array.isArray(framework[key]) ? 'array' : 'object'}`);
          }
        });
      }
    } catch (error) {
      console.log('Error with full include:', error.message);
    }
    
    // Try minimal query
    console.log('\nTesting minimal query...');
    const frameworks = await prisma.curriculumFramework.findMany({
      where: {
        tenant_id: BigInt(1),
        deleted_at: null
      },
      take: 1
    });
    
    console.log('Minimal query successful, found', frameworks.length, 'records');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaRelationships();