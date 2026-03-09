import express from 'express';
import { config } from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Helper function to build tree structure
function buildTree(units: any[]): any[] {
  const unitMap = new Map();
  const roots: any[] = [];

  // Create map of units
  units.forEach(unit => {
    unit.children = [];
    unitMap.set(unit.id, unit);
  });

  // Build tree
  units.forEach(unit => {
    if (unit.parent_id) {
      const parent = unitMap.get(unit.parent_id);
      if (parent) {
        parent.children.push(unit);
      }
    } else {
      roots.push(unit);
    }
  });

  return roots;
}

// GET /api/v1/scopes/tree - Get organizational units tree
router.get('/tree', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const tenantId = req.user!.tenantId;

  const [units] = await config.query(
    `SELECT id, tenant_id, parent_id, campus_id, code, name, kind, description, created_at
     FROM org_units
     WHERE tenant_id = ?
     ORDER BY parent_id, name`,
    [tenantId]
  );

  const tree = buildTree(units);

  res.json({ scopes: tree });
}));

export default router;