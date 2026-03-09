import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export interface RoleFilters {
  tenantId?: bigint;
}

export interface RoleData {
  id: bigint;
  tenant_id?: bigint | null;
  code: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionData {
  id: bigint;
  code: string;
  name: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class RolesService {
  async list(filters: RoleFilters, tenantId: bigint) {
    const where: any = {};

    // Include global roles and tenant-specific roles
    where.OR = [
      { tenant_id: null },
      { tenant_id: tenantId }
    ];

    const roles = await prisma.role.findMany({
      where,
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: [
        { is_system: 'desc' },
        { created_at: 'desc' }
      ]
    });

    return roles.map(role => ({
      id: role.id.toString(),
      tenant_id: role.tenant_id?.toString() || null,
      code: role.code,
      name: role.name,
      description: role.description,
      is_system: role.is_system,
      created_at: role.created_at,
      permission_count: role.permissions.length
    }));
  }

  async get(id: string, tenantId: bigint) {
    const roleId = BigInt(id);

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          { tenant_id: null },
          { tenant_id: tenantId }
        ]
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw createError('Role not found', 'ROLE_NOT_FOUND', 404);
    }

    const permissions = role.permissions.map(rp => ({
      id: rp.permission.id.toString(),
      code: rp.permission.code,
      name: rp.permission.name,
      description: rp.permission.description
    }));

    return {
      id: role.id.toString(),
      tenant_id: role.tenant_id?.toString() || null,
      code: role.code,
      name: role.name,
      description: role.description,
      is_system: role.is_system,
      created_at: role.created_at,
      permissions
    };
  }

  async create(data: Partial<RoleData>, permissionIds: number[], tenantId: bigint, userId: bigint) {
    const { code, name, description } = data;
    
    if (!code || !name) {
      throw createError('Code and name are required', 'VALIDATION_ERROR', 400);
    }

    // Check if code already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        code,
        OR: [
          { tenant_id: null },
          { tenant_id: tenantId }
        ]
      }
    });

    if (existingRole) {
      throw createError('Role code already exists', 'ROLE_EXISTS', 409);
    }

    const role = await prisma.role.create({
      data: {
        tenant_id: tenantId,
        code,
        name,
        description,
        is_system: false
      }
    });

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const permissionValues = permissionIds.map(permissionId => ({
        role_id: role.id,
        permission_id: BigInt(permissionId),
        granted_by: userId
      }));

      await prisma.rolePermission.createMany({
        data: permissionValues
      });
    }

    return {
      id: role.id.toString(),
      tenant_id: role.tenant_id?.toString() || null,
      code: role.code,
      name: role.name,
      description: role.description,
      is_system: false,
      created_at: role.created_at
    };
  }

  async update(id: string, data: Partial<RoleData>, permissionIds: number[] | undefined, tenantId: bigint, userId: bigint) {
    const roleId = BigInt(id);

    // Get current role
    const currentRole = await prisma.role.findFirst({
      where: { id: roleId }
    });

    if (!currentRole) {
      throw createError('Role not found', 'ROLE_NOT_FOUND', 404);
    }

    // Check tenant access
    if (currentRole.tenant_id && currentRole.tenant_id !== tenantId) {
      throw createError('Access denied', 'ACCESS_DENIED', 403);
    }

    // Cannot modify system roles
    if (currentRole.is_system) {
      throw createError('Cannot modify system roles', 'SYSTEM_ROLE', 403);
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    if (Object.keys(updateData).length > 1) { // More than just updated_at
      await prisma.role.update({
        where: { id: roleId },
        data: updateData
      });
    }

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { role_id: roleId }
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        const permissionValues = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: BigInt(permissionId),
          granted_by: userId
        }));

        await prisma.rolePermission.createMany({
          data: permissionValues
        });
      }
    }
  }

  async delete(id: string, tenantId: bigint) {
    const roleId = BigInt(id);

    // Get role
    const role = await prisma.role.findFirst({
      where: { id: roleId }
    });

    if (!role) {
      throw createError('Role not found', 'ROLE_NOT_FOUND', 404);
    }

    // Check tenant access
    if (role.tenant_id && role.tenant_id !== tenantId) {
      throw createError('Access denied', 'ACCESS_DENIED', 403);
    }

    // Cannot delete system roles
    if (role.is_system) {
      throw createError('Cannot delete system roles', 'SYSTEM_ROLE', 403);
    }

    // Check if role is assigned to users
    const userCount = await prisma.userRoleAssignment.count({
      where: { role_id: roleId, active: true }
    });

    if (userCount > 0) {
      throw createError('Cannot delete role that is assigned to users', 'ROLE_IN_USE', 409);
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { role_id: roleId }
    });

    // Delete role
    await prisma.role.delete({
      where: { id: roleId }
    });
  }
}

export class PermissionsService {
  async list() {
    const permissions = await prisma.permission.findMany({
      orderBy: { code: 'asc' }
    });

    return permissions.map(permission => ({
      id: permission.id.toString(),
      code: permission.code,
      name: permission.name,
      description: permission.description,
      created_at: permission.created_at
    }));
  }
}

export const rolesService = new RolesService();
export const permissionsService = new PermissionsService();