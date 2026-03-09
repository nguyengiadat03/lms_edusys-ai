import express from 'express';
import bcrypt from 'bcryptjs';
import { body, param, validationResult } from 'express-validator';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize, requireTenantAccess } from '../middleware/auth';
import { auditLogger } from '../utils/logger';

const router = express.Router();

// GET /api/v1/users - List users (admin only)
router.get('/', authenticate, authorize('admin'), requireTenantAccess, asyncHandler(async (req, res) => {
  const tenantId = req.user!.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const [users] = await config.query(
    `SELECT id, tenant_id, email, full_name, role, campus_id, is_active, created_at, last_login_at
     FROM users
     WHERE tenant_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [tenantId, limit, offset]
  );

  const [total] = await config.query(
    'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND deleted_at IS NULL',
    [tenantId]
  );

  res.json({
    users,
    pagination: {
      page,
      limit,
      total: total[0].count,
      pages: Math.ceil(total[0].count / limit)
    }
  });
}));

// POST /api/v1/users - Create user (admin only)
router.post('/', [
  authenticate,
  authorize('admin'),
  requireTenantAccess,
  body('email').isEmail().normalizeEmail(),
  body('full_name').isLength({ min: 2 }),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'teacher', 'student', 'staff']),
  body('campus_id').optional().isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { email, full_name, password, role, campus_id } = req.body;
  const tenantId = req.user!.tenantId;

  // Check if email already exists
  const [existing] = await config.query(
    'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );

  if (existing.length > 0) {
    throw createError('Email already exists', 'EMAIL_EXISTS', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const [result] = await config.query(
    `INSERT INTO users (tenant_id, email, full_name, role, campus_id, password_hash, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
    [tenantId, email, full_name, role, campus_id || null, passwordHash]
  );

  const userId = (result as any).insertId;

  auditLogger.create(req.user!.id.toString(), 'user', userId.toString(), { email, full_name, role });

  res.status(201).json({
    user: {
      id: userId,
      tenant_id: tenantId,
      email,
      full_name,
      role,
      campus_id,
      is_active: true,
      created_at: new Date()
    }
  });
}));

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const userId = parseInt(req.params.id);

  // Users can view their own profile, admins can view any
  if (req.user!.id !== userId && req.user!.role !== 'admin') {
    throw createError('Access denied', 'ACCESS_DENIED', 403);
  }

  const [users] = await config.query(
    `SELECT id, tenant_id, email, full_name, role, campus_id, is_active, created_at, last_login_at
     FROM users
     WHERE id = ? AND deleted_at IS NULL`,
    [userId]
  );

  if (users.length === 0) {
    throw createError('User not found', 'USER_NOT_FOUND', 404);
  }

  const user = users[0];

  // Check tenant access for non-admin
  if (req.user!.role !== 'admin' && user.tenant_id !== req.user!.tenantId) {
    throw createError('Access denied', 'ACCESS_DENIED', 403);
  }

  res.json({ user });
}));

// PATCH /api/v1/users/:id - Update user
router.patch('/:id', [
  authenticate,
  param('id').isInt(),
  body('full_name').optional().isLength({ min: 2 }),
  body('role').optional().isIn(['admin', 'teacher', 'student', 'staff']),
  body('campus_id').optional().isInt(),
  body('is_active').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const userId = parseInt(req.params.id);
  const updates = req.body;

  // Users can update their own profile, admins can update any
  if (req.user!.id !== userId && req.user!.role !== 'admin') {
    throw createError('Access denied', 'ACCESS_DENIED', 403);
  }

  // Get current user
  const [users] = await config.query(
    'SELECT tenant_id, role FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );

  if (users.length === 0) {
    throw createError('User not found', 'USER_NOT_FOUND', 404);
  }

  const user = users[0];

  // Check tenant access for non-admin
  if (req.user!.role !== 'admin' && user.tenant_id !== req.user!.tenantId) {
    throw createError('Access denied', 'ACCESS_DENIED', 403);
  }

  // Only admins can change roles
  if (updates.role && req.user!.role !== 'admin') {
    throw createError('Only admins can change user roles', 'ACCESS_DENIED', 403);
  }

  // Build update query
  const updateFields = [];
  const values = [];

  if (updates.full_name) {
    updateFields.push('full_name = ?');
    values.push(updates.full_name);
  }
  if (updates.role) {
    updateFields.push('role = ?');
    values.push(updates.role);
  }
  if (updates.campus_id !== undefined) {
    updateFields.push('campus_id = ?');
    values.push(updates.campus_id);
  }
  if (updates.is_active !== undefined) {
    updateFields.push('is_active = ?');
    values.push(updates.is_active);
  }

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 'NO_UPDATES', 400);
  }

  updateFields.push('updated_at = NOW()');
  values.push(userId);

  await config.query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  );

  auditLogger.update(req.user!.id.toString(), 'user', userId.toString(), updates);

  res.json({ message: 'User updated successfully' });
}));

// DELETE /api/v1/users/:id - Delete user (soft delete)
router.delete('/:id', [
  authenticate,
  authorize('admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const userId = parseInt(req.params.id);

  // Cannot delete self
  if (req.user!.id === userId) {
    throw createError('Cannot delete your own account', 'SELF_DELETE', 400);
  }

  // Get user
  const [users] = await config.query(
    'SELECT tenant_id FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );

  if (users.length === 0) {
    throw createError('User not found', 'USER_NOT_FOUND', 404);
  }

  const user = users[0];

  // Check tenant access
  if (user.tenant_id !== req.user!.tenantId) {
    throw createError('Access denied', 'ACCESS_DENIED', 403);
  }

  // Soft delete
  await config.query(
    'UPDATE users SET deleted_at = NOW() WHERE id = ?',
    [userId]
  );

  auditLogger.delete(req.user!.id.toString(), 'user', userId.toString());

  res.json({ message: 'User deleted successfully' });
}));

// POST /api/v1/users/:id/roles - Assign role to user
router.post('/:id/roles', [
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  body('role_id').isInt(),
  body('campus_id').optional().isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const userId = parseInt(req.params.id);
  const { role_id, campus_id } = req.body;

  // Verify user exists
  const [users] = await config.query(
    'SELECT tenant_id FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );

  if (users.length === 0) {
    throw createError('User not found', 'USER_NOT_FOUND', 404);
  }

  const user = users[0];

  // Check tenant access
  if (user.tenant_id !== req.user!.tenantId) {
    throw createError('Access denied', 'ACCESS_DENIED', 403);
  }

  // Verify role exists and is accessible
  const [roles] = await config.query(
    'SELECT id FROM roles WHERE id = ? AND (tenant_id IS NULL OR tenant_id = ?)',
    [role_id, req.user!.tenantId]
  );

  if (roles.length === 0) {
    throw createError('Role not found', 'ROLE_NOT_FOUND', 404);
  }

  // Check if assignment already exists
  const [existing] = await config.query(
    'SELECT id FROM user_roles WHERE user_id = ? AND role_id = ? AND (campus_id IS NULL OR campus_id = ?)',
    [userId, role_id, campus_id || null]
  );

  if (existing.length > 0) {
    throw createError('Role already assigned to user', 'ROLE_ALREADY_ASSIGNED', 409);
  }

  // Create assignment
  await config.query(
    'INSERT INTO user_roles (user_id, role_id, campus_id, assigned_at) VALUES (?, ?, ?, NOW())',
    [userId, role_id, campus_id || null]
  );

  auditLogger.create(req.user!.id.toString(), 'user_role', `${userId}-${role_id}`, { user_id: userId, role_id, campus_id });

  res.status(201).json({ message: 'Role assigned successfully' });
}));

// DELETE /api/v1/users/:id/roles/:roleId - Remove role from user
router.delete('/:id/roles/:roleId', [
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  param('roleId').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const userId = parseInt(req.params.id);
  const roleId = parseInt(req.params.roleId);

  // Verify user exists
  const [users] = await config.query(
    'SELECT tenant_id FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );

  if (users.length === 0) {
    throw createError('User not found', 'USER_NOT_FOUND', 404);
  }

  const user = users[0];

  // Check tenant access
  if (user.tenant_id !== req.user!.tenantId) {
    throw createError('Access denied', 'ACCESS_DENIED', 403);
  }

  // Find and deactivate the assignment
  const [result] = await config.query(
    'UPDATE user_roles SET active = 0 WHERE user_id = ? AND role_id = ? AND active = 1',
    [userId, roleId]
  );

  if ((result as any).affectedRows === 0) {
    throw createError('Role assignment not found', 'ASSIGNMENT_NOT_FOUND', 404);
  }

  auditLogger.delete(req.user!.id.toString(), 'user_role', `${userId}-${roleId}`);

  res.json({ message: 'Role removed successfully' });
}));

export default router;