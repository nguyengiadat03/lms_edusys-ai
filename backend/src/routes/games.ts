import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { auditLogger } from '../utils/logger';
import { gamesService } from '../services/gamesService';

const router = express.Router();

const parseGame = (game: any) => {
  return {
    ...game,
    id: game.id.toString(),
    tenant_id: game.tenant_id.toString(),
    owner_user_id: game.owner_user_id?.toString() || null,
    created_by: game.created_by.toString(),
    updated_by: game.updated_by.toString(),
    parent_id: game.parent_id?.toString() || null,
    tags: game.tags || [],
    objectives: game.objectives || null,
    rubric: game.rubric || null,
    attachments: game.attachments || [],
    configuration: game.configuration || null,
    external_api_config: game.external_api_config || null,
  };
};

router.get('/', [
  authenticate,
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('level').optional().isString(),
  query('skill').optional().isString(),
  query('type').optional().isString(),
  query('difficulty').optional().isString(),
  query('visibility').optional().isIn(['public', 'private']),
  query('ownerOnly').optional().isIn(['true','false']),
  query('game_type').optional().isIn(['flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  await gamesService.seedGamesForTenant(BigInt(user.tenant_id), BigInt(user.id));

  const filters = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
    search: req.query.search as string,
    level: req.query.level as string,
    skill: req.query.skill as string,
    type: req.query.type as string,
    difficulty: req.query.difficulty as string,
    visibility: req.query.visibility as 'public' | 'private',
    ownerOnly: req.query.ownerOnly === 'true',
    game_type: req.query.game_type as string,
  };

  const result = await gamesService.list(filters, BigInt(user.id), BigInt(user.tenant_id));

  res.json({
    data: result.data.map(parseGame),
    pagination: result.pagination
  });
}));

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

  const game = await gamesService.get(id, BigInt(user.tenant_id));

  res.json({ game: parseGame(game) });
}));

router.post('/', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('title').isLength({ min: 1, max: 255 }),
  body('type').optional().isLength({ max: 64 }),
  body('level').optional().isLength({ max: 32 }),
  body('skill').optional().isLength({ max: 64 }),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('players').optional().isLength({ max: 64 }),
  body('description').optional().isLength({ max: 2000 }),
  body('plays_count').optional().isInt({ min: 0 }),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('api_integration').optional().isLength({ max: 128 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 64 }),
  body('difficulty').optional().isLength({ max: 16 }),
  body('visibility').optional().isIn(['public','private']),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray({ max: 50 }),
  body('game_type').optional().isIn(['flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom']),
  body('configuration').optional(),
  body('external_api_config').optional(),
  body('leaderboard_enabled').optional().isBoolean(),
  body('version_notes').optional().isLength({ max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const user = req.user!;
  const gameData = req.body;

  const game = await gamesService.create(gameData, BigInt(user.id), BigInt(user.tenant_id));

  auditLogger.create(user.id.toString(), 'game', game.id.toString(), parseGame(game));

  res.status(201).json({ game: parseGame(game) });
}));

router.patch('/:id', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('type').optional().isLength({ max: 64 }),
  body('level').optional().isLength({ max: 32 }),
  body('skill').optional().isLength({ max: 64 }),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('players').optional().isLength({ max: 64 }),
  body('description').optional().isLength({ max: 2000 }),
  body('plays_count').optional().isInt({ min: 0 }),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('api_integration').optional().isLength({ max: 128 }),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().isString().isLength({ max: 64 }),
  body('difficulty').optional().isLength({ max: 16 }),
  body('visibility').optional().isIn(['public','private']),
  body('owner_user_id').optional().isInt(),
  body('objectives').optional(),
  body('rubric').optional(),
  body('attachments').optional().isArray({ max: 50 }),
  body('game_type').optional().isIn(['flashcard','kahoot_style','crossword','word_search','role_play','listening_challenge','vocabulary_quiz','grammar_battle','custom']),
  body('configuration').optional(),
  body('external_api_config').optional(),
  body('leaderboard_enabled').optional().isBoolean(),
  body('version_notes').optional().isLength({ max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  const game = await gamesService.update(id, updates, BigInt(user.id), BigInt(user.tenant_id));

  auditLogger.update(user.id.toString(), 'game', id, updates);

  res.json({ game: parseGame(game) });
}));

router.delete('/:id', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  param('id').isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { id } = req.params;
  const user = req.user!;

  await gamesService.delete(id, BigInt(user.id), BigInt(user.tenant_id));

  auditLogger.delete(user.id.toString(), 'game', id);

  res.json({ message: 'Game deleted successfully' });
}));

export default router;
