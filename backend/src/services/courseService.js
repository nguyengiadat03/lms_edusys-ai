const prisma = require('../config/prisma').default;
const { createError } = require('../middleware/errorHandler');

class CourseService {
  async getCoursesByVersion(versionId, tenantId) {
    try {
      const courses = await prisma.course_blueprints.findMany({
        where: {
          version_id: BigInt(versionId),
          deleted_at: null,
          // Note: We'll need to check if the version belongs to the tenant
          // For now, let's just get the courses
        },
        include: {
          // Add any relationships that exist
        },
        orderBy: {
          order_index: 'asc'
        }
      });

      // Transform results
      const transformedCourses = courses.map(course => ({
        id: course.id.toString(),
        version_id: course.version_id.toString(),
        code: course.code,
        title: course.title,
        subtitle: course.subtitle,
        level: course.level,
        hours: course.hours,
        order_index: course.order_index,
        summary: course.summary,
        learning_outcomes: course.learning_outcomes,
        assessment_types: course.assessment_types,
        prerequisites: course.prerequisites,
        created_at: course.created_at,
        updated_at: course.updated_at,
        created_by: course.created_by?.toString(),
        updated_by: course.updated_by?.toString()
      }));

      return {
        data: transformedCourses,
        total: transformedCourses.length
      };

    } catch (error) {
      console.error('Error fetching courses by version:', error);
      throw createError('Failed to fetch courses', 'DATABASE_ERROR', 500);
    }
  }

  async list(filters, tenantId) {
    const {
      search,
      level,
      page = 1,
      pageSize = 20
    } = filters;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where = {
      deleted_at: null
    };

    // Apply filters
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { subtitle: { contains: search } },
        { summary: { contains: search } }
      ];
    }

    if (level) where.level = level;

    try {
      const [courses, total] = await Promise.all([
        prisma.course_blueprints.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.course_blueprints.count({ where })
      ]);

      // Transform results
      const transformedCourses = courses.map(course => ({
        id: course.id.toString(),
        version_id: course.version_id.toString(),
        code: course.code,
        title: course.title,
        subtitle: course.subtitle,
        level: course.level,
        hours: course.hours,
        order_index: course.order_index,
        summary: course.summary,
        learning_outcomes: course.learning_outcomes,
        assessment_types: course.assessment_types,
        prerequisites: course.prerequisites,
        created_at: course.created_at,
        updated_at: course.updated_at,
        created_by: course.created_by?.toString(),
        updated_by: course.updated_by?.toString()
      }));

      return {
        data: transformedCourses,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };

    } catch (error) {
      console.error('Error fetching courses:', error);
      throw createError('Failed to fetch courses', 'DATABASE_ERROR', 500);
    }
  }

  async get(id, tenantId) {
    try {
      const course = await prisma.course_blueprints.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null
        }
      });

      if (!course) {
        throw createError('Course not found', 'NOT_FOUND', 404);
      }

      return {
        id: course.id.toString(),
        version_id: course.version_id.toString(),
        code: course.code,
        title: course.title,
        subtitle: course.subtitle,
        level: course.level,
        hours: course.hours,
        order_index: course.order_index,
        summary: course.summary,
        learning_outcomes: course.learning_outcomes,
        assessment_types: course.assessment_types,
        prerequisites: course.prerequisites,
        created_at: course.created_at,
        updated_at: course.updated_at,
        created_by: course.created_by?.toString(),
        updated_by: course.updated_by?.toString()
      };

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error fetching course:', error);
      throw createError('Failed to fetch course', 'DATABASE_ERROR', 500);
    }
  }

  async create(data, userId, tenantId) {
    try {
      const course = await prisma.course_blueprints.create({
        data: {
          version_id: BigInt(data.version_id),
          code: data.code,
          title: data.title,
          subtitle: data.subtitle,
          level: data.level,
          hours: data.hours || 0,
          order_index: data.order_index || 0,
          summary: data.summary,
          learning_outcomes: data.learning_outcomes,
          assessment_types: data.assessment_types,
          prerequisites: data.prerequisites,
          created_by: userId,
          updated_by: userId
        }
      });

      return course;

    } catch (error) {
      console.error('Error creating course:', error);
      throw createError('Failed to create course', 'DATABASE_ERROR', 500);
    }
  }

  async update(id, data, userId, tenantId) {
    try {
      // Check if course exists
      const existingCourse = await prisma.course_blueprints.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null
        }
      });

      if (!existingCourse) {
        throw createError('Course not found', 'NOT_FOUND', 404);
      }

      // Update course
      const course = await prisma.course_blueprints.update({
        where: { id: BigInt(id) },
        data: {
          ...data,
          updated_by: userId,
          updated_at: new Date()
        }
      });

      return course;

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error updating course:', error);
      throw createError('Failed to update course', 'DATABASE_ERROR', 500);
    }
  }

  async delete(id, userId, tenantId) {
    try {
      // Check if course exists
      const existingCourse = await prisma.course_blueprints.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null
        }
      });

      if (!existingCourse) {
        throw createError('Course not found', 'NOT_FOUND', 404);
      }

      // Soft delete
      await prisma.course_blueprints.update({
        where: { id: BigInt(id) },
        data: {
          deleted_at: new Date(),
          updated_by: userId
        }
      });

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error deleting course:', error);
      throw createError('Failed to delete course', 'DATABASE_ERROR', 500);
    }
  }
}

const courseService = new CourseService();

module.exports = { courseService, CourseService };