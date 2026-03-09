import { Request, Response, NextFunction } from 'express';
import { SystemService } from '../services/systemService';
import { AuthUser } from './auth';

interface AuditRequest extends Request {
  user?: AuthUser;
  sessionID?: string;
  auditData?: {
    entity_type: string;
    entity_id?: bigint;
    action: string;
    old_values?: any;
    new_values?: any;
  };
}

/**
 * Middleware để ghi log audit tự động
 */
export const auditLog = (entityType: string, action: string) => {
  return async (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture response data
    let responseData: any;

    res.send = function(data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      // Serialize BigInt values in response data
      const serializeBigInt = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeBigInt);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeBigInt(obj[key]);
          }
          return result;
        }
        return obj;
      };

      responseData = serializeBigInt(data);
      return originalJson.call(this, responseData);
    };

    // Store audit data in request for later use
    req.auditData = {
      entity_type: entityType,
      action: action
    };

    // Continue with the request
    next();

    // Log audit after response is sent
    res.on('finish', async () => {
      try {
        if (req.user && res.statusCode < 400) {
          const auditData = {
            tenant_id: req.user.tenant_id,
            actor_id: req.user.id,
            session_id: req.sessionID,
            action: `${action}_${entityType}`,
            entity_type: entityType,
            entity_id: req.auditData?.entity_id || BigInt(0),
            old_values: req.auditData?.old_values,
            new_values: req.auditData?.new_values || (responseData?.data ? responseData.data : null),
            metadata: {
              method: req.method,
              url: req.originalUrl,
              status_code: res.statusCode,
              user_agent: req.get('User-Agent'),
              ip_address: req.ip || req.connection.remoteAddress
            },
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
          };

          await SystemService.logAudit(auditData);
        }
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw error to prevent breaking the main request
      }
    });
  };
};

/**
 * Middleware để capture old values trước khi update/delete
 */
export const captureOldValues = (entityType: string, getEntityFn: (req: Request) => Promise<any>) => {
  return async (req: AuditRequest, res: Response, next: NextFunction) => {
    try {
      if (req.method === 'PATCH' || req.method === 'PUT' || req.method === 'DELETE') {
        const oldEntity = await getEntityFn(req);
        if (req.auditData) {
          req.auditData.old_values = oldEntity;
          req.auditData.entity_id = oldEntity?.id;
        }
      }
    } catch (error) {
      console.error('Capture old values error:', error);
    }
    next();
  };
};

/**
 * Helper function để tạo audit log thủ công
 */
export const createAuditLog = async (data: {
  user_id: bigint;
  tenant_id: bigint;
  action: string;
  entity_type: string;
  entity_id: bigint;
  old_values?: any;
  new_values?: any;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}) => {
  try {
    await SystemService.logAudit({
      tenant_id: data.tenant_id,
      actor_id: data.user_id,
      session_id: data.session_id,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      old_values: data.old_values,
      new_values: data.new_values,
      metadata: data.metadata,
      ip_address: data.ip_address,
      user_agent: data.user_agent
    });
  } catch (error) {
    console.error('Manual audit log error:', error);
  }
};

/**
 * Middleware để log các action quan trọng
 */
export const logCriticalAction = (action: string, entityType: string) => {
  return auditLog(entityType, `CRITICAL_${action}`);
};

/**
 * Middleware để log login/logout
 */
export const logAuthAction = (action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED') => {
  return async (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    let responseData: any;

    res.send = function(data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      // Serialize BigInt values in response data
      const serializeBigInt = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeBigInt);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeBigInt(obj[key]);
          }
          return result;
        }
        return obj;
      };

      responseData = serializeBigInt(data);
      return originalJson.call(this, responseData);
    };

    next();

    res.on('finish', async () => {
      try {
        let userId: bigint | undefined;
        let tenantId: bigint | undefined;

        if (action === 'LOGIN' && responseData?.data?.user) {
          userId = BigInt(responseData.data.user.id);
          tenantId = BigInt(responseData.data.user.tenant_id);
        } else if (action === 'LOGOUT' && req.user) {
          userId = req.user.id;
          tenantId = req.user.tenant_id;
        } else if (action === 'LOGIN_FAILED') {
          // For failed login, we don't have user info
          tenantId = BigInt(1); // System tenant
        }

        if (tenantId) {
          await SystemService.logAudit({
            tenant_id: tenantId,
            actor_id: userId,
            session_id: req.sessionID,
            action: action,
            entity_type: 'auth',
            entity_id: userId || BigInt(0),
            metadata: {
              method: req.method,
              url: req.originalUrl,
              status_code: res.statusCode,
              email: req.body?.email || req.user?.email,
              success: res.statusCode < 400
            },
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
          });
        }
      } catch (error) {
        console.error('Auth audit logging error:', error);
      }
    });
  };
};

export default {
  auditLog,
  captureOldValues,
  createAuditLog,
  logCriticalAction,
  logAuthAction
};