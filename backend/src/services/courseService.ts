import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export interface CourseFilters {
  versionId?: number;
  search?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}

export interface CourseData {
  id: bigint;
  version_id: bigint;
  code?: string | null;
  title: string;
  subtitle?: string | null;
  level?: string | null;
  hours: number;
  order_index: number;
  summary?: string | null;
  learning_outcomes?: any;
  assessment_types?: any;
  prerequisites?: string | null;
  deleted_at?: Date | null;
  created_by?: bigint | null;
  updated_by?: bigint | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCourseRequest {
  title: string;
  subtitle?: string;
  level?: string;
  hours?: number;
  order_index?: number;
  summary?: string;
  learning_outcomes?: any;
  assessment_types?: any;
  prerequisites?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  subtitle?: string;
  level?: string;
  hours?: number;
  order_index?: number;
  summary?: string;
  learning_outcomes?: any;
  assessment_types?: any;
  prerequisites?: string;
}

export class CourseService {
  async getCoursesByVersion(versionId: number, tenantId: bigint) {
    try {
      const courses = await prisma.course_blueprints.findMany({
        where: {
          version_id: BigInt(versionId),
          deleted_at: null,
          version: {
            framework: {
              tenant_id: tenantId
            }
          }
        },
        include: {
          version: {
            include: {
              framework: {
                select: {
                  name: true,
                  tenant_id: true
                }
              }
            }
          },
          created_by_user: {
            select: {
              full_name: true
            }
          },
          unit_blueprints: {
            where: {
              deleted_at: null
            },
            orderBy: {
              order_index: 'asc'
            }
          }
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
        learning_outcomes: this.parseJson(course.learning_outcomes, []),
        assessment_types: this.parseJson(course.assessment_types, []),
        prerequisites: course.prerequisites,
        created_at: course.created_at,
        updated_at: course.updated_at,
        created_by_name: course.created_by_user?.full_name,
        framework_name: course.version.framework.name,
        version_no: course.version.version_no,
        version_state: course.version.state,
        units_count: course.unit_blueprints.length
      }));

      return transformedCourses;

    } catch (error) {
      console.error('Error fetching courses by version:', error);
      throw createError('Failed to fetch courses', 'DATABASE_ERROR', 500);
    }
  }

  async get(id: string, tenantId: bigint) {
    try {
      const course = await prisma.courseBlueprints.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
          version: {
            framework: {
              tenant_id: tenantId
            }
          }
        },
        include: {
          version: {
            include: {
              framework: {
                select: {
                  name: true,
                  tenant_id: true
                }
              }
            }
          },
          created_by_user: {
            select: {
              full_name: true
            }
          },
          unit_blueprints: {
            where: {
              deleted_at: null
            },
            orderBy: {
              order_index: 'asc'
            },
            include: {
              unit_resources: {
                where: {
                  deleted_at: null
                }
              }
            }
          }
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
        learning_outcomes: this.parseJson(course.learning_outcomes, []),
        assessment_types: this.parseJson(course.assessment_types, []),
        prerequisites: course.prerequisites,
        created_at: course.created_at,
        updated_at: course.updated_at,
        created_by_name: course.created_by_user?.full_name,
        framework_name: course.version.framework.name,
        version_no: course.version.version_no,
        version_state: course.version.state,
        unit_blueprints: course.unit_blueprints.map(unit => ({
          id: unit.id.toString(),
          title: unit.title,
          subtitle: unit.subtitle,
          hours: unit.hours,
          order_index: unit.order_index,
          completeness_score: unit.completeness_score,
          resources_count: unit.unit_resources.length
        }))
      };

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error fetching course:', error);
      throw createError('Failed to fetch course', 'DATABASE_ERROR', 500);
    }
  }

  async create(versionId: number, data: CreateCourseRequest, userId: bigint, tenantId: bigint) {
    try {
      // Verify version exists and belongs to tenant
      const version = await prisma.curriculumFrameworkVersion.findFirst({
        where: {
          id: BigInt(versionId),
          framework: {
            tenant_id: tenantId
          }
        }
      });

      if (!version) {
        throw createError('Version not found', 'NOT_FOUND', 404);
      }

      // Get next order index
      const lastCourse = await prisma.courseBlueprint.findFirst({
        where: {
          version_id: BigInt(versionId),
          deleted_at: null
        },
        orderBy: {
          order_index: 'desc'
        }
      });

      const nextOrderIndex = lastCourse ? lastCourse.order_index + 1 : 0;

      const course = await prisma.courseBlueprint.create({
        data: {
          version_id: BigInt(versionId),
          code: data.code || null,
          title: data.title,
          subtitle: data.subtitle,
          level: data.level,
          hours: data.hours || 0,
          order_index: data.order_index ?? nextOrderIndex,
          summary: data.summary,
          learning_outcomes: data.learning_outcomes ? JSON.stringify(data.learning_outcomes) : null,
          assessment_types: data.assessment_types ? JSON.stringify(data.assessment_types) : null,
          prerequisites: data.prerequisites,
          created_by: userId,
          updated_by: userId
        }
      });

      return course;

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error creating course:', error);
      throw createError('Failed to create course', 'DATABASE_ERROR', 500);
    }
  }

  async update(id: string, data: UpdateCourseRequest, userId: bigint, tenantId: bigint) {
    try {
      // Check if course exists and belongs to tenant
      const existingCourse = await prisma.courseBlueprint.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
          version: {
            framework: {
              tenant_id: tenantId
            }
          }
        }
      });

      if (!existingCourse) {
        throw createError('Course not found', 'NOT_FOUND', 404);
      }

      // Update course
      const updateData: any = {
        updated_by: userId,
        updated_at: new Date()
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
      if (data.level !== undefined) updateData.level = data.level;
      if (data.hours !== undefined) updateData.hours = data.hours;
      if (data.order_index !== undefined) updateData.order_index = data.order_index;
      if (data.summary !== undefined) updateData.summary = data.summary;
      if (data.learning_outcomes !== undefined) updateData.learning_outcomes = data.learning_outcomes ? JSON.stringify(data.learning_outcomes) : null;
      if (data.assessment_types !== undefined) updateData.assessment_types = data.assessment_types ? JSON.stringify(data.assessment_types) : null;
      if (data.prerequisites !== undefined) updateData.prerequisites = data.prerequisites;

      const course = await prisma.courseBlueprint.update({
        where: { id: BigInt(id) },
        data: updateData
      });

      return course;

    } catch (error) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error updating course:', error);
      throw createError('Failed to update course', 'DATABASE_ERROR', 500);
    }
  }

  async delete(id: string, userId: bigint, tenantId: bigint) {
    try {
      // Check if course exists and belongs to tenant
      const existingCourse = await prisma.courseBlueprint.findFirst({
        where: {
          id: BigInt(id),
          deleted_at: null,
          version: {
            framework: {
              tenant_id: tenantId
            }
          }
        }
      });

      if (!existingCourse) {
        throw createError('Course not found', 'NOT_FOUND', 404);
      }

      // Soft delete
      await prisma.courseBlueprint.update({
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

  private parseJson(value: any, fallback: any) {
    if (value === null || value === undefined) return fallback;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return fallback;
    }
  }
}

export const courseService = new CourseService();