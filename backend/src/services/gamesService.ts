import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export interface GameFilters {
  search?: string;
  level?: string;
  skill?: string;
  type?: string;
  difficulty?: string;
  visibility?: 'public' | 'private';
  ownerOnly?: boolean;
  page?: number;
  pageSize?: number;
  game_type?: string;
}

export interface GameData {
  id: bigint;
  tenant_id: bigint;
  title: string;
  type?: string | null;
  level?: string | null;
  skill?: string | null;
  duration_minutes: number;
  players?: string | null;
  description?: string | null;
  plays_count: number;
  rating: number;
  api_integration?: string | null;
  tags?: any;
  difficulty?: string | null;
  visibility: string;
  owner_user_id?: bigint | null;
  objectives?: any;
  rubric?: any;
  attachments?: any;
  game_type?: string | null;
  configuration?: any;
  external_api_config?: any;
  leaderboard_enabled: boolean;
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

export class GamesService {
  async list(filters: GameFilters, userId: bigint, tenantId: bigint) {
    const {
      search,
      level,
      skill,
      type,
      difficulty,
      visibility,
      ownerOnly,
      page = 1,
      pageSize = 20,
      game_type
    } = filters;

    const skip = (page - 1) * pageSize;

    const where: any = {
      tenant_id: tenantId,
      deleted_at: null,
    };

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
    if (ownerOnly) where.owner_user_id = userId;
    if (game_type) where.game_type = game_type;

    const [games, total] = await Promise.all([
      prisma.games.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.games.count({ where })
    ]);

    return {
      data: games,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async get(id: string, tenantId: bigint) {
    const game = await prisma.games.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!game) {
      throw createError('Game not found', 'NOT_FOUND', 404);
    }

    return game;
  }

  async create(data: Partial<GameData>, userId: bigint, tenantId: bigint) {
    const gameData = {
      tenant_id: tenantId,
      title: data.title!,
      type: data.type || null,
      level: data.level || null,
      skill: data.skill || null,
      duration_minutes: data.duration_minutes || 0,
      players: data.players || null,
      description: data.description || null,
      plays_count: data.plays_count || 0,
      rating: data.rating || 0,
      api_integration: data.api_integration || null,
      tags: data.tags || null,
      difficulty: data.difficulty || null,
      visibility: (data.visibility as any) || 'public',
      owner_user_id: userId,
      objectives: data.objectives || null,
      rubric: data.rubric || null,
      attachments: data.attachments || null,
      game_type: (data.game_type as any) || null,
      configuration: data.configuration || null,
      external_api_config: data.external_api_config || null,
      leaderboard_enabled: data.leaderboard_enabled ?? true,
      version_number: 1,
      parent_id: null,
      is_latest: true,
      version_notes: data.version_notes || null,
      created_by: userId,
      updated_by: userId,
    };

    const game = await prisma.games.create({
      data: {
        ...gameData,
        updated_at: new Date()
      }
    });

    return game;
  }

  async update(id: string, data: Partial<GameData>, userId: bigint, tenantId: bigint) {
    const existingGame = await prisma.games.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!existingGame) {
      throw createError('Game not found', 'NOT_FOUND', 404);
    }

    const updateData: any = {
      updated_by: userId,
      updated_at: new Date()
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.skill !== undefined) updateData.skill = data.skill;
    if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;
    if (data.players !== undefined) updateData.players = data.players;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.plays_count !== undefined) updateData.plays_count = data.plays_count;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.api_integration !== undefined) updateData.api_integration = data.api_integration;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.owner_user_id !== undefined) updateData.owner_user_id = data.owner_user_id;
    if (data.objectives !== undefined) updateData.objectives = data.objectives;
    if (data.rubric !== undefined) updateData.rubric = data.rubric;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.game_type !== undefined) updateData.game_type = data.game_type;
    if (data.configuration !== undefined) updateData.configuration = data.configuration;
    if (data.external_api_config !== undefined) updateData.external_api_config = data.external_api_config;
    if (data.leaderboard_enabled !== undefined) updateData.leaderboard_enabled = data.leaderboard_enabled;
    if (data.version_notes !== undefined) updateData.version_notes = data.version_notes;

    const game = await prisma.games.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    return game;
  }

  async delete(id: string, userId: bigint, tenantId: bigint) {
    const existingGame = await prisma.games.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: tenantId,
        deleted_at: null
      }
    });

    if (!existingGame) {
      throw createError('Game not found', 'NOT_FOUND', 404);
    }

    await prisma.games.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: new Date(),
        updated_by: userId
      }
    });
  }

  async seedGamesForTenant(tenantId: bigint, userId: bigint) {
    // Check if games already exist for this tenant
    const existingGames = await prisma.games.count({
      where: { tenant_id: tenantId }
    });

    if (existingGames > 0) {
      return; // Already seeded
    }

    // Seed some sample games
    const sampleGames = [
      {
        title: "Vocabulary Quiz",
        type: "quiz",
        level: "intermediate",
        skill: "vocabulary",
        duration_minutes: 15,
        description: "Test your vocabulary knowledge",
        game_type: "vocabulary_quiz" as any,
        visibility: "public" as any,
        created_by: userId,
        updated_by: userId,
      },
      {
        title: "Grammar Battle",
        type: "game",
        level: "advanced",
        skill: "grammar",
        duration_minutes: 20,
        description: "Battle with grammar challenges",
        game_type: "grammar_battle" as any,
        visibility: "public" as any,
        created_by: userId,
        updated_by: userId,
      }
    ];

    for (const game of sampleGames) {
      await prisma.games.create({
        data: {
          tenant_id: tenantId,
          ...game,
          updated_at: new Date()
        }
      });
    }
  }
}

export const gamesService = new GamesService();