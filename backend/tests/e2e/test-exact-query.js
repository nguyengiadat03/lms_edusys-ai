const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testExactQuery() {
  try {
    console.log('Testing exact query from curriculum service...');
    
    const tenantId = BigInt(1);
    const page = 1;
    const page_size = 20;
    const skip = (page - 1) * page_size;

    // Build where clause exactly as in the service
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

    console.log('Running query...');
    
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
    
    // Transform results exactly as in the service
    const transformedFrameworks = frameworks.map((framework) => ({
      id: framework.id.toString(),
      code: framework.code,
      name: framework.name,
      language: framework.language,
      target_level: framework.target_level,
      age_group: framework.age_group,
      total_hours: framework.total_hours,
      status: framework.status,
      owner_user_id: framework.owner_user_id?.toString(),
      latest_version_id: framework.latest_version_id?.toString(),
      description: framework.description,
      learning_objectives: framework.learning_objectives,
      prerequisites: framework.prerequisites,
      assessment_strategy: framework.assessment_strategy,
      created_at: framework.created_at,
      updated_at: framework.updated_at,
      owner_name: framework.users?.full_name || null,
      tags: framework.curriculum_framework_tags?.map((t) => t.tags.name) || []
    }));

    console.log('Transformation successful!');
    console.log('First transformed framework:', JSON.stringify(transformedFrameworks[0], null, 2));
    
  } catch (error) {
    console.error('Error in exact query test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExactQuery();