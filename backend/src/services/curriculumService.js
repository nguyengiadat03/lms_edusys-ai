const prisma = require('../config/prisma').default;
const { createError } = require('../middleware/errorHandler');

class CurriculumService {
  async list(filters, tenantId) {
    const {
      status,
      language,
      age_group,
      target_level,
      owner_user_id,
      campus_id,
      tag,
      q,
      page = 1,
      page_size = 20
    } = filters;

    const skip = (page - 1) * page_size;

    // Build where clause
    const where = {
      tenant_id: tenantId,
      deleted_at: null
    };

    // Status filter
    if (status && status.length > 0) {
      where.status = status.length === 1 ? status[0] : { in: status };
    }

    // Other filters
    if (language) where.language = language;
    if (age_group) where.age_group = age_group;
    if (target_level) where.target_level = target_level;
    if (owner_user_id) where.owner_user_id = BigInt(owner_user_id);
    if (campus_id) where.campus_id = BigInt(campus_id);

    // Search query
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { description: { contains: q } }
      ];
    }

    // Tag filtering - need to use include with where
    const include = {
      users: {
        select: {
          full_name: true
        }
      },
      curriculum_framework_tags: tag ? {
        where: {
          tags: {
            name: tag
          }
        },
        include: {
          tags: true
        }
      } : {
        include: {
          tags: true
        }
      }
    };

    // If filtering by tag, we need to ensure only frameworks with that tag are returned
    if (tag) {
      where.curriculum_framework_tags = {
        some: {
          tags: {
            name: tag
          }
        }
      };
    }

    try {
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

      return {
        data: transformedFrameworks,
        pagination: {
          page,
          page_size,
          total,
          total_pages: Math.ceil(total / page_size)
        }
      };

    } catch (error) {
      console.error('Error fetching curriculum frameworks:', error);
      throw createError('Failed to fetch curriculum frameworks', 'DATABASE_ERROR', 500);
    }
  }

  async get(id, tenantId) {
    try {
      const framework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: BigInt(id),
          tenant_id: tenantId,
          deleted_at: null
        },
        include: {
          users: {
            select: {
              full_name: true
            }
          },
          curriculum_framework_tags: {
            include: {
              tags: true
            }
          },
          curriculum_framework_versions: {
            where: {
              deleted_at: null
            },
            orderBy: {
              created_at: 'desc'
            },
            take: 1
          }
        }
      });

      if (!framework) {
        throw createError('Curriculum framework not found', 'NOT_FOUND', 404);
      }

      return {
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
        tags: framework.curriculum_framework_tags?.map((t) => t.tags.name) || [],
        latest_version: framework.curriculum_framework_versions[0] || null
      };

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error fetching curriculum framework:', error);
      throw createError('Failed to fetch curriculum framework', 'DATABASE_ERROR', 500);
    }
  }

  async create(data, userId, tenantId) {
    const { tags, ...frameworkData } = data;

    try {
      // Check if code already exists
      const existingFramework = await prisma.curriculum_frameworks.findFirst({
        where: {
          code: data.code,
          tenant_id: tenantId,
          deleted_at: null
        }
      });

      if (existingFramework) {
        throw createError('Framework code already exists', 'DUPLICATE_CODE', 409);
      }

      const framework = await prisma.curriculum_frameworks.create({
        data: {
          tenant_id: tenantId,
          campus_id: data.campus_id ? BigInt(data.campus_id) : null,
          code: data.code,
          name: data.name,
          language: data.language,
          target_level: data.target_level,
          age_group: data.age_group,
          total_hours: 0, // Default value
          status: 'draft',
          owner_user_id: userId,
          description: data.description,
          learning_objectives: data.learning_objectives,
          prerequisites: data.prerequisites,
          assessment_strategy: data.assessment_strategy,
          created_by: userId,
          updated_by: userId
        }
      });

      // Add tags if provided
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Find or create tag
          let tag = await prisma.tags.findFirst({
            where: {
              tenant_id: tenantId,
              name: tagName
            }
          });

          if (!tag) {
            tag = await prisma.tags.create({
              data: {
                tenant_id: tenantId,
                name: tagName,
                created_by: userId
              }
            });
          }

          // Create framework-tag relationship
          await prisma.curriculum_framework_tags.create({
            data: {
              framework_id: framework.id,
              tag_id: tag.id
            }
          });
        }
      }

      return framework;

    } catch (error) {
      if (error.code === 'DUPLICATE_CODE') throw error;
      console.error('Error creating curriculum framework:', error);
      throw createError('Failed to create curriculum framework', 'DATABASE_ERROR', 500);
    }
  }

  async update(id, data, userId, tenantId) {
    const { tags, ...updateData } = data;

    try {
      // Check if framework exists
      const existingFramework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: BigInt(id),
          tenant_id: tenantId,
          deleted_at: null
        }
      });

      if (!existingFramework) {
        throw createError('Curriculum framework not found', 'NOT_FOUND', 404);
      }

      // Update framework
      const framework = await prisma.curriculum_frameworks.update({
        where: { id: BigInt(id) },
        data: {
          ...updateData,
          campus_id: data.campus_id ? BigInt(data.campus_id) : undefined,
          age_group: data.age_group,
          status: data.status,
          updated_by: userId,
          updated_at: new Date()
        }
      });

      // Update tags if provided
      if (tags !== undefined) {
        // Remove existing tags
        await prisma.curriculum_framework_tags.deleteMany({
          where: { framework_id: BigInt(id) }
        });

        // Add new tags
        if (tags.length > 0) {
          for (const tagName of tags) {
            // Find or create tag
            let tag = await prisma.tags.findFirst({
              where: {
                tenant_id: tenantId,
                name: tagName
              }
            });

            if (!tag) {
              tag = await prisma.tags.create({
                data: {
                  tenant_id: tenantId,
                  name: tagName,
                  created_by: userId
                }
              });
            }

            // Create framework-tag relationship
            await prisma.curriculum_framework_tags.create({
              data: {
                framework_id: BigInt(id),
                tag_id: tag.id
              }
            });
          }
        }
      }

      return framework;

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error updating curriculum framework:', error);
      throw createError('Failed to update curriculum framework', 'DATABASE_ERROR', 500);
    }
  }

  async delete(id, userId, tenantId) {
    try {
      // Check if framework exists
      const existingFramework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: BigInt(id),
          tenant_id: tenantId,
          deleted_at: null
        }
      });

      if (!existingFramework) {
        throw createError('Curriculum framework not found', 'NOT_FOUND', 404);
      }

      // Soft delete
      await prisma.curriculum_frameworks.update({
        where: { id: BigInt(id) },
        data: {
          deleted_at: new Date(),
          updated_by: userId
        }
      });

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error deleting curriculum framework:', error);
      throw createError('Failed to delete curriculum framework', 'DATABASE_ERROR', 500);
    }
  }
}

const curriculumService = new CurriculumService();

module.exports = { curriculumService, CurriculumService };