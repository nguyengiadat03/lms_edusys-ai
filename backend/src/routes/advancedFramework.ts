import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { auditLog } from '../middleware/auditLog';
import { z } from 'zod';
import { AdvancedFrameworkService } from '../services/advancedFrameworkService';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const cloneKCTSchema = z.object({
  name: z.string().min(1, 'Tên KCT là bắt buộc'),
  code: z.string().min(1, 'Mã KCT là bắt buộc'),
  description: z.string().optional(),
  copy_courses: z.boolean().default(true),
  copy_units: z.boolean().default(true),
  copy_resources: z.boolean().default(false)
});

const exportKCTSchema = z.object({
  format: z.enum(['pdf', 'docx', 'scorm']),
  include_courses: z.boolean().default(true),
  include_units: z.boolean().default(true),
  include_resources: z.boolean().default(false),
  template: z.string().optional()
});

/**
 * Clone KCT với metadata
 */
router.post('/:id/clone',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  validateRequest(cloneKCTSchema),
  auditLog('curriculum_framework', 'clone'),
  async (req, res) => {
    try {
      const frameworkId = BigInt(req.params.id);
      const { name, code, description, copy_courses, copy_units, copy_resources } = req.body;

      // Check if source framework exists and user has access
      const sourceFramework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: frameworkId,
          tenant_id: req.user?.tenant_id
        }
      });

      if (!sourceFramework) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy KCT để clone'
        });
      }

      // Check if code already exists
      const existingFramework = await prisma.curriculum_frameworks.findFirst({
        where: {
          code,
          tenant_id: req.user?.tenant_id,
          deleted_at: null
        }
      });

      if (existingFramework) {
        return res.status(400).json({
          success: false,
          message: 'Mã KCT đã tồn tại'
        });
      }

      // Clone framework
      const clonedFramework = await AdvancedFrameworkService.cloneFramework({
        sourceId: frameworkId,
        name,
        code,
        description,
        copyOptions: {
          courses: copy_courses,
          units: copy_units,
          resources: copy_resources
        },
        tenantId: req.user?.tenant_id || BigInt(1),
        userId: req.user?.id || BigInt(1)
      });

      res.status(201).json({
        success: true,
        message: 'KCT được clone thành công',
        data: clonedFramework
      });
    } catch (error: any) {
      console.error('Clone KCT error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi clone KCT',
        error: error.message
      });
    }
  }
);

/**
 * Export KCT sang PDF/DOCX/SCORM
 */
router.post('/:id/export',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  validateRequest(exportKCTSchema),
  auditLog('curriculum_framework', 'export'),
  async (req, res) => {
    try {
      const frameworkId = BigInt(req.params.id);
      const { format, include_courses, include_units, include_resources, template } = req.body;

      // Check framework access
      const framework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: frameworkId,
          tenant_id: req.user?.tenant_id,
          deleted_at: null
        }
      });

      if (!framework) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy KCT'
        });
      }

      // Create export job
      const exportJob = await AdvancedFrameworkService.createExportJob({
        frameworkId,
        format,
        options: {
          includeCourses: include_courses,
          includeUnits: include_units,
          includeResources: include_resources,
          template
        },
        userId: req.user?.id || BigInt(1)
      });

      res.json({
        success: true,
        message: 'Export job được tạo thành công',
        data: {
          job_id: exportJob.id,
          status: exportJob.status,
          estimated_completion: exportJob.estimated_completion
        }
      });
    } catch (error: any) {
      console.error('Export KCT error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi export KCT',
        error: error.message
      });
    }
  }
);

/**
 * So sánh 2 KCT + diff
 */
router.get('/:id/compare/:otherId',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const frameworkId1 = BigInt(req.params.id);
      const frameworkId2 = BigInt(req.params.otherId);

      // Check both frameworks exist and user has access
      const frameworks = await prisma.curriculum_frameworks.findMany({
        where: {
          id: { in: [frameworkId1, frameworkId2] },
          tenant_id: req.user?.tenant_id,
          deleted_at: null
        }
      });

      if (frameworks.length !== 2) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy một hoặc cả hai KCT'
        });
      }

      // Compare frameworks
      const comparison = await AdvancedFrameworkService.compareFrameworks(frameworkId1, frameworkId2);

      res.json({
        success: true,
        data: comparison
      });
    } catch (error: any) {
      console.error('Compare KCT error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi so sánh KCT',
        error: error.message
      });
    }
  }
);

/**
 * Validate framework structure
 */
router.post('/:id/validate',
  authenticateToken,
  auditLog('curriculum_framework', 'validate'),
  async (req, res) => {
    try {
      const frameworkId = BigInt(req.params.id);

      // Check framework access
      const framework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: frameworkId,
          tenant_id: req.user?.tenant_id,
          deleted_at: null
        }
      });

      if (!framework) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy KCT'
        });
      }

      // Validate framework
      const validation = await AdvancedFrameworkService.validateFramework(frameworkId);

      res.json({
        success: true,
        data: validation
      });
    } catch (error: any) {
      console.error('Validate KCT error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi validate KCT',
        error: error.message
      });
    }
  }
);

/**
 * Get CEFR mapping matrix
 */
router.get('/:id/cefr-mapping',
  authenticateToken,
  async (req, res) => {
    try {
      const frameworkId = BigInt(req.params.id);

      // Check framework access
      const framework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: frameworkId,
          tenant_id: req.user?.tenant_id,
          deleted_at: null
        }
      });

      if (!framework) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy KCT'
        });
      }

      // Get CEFR mapping
      const cefrMapping = await AdvancedFrameworkService.getCEFRMapping(frameworkId);

      res.json({
        success: true,
        data: cefrMapping
      });
    } catch (error: any) {
      console.error('Get CEFR mapping error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy CEFR mapping',
        error: error.message
      });
    }
  }
);

/**
 * Get coverage analysis
 */
router.get('/:id/coverage',
  authenticateToken,
  async (req, res) => {
    try {
      const frameworkId = BigInt(req.params.id);

      // Check framework access
      const framework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: frameworkId,
          tenant_id: req.user?.tenant_id,
          deleted_at: null
        }
      });

      if (!framework) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy KCT'
        });
      }

      // Get coverage analysis
      const coverage = await AdvancedFrameworkService.getCoverageAnalysis(frameworkId);

      res.json({
        success: true,
        data: coverage
      });
    } catch (error: any) {
      console.error('Get coverage error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy coverage analysis',
        error: error.message
      });
    }
  }
);

/**
 * Get AI suggestions
 */
router.post('/:id/ai-suggestions',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  auditLog('curriculum_framework', 'ai_suggestions'),
  async (req, res) => {
    try {
      const frameworkId = BigInt(req.params.id);
      const { focus_areas, target_level, language } = req.body;

      // Check framework access
      const framework = await prisma.curriculum_frameworks.findFirst({
        where: {
          id: frameworkId,
          tenant_id: req.user?.tenant_id,
          deleted_at: null
        }
      });

      if (!framework) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy KCT'
        });
      }

      // Get AI suggestions
      const suggestions = await AdvancedFrameworkService.getAISuggestions({
        frameworkId,
        focusAreas: focus_areas,
        targetLevel: target_level,
        language
      });

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error: any) {
      console.error('AI suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy AI suggestions',
        error: error.message
      });
    }
  }
);

export default router;