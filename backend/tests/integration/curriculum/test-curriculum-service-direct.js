// Test the curriculum service directly without TypeScript compilation
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock the createError function
function createError(message, code, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

async function testCurriculumServiceDirect() {
  try {
    console.log('Testing curriculum service list method directly...');
    
    const tenantId = BigInt(1);
    const filters = {
      page: 1,
      page_size: 20
    };
    
    const { page = 1, page_size = 20 } = filters;
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

    console.log('Running Prisma query...');
    
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

    console.log('Prisma query successful!');
    console.log('Total frameworks:', total);
    console.log('Frameworks returned:', frameworks.length);

    // Transform results to match expected format
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

    const result = {
      data: transformedFrameworks,
      pagination: {
        page,
        page_size,
        total,
        total_pages: Math.ceil(total / page_size)
      }
    };

    console.log('Final result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error in curriculum service test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurriculumServiceDirect();