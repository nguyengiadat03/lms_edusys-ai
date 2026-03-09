const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCurriculumQuery() {
  try {
    console.log('Testing basic query...');
    
    // Test basic query without includes
    const frameworks = await prisma.curriculum_frameworks.findMany({
      where: {
        tenant_id: BigInt(1),
        deleted_at: null
      }
    });
    
    console.log('Basic query successful:', frameworks.length, 'records');
    
    // Test with user relationship
    console.log('Testing with user relationship...');
    try {
      const frameworksWithUser = await prisma.curriculum_frameworks.findMany({
        where: {
          tenant_id: BigInt(1),
          deleted_at: null
        },
        include: {
          users_curriculum_frameworks_owner_user_idTousers: {
            select: {
              full_name: true
            }
          }
        }
      });
      console.log('User relationship query successful:', frameworksWithUser.length, 'records');
    } catch (error) {
      console.error('User relationship query failed:', error.message);
    }
    
    // Test with tags relationship
    console.log('Testing with tags relationship...');
    try {
      const frameworksWithTags = await prisma.curriculum_frameworks.findMany({
        where: {
          tenant_id: BigInt(1),
          deleted_at: null
        },
        include: {
          curriculum_framework_tags: {
            include: {
              tags: true
            }
          }
        }
      });
      console.log('Tags relationship query successful:', frameworksWithTags.length, 'records');
    } catch (error) {
      console.error('Tags relationship query failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurriculumQuery();