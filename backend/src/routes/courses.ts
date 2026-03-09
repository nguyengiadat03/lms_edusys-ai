import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../utils/logger';
const { courseService } = require('../services/courseService.js');

const router = express.Router();

// GET /api/v1/courses/versions/:versionId/courses - Get courses by version
router.get('/versions/:versionId/courses', [
  authenticate,
  param('versionId').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { versionId } = req.params;
  const user = req.user!;

  const courses = await courseService.getCoursesByVersion(Number(versionId), BigInt(user.tenant_id));

  res.json({
    data: courses,
    count: courses.length
  });
}));

// GET /api/v1/courses/:id - Get course details
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

  const course = await courseService.get(id, BigInt(user.tenant_id));

  res.json({ data: course });
}));

// POST /api/v1/courses/versions/:versionId/courses - Create course
router.post('/versions/:versionId/courses', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('versionId').isInt(),
  body('title').isLength({ min: 1, max: 255 }),
  body('subtitle').optional().isLength({ max: 255 }),
  body('level').optional().isLength({ max: 64 }),
  body('hours').optional().isInt({ min: 0 }),
  body('order_index').optional().isInt({ min: 0 }),
  body('summary').optional(),
  body('learning_outcomes').optional().isArray(),
  body('assessment_types').optional().isArray(),
  body('prerequisites').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { versionId } = req.params;
  const user = req.user!;
  const courseData = req.body;

  const course = await courseService.create(Number(versionId), courseData, BigInt(user.id), BigInt(user.tenant_id));

  // Log audit
  auditLogger.create(user.id.toString(), 'course_blueprint', course.id.toString(), courseData);

  res.status(201).json({ 
    data: {
      id: course.id.toString(),
      title: course.title,
      level: course.level,
      hours: course.hours,
      created_at: course.created_at
    }
  });
}));

// PATCH /api/v1/courses/:id - Update course
router.patch('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('subtitle').optional().isLength({ max: 255 }),
  body('level').optional().isLength({ max: 64 }),
  body('hours').optional().isInt({ min: 0 }),
  body('order_index').optional().isInt({ min: 0 }),
  body('summary').optional(),
  body('learning_outcomes').optional().isArray(),
  body('assessment_types').optional().isArray(),
  body('prerequisites').optional()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updateData = req.body;

  await courseService.update(id, updateData, BigInt(user.id), BigInt(user.tenant_id));

  // Log audit
  auditLogger.update(user.id.toString(), 'course_blueprint', id, updateData);

  res.json({ message: 'Course updated successfully' });
}));

// DELETE /api/v1/courses/:id - Delete course
router.delete('/:id', [
  authenticate,
  authorize('curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;

  await courseService.delete(id, BigInt(user.id), BigInt(user.tenant_id));

  // Log audit
  auditLogger.delete(user.id.toString(), 'course_blueprint', id);

  res.json({ message: 'Course deleted successfully' });
}));

export default router;