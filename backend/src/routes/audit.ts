import express from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// GET /api/v1/audit-logs - Get audit logs
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const action = req.query.action as string;
  const category = req.query.category as string;
  const userId = req.query.userId as string;

  const logsDir = path.join(process.cwd(), 'logs');
  const auditLogPath = path.join(logsDir, 'audit.log');

  let logs: any[] = [];

  try {
    if (fs.existsSync(auditLogPath)) {
      const logContent = fs.readFileSync(auditLogPath, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());

      logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(log => log !== null);
    }
  } catch (error) {
    // If file read fails, return empty array
    logs = [];
  }

  // Filter logs
  let filteredLogs = logs;

  if (action) {
    filteredLogs = filteredLogs.filter(log => log.action === action);
  }

  if (category) {
    filteredLogs = filteredLogs.filter(log => log.category === category);
  }

  if (userId) {
    filteredLogs = filteredLogs.filter(log =>
      log.userId === userId ||
      log.actorId === userId ||
      log.actor_id === userId
    );
  }

  // Sort by timestamp descending
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Paginate
  const total = filteredLogs.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  res.json({
    logs: paginatedLogs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

export default router;