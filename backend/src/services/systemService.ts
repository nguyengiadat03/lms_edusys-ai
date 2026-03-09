import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SystemService {
  /**
   * Lấy thông tin hệ thống
   */
  static async getSystemInfo() {
    try {
      const systemInfo = {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database_status: 'connected',
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };

      return systemInfo;
    } catch (error) {
      throw new Error(`Lỗi khi lấy thông tin hệ thống: ${error.message}`);
    }
  }

  /**
   * Lấy thống kê hệ thống
   */
  static async getSystemStats() {
    try {
      const [
        totalTenants,
        activeTenants,
        totalUsers,
        totalClasses,
        activeClasses,
        totalAssignments,
        activeSessions
      ] = await Promise.all([
        prisma.tenants.count(),
        prisma.tenants.count({ where: { is_active: true } }),
        prisma.users.count(),
        prisma.classes.count(),
        prisma.classes.count({ where: { status: 'active' } }),
        prisma.assignments.count(),
        prisma.users.count({ 
          where: { 
            last_login_at: { 
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
            } 
          } 
        })
      ]);

      return {
        tenants: {
          total: totalTenants,
          active: activeTenants
        },
        users: {
          total: totalUsers,
          active_24h: activeSessions
        },
        classes: {
          total: totalClasses,
          active: activeClasses
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
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê hệ thống: ${error.message}`);
    }
  }

  /**
   * Cập nhật chế độ bảo trì
   */
  static async updateMaintenanceMode(enabled: boolean, message?: string, estimatedDuration?: number, userId?: bigint) {
    try {
      // Note: The settings table doesn't have a 'key' field or maintenance_mode specific fields
      // This method needs to be updated to match the actual settings table structure
      // For now, we'll store maintenance mode in a JSON field or create a separate table

      // Since the settings table structure doesn't support this, we'll return a placeholder
      console.warn('updateMaintenanceMode: Settings table structure needs to be updated to support maintenance mode');

      return {
        enabled,
        message,
        estimated_duration: estimatedDuration,
        note: 'Maintenance mode storage not implemented - settings table needs restructuring'
      };
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật chế độ bảo trì: ${error.message}`);
    }
  }

  /**
   * Lấy nhật ký hệ thống
   */
  static async getSystemLogs(page: number = 1, limit: number = 50, level?: string) {
    try {
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

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy nhật ký hệ thống: ${error.message}`);
    }
  }

  /**
   * Ghi log audit
   */
  static async logAudit(data: {
    tenant_id: bigint;
    actor_id?: bigint;
    session_id?: string;
    action: string;
    entity_type: string;
    entity_id: bigint;
    old_values?: any;
    new_values?: any;
    metadata?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      return await prisma.audit_logs.create({
        data: {
          tenant_id: data.tenant_id,
          actor_id: data.actor_id,
          session_id: data.session_id,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          old_values: data.old_values,
          new_values: data.new_values,
          metadata: data.metadata,
          ip_address: data.ip_address,
          user_agent: data.user_agent
        }
      });
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw error for audit logging to prevent breaking main operations
    }
  }

  /**
   * Kiểm tra trạng thái bảo trì
   */
  static async getMaintenanceStatus() {
    try {
      // Note: The settings table doesn't have a 'key' field or maintenance_mode specific fields
      // This method needs to be updated to match the actual settings table structure
      // For now, we'll return default maintenance status

      console.warn('getMaintenanceStatus: Settings table structure needs to be updated to support maintenance mode');

      return {
        enabled: false,
        note: 'Maintenance mode storage not implemented - settings table needs restructuring'
      };
    } catch (error) {
      console.error('Get maintenance status error:', error);
      return { enabled: false };
    }
  }

  /**
   * Lấy thống kê sử dụng theo thời gian
   */
  static async getUsageStats(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyStats = await prisma.audit_logs.groupBy({
        by: ['created_at'],
        where: {
          created_at: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          created_at: 'asc'
        }
      });

      // Group by date
      const statsMap = new Map();
      dailyStats.forEach(stat => {
        const date = stat.created_at.toISOString().split('T')[0];
        statsMap.set(date, (statsMap.get(date) || 0) + stat._count.id);
      });

      // Fill missing dates with 0
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          count: statsMap.get(dateStr) || 0
        });
      }

      return result;
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê sử dụng: ${error.message}`);
    }
  }

  /**
   * Lấy thống kê hiệu suất hệ thống
   */
  static async getPerformanceStats() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        recentErrors,
        activeUsers,
        systemLoad
      ] = await Promise.all([
        prisma.audit_logs.count({
          where: {
            action: { contains: 'error' },
            created_at: { gte: oneHourAgo }
          }
        }),
        prisma.users.count({
          where: {
            last_login_at: { gte: oneHourAgo }
          }
        }),
        // System load metrics
        Promise.resolve({
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        })
      ]);

      return {
        errors_last_hour: recentErrors,
        active_users_last_hour: activeUsers,
        system_load: systemLoad,
        timestamp: now.toISOString()
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê hiệu suất: ${error.message}`);
    }
  }

  /**
   * Cleanup old audit logs
   */
  static async cleanupOldLogs(daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.audit_logs.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      return {
        deleted_count: result.count,
        cutoff_date: cutoffDate
      };
    } catch (error) {
      throw new Error(`Lỗi khi dọn dẹp logs cũ: ${error.message}`);
    }
  }
}

export default SystemService;