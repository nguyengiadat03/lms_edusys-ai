import { Request, Response, NextFunction } from 'express';
import { SystemService } from '../services/systemService';

interface MaintenanceRequest extends Request {
  user?: {
    id: bigint;
    tenant_id: bigint;
    email: string;
    role: string;
  };
}

/**
 * Middleware để kiểm tra maintenance mode
 */
export const checkMaintenanceMode = async (req: MaintenanceRequest, res: Response, next: NextFunction) => {
  try {
    // Skip maintenance check for certain routes
    const skipRoutes = [
      '/api/v1/system/maintenance',
      '/api/v1/system/info',
      '/api/v1/auth/login',
      '/api/v1/auth/logout'
    ];

    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Skip maintenance check for super admin
    if (req.user?.role === 'super_admin') {
      return next();
    }

    const maintenanceStatus = await SystemService.getMaintenanceStatus();

    if (maintenanceStatus.enabled) {
      return res.status(503).json({
        success: false,
        message: 'Hệ thống đang trong chế độ bảo trì',
        data: {
          maintenance: true,
          message: maintenanceStatus.message || 'Hệ thống đang được bảo trì, vui lòng thử lại sau.',
          estimated_duration: maintenanceStatus.estimated_duration,
          updated_at: maintenanceStatus.updated_at
        }
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance check error:', error);
    // If there's an error checking maintenance mode, allow the request to continue
    next();
  }
};

/**
 * Middleware để bypass maintenance mode cho admin
 */
export const bypassMaintenanceForAdmin = (req: MaintenanceRequest, res: Response, next: NextFunction) => {
  // Admin và super admin có thể bypass maintenance mode
  if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
    return next();
  }

  // Cho các user khác, vẫn check maintenance mode
  return checkMaintenanceMode(req, res, next);
};

/**
 * Helper function để set maintenance mode
 */
export const setMaintenanceMode = async (enabled: boolean, message?: string, estimatedDuration?: number, userId?: bigint) => {
  try {
    return await SystemService.updateMaintenanceMode(enabled, message, estimatedDuration, userId);
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật maintenance mode: ${error.message}`);
  }
};

/**
 * Helper function để check maintenance status
 */
export const getMaintenanceStatus = async () => {
  try {
    return await SystemService.getMaintenanceStatus();
  } catch (error) {
    console.error('Get maintenance status error:', error);
    return { enabled: false };
  }
};

export default {
  checkMaintenanceMode,
  bypassMaintenanceForAdmin,
  setMaintenanceMode,
  getMaintenanceStatus
};