import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  estimated_duration: z.number().optional()
});

const tenantCreateSchema = z.object({
  code: z.string().min(2).max(64),
  name: z.string().min(1).max(255),
  domain: z.string().optional(),
  settings: z.object({}).optional(),
  is_active: z.boolean().default(true)
});

const tenantUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  domain: z.string().optional(),
  settings: z.object({}).optional(),
  is_active: z.boolean().optional()
});

const settingsUpdateSchema = z.object({
  key: z.string(),
  value: z.any(),
  category: z.string().optional()
});

/**
 * @swagger
 * /api/v1/system/info:
 *   get:
 *     summary: Lấy thông tin hệ thống
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin hệ thống
 */
router.get('/info', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const systemInfo = {
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database_status: 'connected',
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin hệ thống',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/system/stats:
 *   get:
 *     summary: Lấy thống kê hệ thống
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê hệ thống
 */
router.get('/stats', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const [
      totalTenants,
      totalUsers,
      totalClasses,
      totalAssignments,
      activeSessions
    ] = await Promise.all([
      prisma.tenants.count(),
      prisma.users.count(),
      prisma.classes.count(),
      prisma.assignments.count(),
      prisma.users.count({ where: { last_login_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    ]);

    const stats = {
      tenants: {
        total: totalTenants,
        active: await prisma.tenants.count({ where: { is_active: true } })
      },
      users: {
        total: totalUsers,
        active_24h: activeSessions
      },
      classes: {
        total: totalClasses,
        active: await prisma.classes.count({ where: { status: 'active' } })
      },
      assignments: {
        total: totalAssignments
      },
      system: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê hệ thống',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/system/maintenance:
 *   post:
 *     summary: Bật/tắt chế độ bảo trì
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               message:
 *                 type: string
 *               estimated_duration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật chế độ bảo trì thành công
 */
router.post('/maintenance', 
  authenticateToken, 
  requireRole(['super_admin']), 
  validateRequest(maintenanceSchema),
  async (req, res) => {
    try {
      const { enabled, message, estimated_duration } = req.body;

      // Lưu trạng thái maintenance vào settings
      await prisma.settings.upsert({
        where: {
          tenant_id_key: {
            tenant_id: BigInt(1), // System-wide setting
            key: 'maintenance_mode'
          }
        },
        update: {
          value: JSON.stringify({
            enabled,
            message,
            estimated_duration,
            updated_at: new Date(),
            updated_by: req.user.id
          })
        },
        create: {
          tenant_id: BigInt(1),
          key: 'maintenance_mode',
          value: JSON.stringify({
            enabled,
            message,
            estimated_duration,
            updated_at: new Date(),
            updated_by: req.user.id
          }),
          category: 'system'
        }
      });

      res.json({
        success: true,
        message: `Chế độ bảo trì đã được ${enabled ? 'bật' : 'tắt'}`,
        data: {
          enabled,
          message,
          estimated_duration
        }
      });
    } catch (error) {
      console.error('Maintenance mode error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật chế độ bảo trì',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/system/logs:
 *   get:
 *     summary: Lấy nhật ký hệ thống
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *     responses:
 *       200:
 *         description: Danh sách nhật ký hệ thống
 */
router.get('/logs', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const level = req.query.level as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (level) {
      where.action = { contains: level };
    }

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              full_name: true
            }
          }
        }
      }),
      prisma.audit_logs.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('System logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy nhật ký hệ thống',
      error: error.message
    });
  }
});

// TENANT MANAGEMENT ENDPOINTS

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     summary: Lấy danh sách tenant (super admin only)
 *     tags: [Tenant Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tenant
 */
router.get('/tenants', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const tenants = await prisma.tenants.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
            assignments: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tenant',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/tenants:
 *   post:
 *     summary: Tạo tenant mới
 *     tags: [Tenant Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               settings:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tenant được tạo thành công
 */
router.post('/tenants', 
  authenticateToken, 
  requireRole(['super_admin']), 
  validateRequest(tenantCreateSchema),
  async (req, res) => {
    try {
      const { code, name, domain, settings, is_active } = req.body;

      // Kiểm tra code đã tồn tại
      const existingTenant = await prisma.tenants.findUnique({
        where: { code }
      });

      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Mã tenant đã tồn tại'
        });
      }

      const tenant = await prisma.tenants.create({
        data: {
          code,
          name,
          domain,
          settings: settings || {},
          is_active: is_active ?? true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Tenant được tạo thành công',
        data: tenant
      });
    } catch (error) {
      console.error('Create tenant error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo tenant',
        error: error.message
      });
    }
  }
);

export default router;/**

 * @swagger
 * /api/v1/tenants/{id}:
 *   get:
 *     summary: Lấy chi tiết tenant
 *     tags: [Tenant Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết tenant
 */
router.get('/tenants/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const tenantId = BigInt(req.params.id);

    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
            assignments: true,
            curriculum_frameworks: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tenant'
      });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết tenant',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   patch:
 *     summary: Cập nhật tenant
 *     tags: [Tenant Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               settings:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tenant được cập nhật thành công
 */
router.patch('/tenants/:id', 
  authenticateToken, 
  requireRole(['super_admin']), 
  validateRequest(tenantUpdateSchema),
  async (req, res) => {
    try {
      const tenantId = BigInt(req.params.id);
      const updateData = req.body;

      const tenant = await prisma.tenants.update({
        where: { id: tenantId },
        data: {
          ...updateData,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Tenant được cập nhật thành công',
        data: tenant
      });
    } catch (error) {
      console.error('Update tenant error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tenant'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật tenant',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   delete:
 *     summary: Xóa tenant
 *     tags: [Tenant Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant được xóa thành công
 */
router.delete('/tenants/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const tenantId = BigInt(req.params.id);

    // Kiểm tra tenant có dữ liệu liên quan không
    const relatedData = await prisma.tenants.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
            assignments: true
          }
        }
      }
    });

    if (!relatedData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tenant'
      });
    }

    const totalRelated = relatedData._count.users + relatedData._count.classes + relatedData._count.assignments;
    
    if (totalRelated > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tenant có dữ liệu liên quan',
        data: {
          users: relatedData._count.users,
          classes: relatedData._count.classes,
          assignments: relatedData._count.assignments
        }
      });
    }

    await prisma.tenants.delete({
      where: { id: tenantId }
    });

    res.json({
      success: true,
      message: 'Tenant được xóa thành công'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tenant',
      error: error.message
    });
  }
});

// SETTINGS MANAGEMENT

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Lấy cài đặt hệ thống
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cài đặt hệ thống
 */
router.get('/settings', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const category = req.query.category as string;
    const tenantId = req.user.role === 'super_admin' ? BigInt(1) : BigInt(req.user.tenant_id);

    const where: any = { tenant_id: tenantId };
    if (category) {
      where.category = category;
    }

    const settings = await prisma.settings.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const cat = setting.category || 'general';
      if (!acc[cat]) {
        acc[cat] = {};
      }
      acc[cat][setting.key] = {
        value: setting.value,
        updated_at: setting.updated_at
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedSettings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cài đặt',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/settings:
 *   patch:
 *     summary: Cập nhật cài đặt hệ thống
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cài đặt được cập nhật thành công
 */
router.patch('/settings', 
  authenticateToken, 
  requireRole(['admin', 'super_admin']), 
  validateRequest(settingsUpdateSchema),
  async (req, res) => {
    try {
      const { key, value, category } = req.body;
      const tenantId = req.user.role === 'super_admin' ? BigInt(1) : BigInt(req.user.tenant_id);

      const setting = await prisma.settings.upsert({
        where: {
          tenant_id_key: {
            tenant_id: tenantId,
            key
          }
        },
        update: {
          value: typeof value === 'string' ? value : JSON.stringify(value),
          category: category || 'general',
          updated_at: new Date()
        },
        create: {
          tenant_id: tenantId,
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          category: category || 'general'
        }
      });

      res.json({
        success: true,
        message: 'Cài đặt được cập nhật thành công',
        data: setting
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật cài đặt',
        error: error.message
      });
    }
  }
);

// AUDIT LOGS

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Lấy nhật ký kiểm tra
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách nhật ký kiểm tra
 */
router.get('/audit-logs', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const entity_type = req.query.entity_type as string;
    const user_id = req.query.user_id as string;
    const skip = (page - 1) * limit;

    const where: any = {
      tenant_id: BigInt(req.user.tenant_id)
    };

    if (action) where.action = { contains: action };
    if (entity_type) where.entity_type = entity_type;
    if (user_id) where.actor_id = BigInt(user_id);

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              full_name: true
            }
          }
        }
      }),
      prisma.audit_logs.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy nhật ký kiểm tra',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/audit-logs/{id}:
 *   get:
 *     summary: Lấy chi tiết nhật ký kiểm tra
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết nhật ký kiểm tra
 */
router.get('/audit-logs/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const logId = BigInt(req.params.id);

    const log = await prisma.audit_logs.findFirst({
      where: {
        id: logId,
        tenant_id: BigInt(req.user.tenant_id)
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhật ký'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết nhật ký',
      error: error.message
    });
  }
});

// NOTIFICATIONS

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Lấy thông báo người dùng
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unread_only = req.query.unread_only === 'true';
    const skip = (page - 1) * limit;

    const where: any = {
      user_id: BigInt(req.user.id)
    };

    if (unread_only) {
      where.read_at = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.user_notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.user_notifications.count({ where }),
      prisma.user_notifications.count({
        where: {
          user_id: BigInt(req.user.id),
          read_at: null
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 */
router.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = BigInt(req.params.id);

    const notification = await prisma.user_notifications.updateMany({
      where: {
        id: notificationId,
        user_id: BigInt(req.user.id)
      },
      data: {
        read_at: new Date()
      }
    });

    if (notification.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    res.json({
      success: true,
      message: 'Đánh dấu đã đọc thành công'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu thông báo',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/notifications/bulk-read:
 *   post:
 *     summary: Đánh dấu tất cả thông báo đã đọc
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đánh dấu tất cả thành công
 */
router.post('/notifications/bulk-read', authenticateToken, async (req, res) => {
  try {
    const result = await prisma.user_notifications.updateMany({
      where: {
        user_id: BigInt(req.user.id),
        read_at: null
      },
      data: {
        read_at: new Date()
      }
    });

    res.json({
      success: true,
      message: `Đã đánh dấu ${result.count} thông báo là đã đọc`
    });
  } catch (error) {
    console.error('Bulk mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu tất cả thông báo',
      error: error.message
    });
  }
});

export default router;