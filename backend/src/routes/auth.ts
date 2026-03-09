import express from 'express';
import { body, validationResult } from 'express-validator';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { auditLogger } from '../utils/logger';
import { authService } from '../services/authService';

const router = express.Router();

// POST /api/v1/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  // Log successful login
  auditLogger.login(result.user.id.toString(), req.ip || '', req.get('User-Agent') || '');

  res.json(result);
}));

// POST /api/v1/auth/refresh
router.post('/refresh', [
  body('refresh_token').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { refresh_token } = req.body;

  const result = await authService.refreshToken(refresh_token);

  res.json(result);
}));

// POST /api/v1/auth/logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // In a real implementation, you might want to blacklist the token
  // For now, just log the logout
  auditLogger.logout(req.user!.id.toString());

  res.json({ message: 'Logged out successfully' });
}));

// GET /api/v1/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(BigInt(req.user!.id));

  res.json({
    user: {
      id: Number(user.id),
      tenant_id: Number(user.tenant_id),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      campus_id: user.campus_id ? Number(user.campus_id) : null,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    }
  });
}));

// POST /api/v1/auth/mfa/verify
router.post('/mfa/verify', [
  body('code').isLength({ min: 6, max: 6 }).isNumeric()
], authenticate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { code } = req.body;

  const result = await authService.verifyMFA(BigInt(req.user!.id), code);

  // MFA verified successfully
  auditLogger.login(req.user!.id.toString(), req.ip || 'unknown', req.get('User-Agent') || '');

  res.json(result);
}));

export default router;