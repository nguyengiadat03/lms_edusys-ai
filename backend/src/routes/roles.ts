import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';
import { rolesService } from '../services/rolesService';

const router = express.Router();

// GET /api/v1/roles - List roles
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const tenantId = BigInt(req.user!.tenantId);

  const roles = await rolesService.list({}, tenantId);

  res.json({ roles });
}));

// POST /api/v1/roles - Create role
router.post('/', [
  authenticate,
  authorize('admin'),
  body('code').isLength({ min: 2, max: 64 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('name').isLength({ min: 2, max: 128 }),
  body('description').optional().isLength({ max: 500 }),
  body('permission_ids').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { code, name, description, permission_ids } = req.body;
  const tenantId = BigInt(req.user!.tenantId);
  const userId = BigInt(req.user!.id);

  const role = await rolesService.create(
    { code, name, description },
    permission_ids || [],
    tenantId,
    userId
  );

  auditLogger.create(req.user!.id.toString(), 'role', role.id, { code, name, permission_ids });

  res.status(201).json({ role });
}));

// GET /api/v1/roles/:id - Get role by ID
router.get('/:id', [
  authenticate,
  authorize('admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = BigInt(req.user!.tenantId);

  const role = await rolesService.get(id, tenantId);

  res.json({ role });
}));

// PATCH /api/v1/roles/:id - Update role
router.patch('/:id', [
  authenticate,
  authorize('admin'),
  param('id').isInt(),
  body('name').optional().isLength({ min: 2, max: 128 }),
  body('description').optional().isLength({ max: 500 }),
  body('permission_ids').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const tenantId = BigInt(req.user!.tenantId);
  const userId = BigInt(req.user!.id);
  const updates = req.body;

  await rolesService.update(id, updates, updates.permission_ids, tenantId, userId);

  auditLogger.update(req.user!.id.toString(), 'role', id, updates);

  res.json({ message: 'Role updated successfully' });
}));

// DELETE /api/v1/roles/:id - Delete role
router.delete('/:id', [
  authenticate,
  authorize('admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = BigInt(req.user!.tenantId);

  await rolesService.delete(id, tenantId);

  auditLogger.delete(req.user!.id.toString(), 'role', id);

  res.json({ message: 'Role deleted successfully' });
}));

export default router;