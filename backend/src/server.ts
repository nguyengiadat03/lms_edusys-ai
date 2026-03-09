import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initializeQueues } from './services/queueService';
import { ensureAssignmentsTable, ensureGamesTable, ensurePracticeSessionsTable } from './utils/schemaInitializer';
import { getAllowedOrigins, isProduction, validateEnv } from './config/env';
import { sanitizeForLog } from './utils/sanitize';
import { checkMaintenanceMode } from './middleware/maintenance';

// Mock Prisma client to avoid generation issues
const mockPrisma = {
  curriculum_frameworks: {
    findMany: async () => []
  }
};

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import rolesRoutes from './routes/roles';
import permissionsRoutes from './routes/permissions';
import scopesRoutes from './routes/scopes';
import auditRoutes from './routes/audit';
import curriculumRoutes from './routes/curriculum';
import versionRoutes from './routes/versions';
import courseRoutes from './routes/courses';
import unitRoutes from './routes/units';
import resourceRoutes from './routes/resources';
import mappingRoutes from './routes/mappings';
import exportRoutes from './routes/exports';
import reportRoutes from './routes/reports';
import commentRoutes from './routes/comments';
import tagRoutes from './routes/tags';
import approvalRoutes from './routes/approvals';
import savedViewRoutes from './routes/savedViews';
import assignmentRoutes from './routes/assignments';
import gameRoutes from './routes/games';
import aiRoutes from './routes/ai';
import systemRoutes from './routes/system';
import advancedAuthRoutes from './routes/advancedAuth';
import documentRoutes from './routes/documents';
import advancedFrameworkRoutes from './routes/advancedFramework';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173', // Vite default
      'http://localhost:8080', // Company standard port
      'http://localhost:3000', // Common dev port
      'http://localhost:8081', // Current Vite port
      'http://localhost:8082', // Alternative Vite port
      'http://127.0.0.1:8080', // Localhost alternative
      'http://127.0.0.1:8081', // Localhost alternative
      'http://127.0.0.1:8082', // Frontend port
      ...getAllowedOrigins()
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 300 : 1000,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 50 : 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 200 : 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', baseLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/ai', aiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (sanitized)
app.use((req, res, next) => {
  const meta: Record<string, any> = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };
  if (!isProduction && req.method !== 'GET') {
    meta.body = sanitizeForLog(req.body);
  }
  logger.info(`${req.method} ${req.path}`, meta);
  next();
});

// Maintenance mode check (after logging, before routes) - TEMPORARILY DISABLED FOR TESTING
// app.use(checkMaintenanceMode);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// TEST ROUTE (dev only) - Mock data version
app.get('/api/v1/test/kct-data', async (req, res) => {
  if (isProduction) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  }
  try {
    console.log('🔍 TEST API: Returning mock curriculum frameworks data');

    // Mock data instead of database call
    const mockFrameworks = [
      {
        id: '1',
        code: 'KCT-001',
        name: 'Mathematics Framework',
        language: 'en',
        total_hours: 120,
        status: 'active',
        owner_user_id: '1',
        updated_at: new Date().toISOString(),
        target_level: 'secondary',
        age_group: '14-18',
        description: 'Comprehensive mathematics curriculum framework'
      },
      {
        id: '2',
        code: 'KCT-002',
        name: 'Science Framework',
        language: 'en',
        total_hours: 100,
        status: 'active',
        owner_user_id: '1',
        updated_at: new Date().toISOString(),
        target_level: 'secondary',
        age_group: '14-18',
        description: 'Integrated science curriculum framework'
      }
    ];

    console.log(`✅ Test API returning ${mockFrameworks.length} mock frameworks`);

    res.json({
      success: true,
      data: mockFrameworks,
      count: mockFrameworks.length,
      message: '✅ API working! Mock data returned successfully.',
      timestamp: new Date().toISOString(),
      endpoint: '/api/v1/test/kct-data',
      auth: 'none',
      orm: 'mock'
    });
  } catch (error: unknown) {
    console.error('❌ Test API error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ API test failed'
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/permissions', permissionsRoutes);
app.use('/api/v1/scopes', scopesRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/kct', curriculumRoutes);
app.use('/api/v1/kct', versionRoutes); // Mount version routes under /kct for framework-specific endpoints
app.use('/api/v1/versions', versionRoutes); // Also mount under /versions for direct version access
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/mappings', mappingRoutes);
app.use('/api/v1/exports', exportRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/saved-views', savedViewRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/auth', advancedAuthRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/kct', advancedFrameworkRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Validate environment configuration
    validateEnv();

    // Skip database connection test in development if SKIP_DB_TEST is set
    if (process.env.SKIP_DB_TEST !== 'true') {
      await config.testConnection();
      logger.info('Database connection established');
    } else {
      logger.warn('Skipping database connection test (SKIP_DB_TEST=true)');
    }

    // Initialize background queues (skip if database not available)
    try {
      await initializeQueues();
      logger.info('Background queues initialized');
    } catch (queueError) {
      logger.warn('Failed to initialize queues, continuing without them:', queueError);
    }

    // Ensure required tables exist at startup
    try {
      await ensureAssignmentsTable();
      await ensureGamesTable();
      await ensurePracticeSessionsTable();
      logger.info('Schema ensured: assignments, games, practice sessions');
    } catch (schemaError) {
      logger.error('Failed to ensure schema at startup:', schemaError);
      // In production, failing to ensure schema should stop startup
      if (isProduction) throw schemaError;
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API available at: http://localhost:${PORT}/api/v1/`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
