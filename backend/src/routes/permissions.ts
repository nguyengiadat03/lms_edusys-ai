import express from 'express';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { permissionsService } from '../services/rolesService';

const router = express.Router();

// GET /api/v1/permissions - List all permissions
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const permissions = await permissionsService.list();

  res.json({ permissions });
}));

export default router;