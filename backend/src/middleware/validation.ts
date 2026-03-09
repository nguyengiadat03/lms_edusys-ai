import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Middleware để validate request body với Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errorMessages
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Lỗi validation',
        error: error.message
      });
    }
  };
};

/**
 * Middleware để validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Query parameters không hợp lệ',
          errors: errorMessages
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Lỗi validation query',
        error: error.message
      });
    }
  };
};

/**
 * Middleware để validate path parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Path parameters không hợp lệ',
          errors: errorMessages
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Lỗi validation params',
        error: error.message
      });
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().regex(/^\d+$/, 'ID phải là số nguyên dương').transform(val => BigInt(val))
  }),

  // Pagination query validation
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc')
  }),

  // Search query validation
  search: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    from_date: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format'),
    to_date: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date format')
  }),

  // File upload validation
  fileUpload: z.object({
    file: z.object({
      originalname: z.string(),
      mimetype: z.string(),
      size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
      buffer: z.instanceof(Buffer)
    })
  }),

  // Email validation
  email: z.string().email('Email không hợp lệ'),

  // Password validation
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),

  // Phone validation
  phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ'),

  // URL validation
  url: z.string().url('URL không hợp lệ'),

  // JSON validation
  json: z.string().refine(val => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'JSON không hợp lệ')
};

/**
 * Helper function để tạo validation middleware cho CRUD operations
 */
export const createCrudValidation = (schemas: {
  create?: ZodSchema;
  update?: ZodSchema;
  query?: ZodSchema;
}) => {
  return {
    create: schemas.create ? validateRequest(schemas.create) : (req: Request, res: Response, next: NextFunction) => next(),
    update: schemas.update ? validateRequest(schemas.update) : (req: Request, res: Response, next: NextFunction) => next(),
    query: schemas.query ? validateQuery(schemas.query) : (req: Request, res: Response, next: NextFunction) => next(),
    params: validateParams(commonSchemas.idParam)
  };
};

/**
 * Middleware để sanitize input data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Helper function để sanitize object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove potential XSS
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export default {
  validateRequest,
  validateQuery,
  validateParams,
  commonSchemas,
  createCrudValidation,
  sanitizeInput
};