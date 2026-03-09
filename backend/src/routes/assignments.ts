import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';
import { assignmentsService } from '../services/assignmentsService';

const router = express.Router();

// GET /api/v1/assignments - List assignments
router.get('/', [
  authenticate,
  query('search').optional(),
  query('level').optional(),
  query('skill').optional(),
  query('type').optional(),
  query('difficulty').optional(),
  query('visibility').optional(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const {
    search,
    level,
    skill,
    type,
    difficulty,
    visibility,
    page = 1,
    pageSize = 20
  } = req.query;

  const user = req.user!;

  const filters = {
    search: search as string,
    level: level as string,
    skill: skill as string,
    type: type as string,
    difficulty: difficulty as string,
    visibility: visibility as string,
    page: Number(page),
    pageSize: Number(pageSize)
  };

  const result = await assignmentsService.list(filters, BigInt(user.id), BigInt(user.tenant_id));

  res.json(result);
}));

// GET /api/v1/assignments/:id - Get assignment details
router.get('/:id', [
  authenticate,
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;

  const assignment = await assignmentsService.get(id, BigInt(user.tenant_id));

  res.json({ data: assignment });
}));

// POST /api/v1/assignments - Create assignment
router.post('/', [
  authenticate,
  authorize('curriculum_designer', 'teacher', 'admin'),
  body('title').isLength({ min: 1, max: 255 }),
  body('level').optional(),
  body('skill').optional(),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('type').optional(),
  body('description').optional(),
  body('tags').optional().isArray(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('visibility').optional().isIn(['public', 'private', 'campus', 'tenant']),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray(),
  body('content_type').optional(),
  body('content').optional(),
  body('version_notes').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const assignmentData = req.body;

  const assignment = await assignmentsService.create(assignmentData, BigInt(user.id), BigInt(user.tenant_id));

  // Log audit
  auditLogger.create(user.id.toString(), 'assignment', assignment.id.toString(), assignmentData);

  res.status(201).json({ 
    data: {
      id: assignment.id.toString(),
      title: assignment.title,
      level: assignment.level,
      skill: assignment.skill,
      created_at: assignment.created_at
    }
  });
}));

// PATCH /api/v1/assignments/:id - Update assignment
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'teacher', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('level').optional(),
  body('skill').optional(),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('type').optional(),
  body('description').optional(),
  body('tags').optional().isArray(),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('visibility').optional().isIn(['public', 'private', 'campus', 'tenant']),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray(),
  body('content_type').optional(),
  body('content').optional(),
  body('version_notes').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updateData = req.body;

  await assignmentsService.update(id, updateData, BigInt(user.id), BigInt(user.tenant_id));

  // Log audit
  auditLogger.update(user.id.toString(), 'assignment', id, updateData);

  res.json({ message: 'Assignment updated successfully' });
}));

// DELETE /api/v1/assignments/:id - Delete assignment
router.delete('/:id', [
  authenticate,
  authorize('curriculum_designer', 'teacher', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;

  await assignmentsService.delete(id, BigInt(user.id), BigInt(user.tenant_id));

  // Log audit
  auditLogger.delete(user.id.toString(), 'assignment', id);

  res.json({ message: 'Assignment deleted successfully' });
}));

// POST /api/v1/assignments/seed - Seed sample assignments (dev only)
router.post('/seed', [
  authenticate
], asyncHandler(async (req, res) => {
  const user = req.user!;

  await assignmentsService.seedAssignmentsForTenant(BigInt(user.tenant_id), BigInt(user.id));

  res.json({ message: 'Sample assignments seeded successfully' });
}));

export default router;