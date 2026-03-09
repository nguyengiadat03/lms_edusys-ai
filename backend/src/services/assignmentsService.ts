import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

export interface AssignmentFilters {
  search?: string;
  level?: string;
  skill?: string;
  type?: string;
  difficulty?: string;
  visibility?: string;
  page?: number;
  pageSize?: number;
}

export interface AssignmentData {
  id: bigint;
  tenant_id: bigint;
  title: string;
  level?: string | null;
  skill?: string | null;
  duration_minutes: number;
  type?: string | null;
  description?: string | null;
  tags?: any;
  difficulty?: string | null;
  visibility: string;
  objectives?: any;
  rubric?: any;
  attachments?: any;
  content_type?: string | null;
  content?: any;
  version_number: number;
  parent_id?: bigint | null;
  is_latest: boolean;
  version_notes?: string | null;
  created_by: bigint;
  updated_by: bigint;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateAssignmentRequest {
  title: string;
  level?: string;
  skill?: string;
  duration_minutes?: number;
  type?: string;
  description?: string;
  tags?: string[];
  difficulty?: string;
  visibility?: string;
  objectives?: any;
  rubric?: any;
  attachments?: any;
  content_type?: string;
  content?: any;
  version_notes?: string;
  tenant_id: bigint; // Added missing property
  created_by: bigint; // Added missing property
  updated_by: bigint; // Added missing property
}

export interface UpdateAssignmentRequest {
  title?: string;
  level?: string;
  skill?: string;
  duration_minutes?: number;
  type?: string;
  description?: string;
  tags?: string[];
  difficulty?: string;
  visibility?: string;
  objectives?: any;
  rubric?: any;
  attachments?: any;
  content_type?: string;
  content?: any;
  version_notes?: string;
}

export class AssignmentsService {
  async list(filters: AssignmentFilters, userId: bigint, tenantId: bigint) {
    const {
      search,
      level,
      skill,
      type,
      difficulty,
      visibility,
      page = 1,
      pageSize = 20
    } = filters;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      tenant_id: tenantId,
      deleted_at: null
    };

    // Apply filters
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (level) where.level = level;
    if (skill) where.skill = skill;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (visibility) where.visibility = visibility;

    try {
      const [assignments, total] = await Promise.all([
        prisma.assignments.findMany({
          where,
          include: {
            users_assignments_created_byTousers: {
              select: {
                full_name: true
              }
            },
            users_assignments_updated_byTousers: {
              select: {
                full_name: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.assignments.count({ where })
      ]);

      // Transform results
      const transformedAssignments = assignments.map(assignment => ({
        id: assignment.id.toString(),
        title: assignment.title,
        level: assignment.level,
        skill: assignment.skill,
        duration_minutes: assignment.duration_minutes,
        type: assignment.type,
        description: assignment.description,
        tags: this.parseJson(assignment.tags, []),
        difficulty: assignment.difficulty,
        visibility: assignment.visibility,
        objectives: this.parseJson(assignment.objectives, null),
        rubric: this.parseJson(assignment.rubric, null),
        attachments: this.parseJson(assignment.attachments, []),
        content_type: assignment.content_type,
        content: this.parseJson(assignment.content, null),
        version_number: assignment.version_number,
        parent_id: assignment.parent_id?.toString(),
        is_latest: assignment.is_latest,
        version_notes: assignment.version_notes,
        created_by: assignment.created_by.toString(),
        updated_by: assignment.updated_by.toString(),
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        created_by_name: assignment.users_assignments_created_byTousers?.full_name,
        updated_by_name: assignment.users_assignments_updated_byTousers?.full_name
      }));

      return {
        data: transformedAssignments,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };

    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw createError('Failed to fetch assignments', 'DATABASE_ERROR', 500);
    }
  }

  async get(id: string, tenantId: bigint) {
    try {
      const assignment = await prisma.assignments.findFirst({
        where: {
          id: BigInt(id),
          tenant_id: tenantId,
          deleted_at: null
        },
        include: {
          users_assignments_created_byTousers: {
            select: {
              full_name: true
            }
          },
          users_assignments_updated_byTousers: {
            select: {
              full_name: true
            }
          }
        }
      });

      if (!assignment) {
        throw createError('Assignment not found', 'NOT_FOUND', 404);
      }

      return {
        id: assignment.id.toString(),
        title: assignment.title,
        level: assignment.level,
        skill: assignment.skill,
        duration_minutes: assignment.duration_minutes,
        type: assignment.type,
        description: assignment.description,
        tags: this.parseJson(assignment.tags, []),
        difficulty: assignment.difficulty,
        visibility: assignment.visibility,
        objectives: this.parseJson(assignment.objectives, null),
        rubric: this.parseJson(assignment.rubric, null),
        attachments: this.parseJson(assignment.attachments, []),
        content_type: assignment.content_type,
        content: this.parseJson(assignment.content, null),
        version_number: assignment.version_number,
        parent_id: assignment.parent_id?.toString(),
        is_latest: assignment.is_latest,
        version_notes: assignment.version_notes,
        created_by: assignment.created_by.toString(),
        updated_by: assignment.updated_by.toString(),
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        created_by_name: assignment.users_assignments_created_byTousers?.full_name,
        updated_by_name: assignment.users_assignments_updated_byTousers?.full_name
      };

    } catch (error: any) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error fetching assignment:', error);
      throw createError('Failed to fetch assignment', 'DATABASE_ERROR', 500);
    }
  }

  async create(data: CreateAssignmentRequest, userId: bigint, tenantId: bigint) {
    try {
      const assignment = await prisma.assignments.create({
        data: {
          tenant_id: data.tenant_id,
          title: data.title,
          level: data.level,
          skill: data.skill,
          duration_minutes: data.duration_minutes,
          type: data.type,
          description: data.description,
          tags: data.tags ? JSON.stringify(data.tags) : Prisma.JsonNull,
          objectives: data.objectives ? JSON.stringify(data.objectives) : Prisma.JsonNull,
          rubric: data.rubric ? JSON.stringify(data.rubric) : Prisma.JsonNull,
          attachments: data.attachments ? JSON.stringify(data.attachments) : Prisma.JsonNull,
          content: data.content ? JSON.stringify(data.content) : Prisma.JsonNull,
          created_by: data.created_by,
          updated_by: data.updated_by,
          updated_at: new Date(), // Ensure updated_at is included
        }
      });

      return assignment;

    } catch (error) {
      console.error('Error creating assignment:', error);
      throw createError('Failed to create assignment', 'DATABASE_ERROR', 500);
    }
  }

  async update(id: string, data: UpdateAssignmentRequest, userId: bigint, tenantId: bigint) {
    try {
      // Check if assignment exists
      const existingAssignment = await prisma.assignments.findFirst({
        where: {
          id: BigInt(id),
          tenant_id: tenantId,
          deleted_at: null
        }
      });

      if (!existingAssignment) {
        throw createError('Assignment not found', 'NOT_FOUND', 404);
      }

      // Update assignment
      const updateData: any = {
        updated_by: userId,
        updated_at: new Date()
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.level !== undefined) updateData.level = data.level;
      if (data.skill !== undefined) updateData.skill = data.skill;
      if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty as any;
      if (data.visibility !== undefined) updateData.visibility = data.visibility as any;
      if (data.objectives !== undefined) updateData.objectives = data.objectives ? JSON.stringify(data.objectives) : null;
      if (data.rubric !== undefined) updateData.rubric = data.rubric ? JSON.stringify(data.rubric) : null;
      if (data.attachments !== undefined) updateData.attachments = data.attachments ? JSON.stringify(data.attachments) : null;
      if (data.content_type !== undefined) updateData.content_type = data.content_type as any;
      if (data.content !== undefined) updateData.content = data.content ? JSON.stringify(data.content) : null;
      if (data.version_notes !== undefined) updateData.version_notes = data.version_notes;

      const assignment = await prisma.assignments.update({
        where: { id: BigInt(id) },
        data: updateData
      });

      return assignment;

    } catch (error: any) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error updating assignment:', error);
      throw createError('Failed to update assignment', 'DATABASE_ERROR', 500);
    }
  }

  async delete(id: string, userId: bigint, tenantId: bigint) {
    try {
      // Check if assignment exists
      const existingAssignment = await prisma.assignments.findFirst({
        where: {
          id: BigInt(id),
          tenant_id: tenantId,
          deleted_at: null
        }
      });

      if (!existingAssignment) {
        throw createError('Assignment not found', 'NOT_FOUND', 404);
      }

      // Soft delete
      await prisma.assignments.update({
        where: { id: BigInt(id) },
        data: {
          deleted_at: new Date(),
          updated_by: userId
        }
      });

    } catch (error: any) {
      if (error.code === 'NOT_FOUND') throw error;
      console.error('Error deleting assignment:', error);
      throw createError('Failed to delete assignment', 'DATABASE_ERROR', 500);
    }
  }

  async seedAssignmentsForTenant(tenantId: bigint, userId: bigint) {
    // Check if assignments already exist for this tenant
    const existingAssignments = await prisma.assignments.count({
      where: { tenant_id: tenantId }
    });

    if (existingAssignments > 0) {
      return; // Already seeded
    }

    // Seed some sample assignments
    const sampleAssignments = [
      {
        title: "English Grammar Quiz",
        level: "intermediate",
        skill: "grammar",
        duration_minutes: 30,
        type: "quiz",
        description: "Test your English grammar knowledge",
        difficulty: "medium" as any,
        visibility: "public" as any,
        content_type: "mcq" as any,
        created_by: userId,
        updated_by: userId,
      },
      {
        title: "Listening Comprehension",
        level: "advanced",
        skill: "listening",
        duration_minutes: 45,
        type: "listening",
        description: "Advanced listening comprehension exercise",
        difficulty: "hard" as any,
        visibility: "public" as any,
        content_type: "audio" as any,
        created_by: userId,
        updated_by: userId,
      }
    ];

    for (const assignment of sampleAssignments) {
      await prisma.assignments.create({
        data: {
          tenant_id: tenantId,
          ...assignment,
          updated_at: new Date()
        }
      });
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

export const assignmentsService = new AssignmentsService();