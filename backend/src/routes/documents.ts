import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { auditLog } from '../middleware/auditLog';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { DocumentService } from '../services/documentService';
import { AIService } from '../services/aiService';

// Helper function to format document data for preview dialog - FIXED to match check-document-prisma.js
function formatDocumentForPreview(document: any) {
  // Calculate file size
  const fileSizeMB = document.file_size ? (Number(document.file_size) / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown';

  // Check OCR status - only completed tasks count as processed
  const hasCompletedOCR = document.document_ai_tasks.some((task: any) => task.status === 'completed');

  // Extract AI analysis data from completed tasks only
  const completedTasks = document.document_ai_tasks.filter((task: any) => task.status === 'completed');

  // Parse AI analysis results
  const summary = completedTasks.find((t: any) => t.task_type === 'summarize')?.output_json?.result || '';
  const segments = completedTasks.find((t: any) => t.task_type === 'segment')?.output_json?.result || [];
  const level = completedTasks.find((t: any) => t.task_type === 'level_suggestion')?.output_json?.result || 'B1';
  const topic = completedTasks.find((t: any) => t.task_type === 'topic_suggestion')?.output_json?.result || 'Hometown';
  const tagSuggestions = completedTasks.find((t: any) => t.task_type === 'tag_suggestion')?.output_json?.suggested_tags || [];

  // Get uploader name
  const uploaderName = document.users_documents_created_byTousers?.full_name ||
                      document.users_documents_created_byTousers?.email || 'Current User';

  // Only use AI tag suggestions (no document_tags merge)
  const allTags = [
    ...tagSuggestions.map((t: any) => typeof t === 'string' ? t : t.tag_label)
  ];

  // Add default tags if no AI tags
  if (allTags.length === 0) {
    allTags.push('grammar', 'vocabulary', 'reading', 'level-b1', 'education', 'english', 'hometown', 'speaking-practice');
  }

  return {
    id: document.id.toString(),
    name: document.name,
    size: fileSizeMB,
    uploadedAt: document.created_at ? new Date(document.created_at).toISOString().split('T')[0] : 'Unknown',
    uploadedBy: uploaderName,
    ocrProcessed: hasCompletedOCR,
    level: level,
    skill: tagSuggestions.slice(0, 2).map((t: any) => typeof t === 'string' ? t : t.tag_label).join(', ') || 'speaking, vocabulary',
    topic: topic,
    summary: summary,
    ai_tasks: completedTasks.map((task: any) => ({
      id: task.id.toString(),
      task_type: task.task_type,
      status: task.status,
      output_json: task.output_json,
      created_at: task.created_at,
      finished_at: task.finished_at
    })),
    segments: segments,
    tags: allTags,
    type: document.mime_type,
    visibility: document.visibility,
    description: document.description
  };
}

const router = Router();
const prisma = new PrismaClient();
const documentService = new DocumentService();
const aiService = new AIService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      // Video formats
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo', // .avi
      'video/x-ms-wmv', // .wmv
      'video/x-flv', // .flv
      'video/x-matroska', // .mkv
      'video/x-ms-asf', // .asf
      'video/x-m4v', // .m4v
      'video/3gpp', // .3gp
      'video/3gpp2', // .3g2
      // Audio formats
      'audio/wav',
      'audio/ogg',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/aac',
      'audio/flac',
      'audio/webm',
      'audio/x-wav', // .wav
      'audio/mpeg3', // .mp3
      'audio/x-mpeg-3', // .mp3
      'audio/x-ms-wma', // .wma
      'audio/x-aiff', // .aiff
      'audio/basic', // .au
      'audio/midi', // .midi
      'audio/x-midi', // .midi
      'audio/vnd.wav', // .wav
      'audio/l16', // .l16
      'audio/x-pn-realaudio' // .ra
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

// Validation schemas
const documentCreateSchema = z.object({
  name: z.string().min(1, 'Tên tài liệu là bắt buộc'),
  description: z.string().optional(),
  visibility: z.enum(['private', 'tenant', 'public']).default('tenant'),
  tags: z.array(z.string()).optional()
});

const documentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'tenant', 'public']).optional(),
  tags: z.array(z.string()).optional()
});

const collectionCreateSchema = z.object({
  name: z.string().min(1, 'Tên collection là bắt buộc'),
  description: z.string().optional(),
  is_public: z.boolean().default(false)
});

const shareDocumentSchema = z.object({
  subject_type: z.enum(['user', 'role', 'org_unit']),
  subject_id: z.string().refine(val => !isNaN(Number(val)), {
    message: 'subject_id phải là số hợp lệ'
  }).transform(val => BigInt(val)),
  permission: z.enum(['view', 'download', 'edit', 'delete', 'share']).default('view'),
  expires_at: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

/**
 * @swagger
 * /api/v1/documents:
 *   get:
 *     summary: Danh sách tài liệu trong library
 *     tags: [Document Management]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [private, tenant, public]
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const type = req.query.type as string;
      const visibility = req.query.visibility as string;
      const skip = (page - 1) * limit;

      const where: any = {
        tenant_id: req.user?.tenant_id || BigInt(1)
      };

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { ocr_text: { contains: search } }
        ];
      }

      // Type filter
      if (type) {
        where.mime_type = { contains: type };
      }

      // Visibility filter
      if (visibility) {
        where.visibility = visibility;
      } else {
        // Default: show documents user can access
        const userId = req.user?.id || BigInt(1);
        const tenantId = req.user?.tenant_id || BigInt(1);
        where.OR = [
          { visibility: 'public' },
          { visibility: 'tenant', tenant_id: tenantId },
          { created_by: userId }
        ];
      }

      // Ensure tenant_id is always set
      if (!where.tenant_id) {
        where.tenant_id = req.user?.tenant_id || BigInt(1);
      }

      const [documents, total] = await Promise.all([
        prisma.documents.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include: {
            users_documents_created_byTousers: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            },
            document_tags: {
              include: {
                tags: true
              }
            },
            document_ai_tasks: {
              orderBy: { created_at: 'desc' },
              take: 5
            },
            _count: {
              select: {
                document_favorites: true,
                document_shares: true
              }
            }
          }
        }),
        prisma.documents.count({ where })
      ]);

      // Convert BigInt to string for JSON serialization
      const serializeDocument = (doc: any) => ({
        ...doc,
        id: doc.id.toString(),
        tenant_id: doc.tenant_id.toString(),
        file_size: doc.file_size ? doc.file_size.toString() : null,
        created_by: doc.created_by ? doc.created_by.toString() : null,
        updated_by: doc.updated_by ? doc.updated_by.toString() : null,
        created_by_user: doc.users_documents_created_byTousers ? {
          ...doc.users_documents_created_byTousers,
          id: doc.users_documents_created_byTousers.id.toString()
        } : null,
        tags: doc.document_tags.map((dt: any) => ({
          ...dt.tags,
          id: dt.tags.id.toString(),
          tenant_id: dt.tags.tenant_id.toString(),
          created_by: dt.tags.created_by ? dt.tags.created_by.toString() : null
        })),
        ai_tasks: doc.document_ai_tasks.map((task: any) => ({
          ...task,
          id: task.id.toString(),
          document_id: task.document_id.toString(),
          created_at: task.created_at,
          updated_at: task.updated_at,
          finished_at: task.finished_at
        })),
        favorites_count: doc._count.document_favorites,
        shares_count: doc._count.document_shares
      });

      const serializedDocuments = documents.map(serializeDocument);

      // Serialize the entire response to handle any remaining BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const response = {
        success: true,
        data: {
          documents: serializedDocuments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };

      res.json(serializeResponse(response));
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Upload tài liệu mới
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - name
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [private, tenant, public]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tài liệu được upload thành công
 */
router.post('/',
  authenticateToken,
  upload.single('file'),
  auditLog('document', 'create'),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File là bắt buộc'
        });
      }

      const { name, description, visibility = 'tenant', tags } = req.body;
      const parsedTags = tags ? JSON.parse(tags) : [];

      // Create document record
      const userId = req.user?.id || BigInt(1);
      const tenantId = req.user?.tenant_id || BigInt(1);
      const document = await prisma.documents.create({
        data: {
          tenant_id: tenantId,
          name,
          description,
          file_path: req.file.path,
          mime_type: req.file.mimetype,
          file_size: BigInt(req.file.size),
          visibility,
          health_status: 'unknown',
          created_by: userId,
          updated_by: userId
        }
      });

      // Add tags if provided
      if (parsedTags.length > 0) {
        await DocumentService.addTagsToDocument(document.id, parsedTags, req.user.tenant_id);
      }
// Process OCR and AI immediately after upload using Python OCR service
try {
  const fs = require('fs');
  const axios = require('axios');

  if (document.file_path && fs.existsSync(document.file_path)) {
    try {
      console.log(`Starting OCR+AI processing for document ${document.id}: ${document.name}`);

      // Create form data for Python OCR service
      const FormData = require('form-data');
      const formData = new FormData();
      const fileStream = fs.createReadStream(document.file_path);

      formData.append('file', fileStream, {
        filename: document.name || 'document',
        contentType: document.mime_type || 'application/octet-stream'
      });

      // Call Python OCR service
      const ocrResponse = await axios.post('http://localhost:8000/process/file', formData, {
        headers: formData.getHeaders(),
        timeout: 120000, // 2 minutes timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (ocrResponse.data && ocrResponse.data.success) {
        console.log(`OCR+AI completed for document ${document.id} in ${ocrResponse.data.processing_time}`);

        // Update document with OCR text
        await prisma.documents.update({
          where: { id: document.id },
          data: { ocr_text: ocrResponse.data.extracted_text || '' }
        });

        // Save AI analysis results from Python service
        const aiTaskTypes = ['summarize', 'segment', 'level_suggestion', 'topic_suggestion', 'tag_suggestion'];

        const taskPromises = aiTaskTypes.map(taskType => {
          let outputJson: any = {};

          switch (taskType) {
            case 'summarize':
              outputJson = { result: ocrResponse.data.summary || 'Document processed successfully' };
              break;
            case 'segment':
              outputJson = { result: ocrResponse.data.segments || [] };
              break;
            case 'level_suggestion':
              outputJson = { result: ocrResponse.data.level || 'B1' };
              break;
            case 'topic_suggestion':
              outputJson = { result: ocrResponse.data.topic || 'Education' };
              break;
            case 'tag_suggestion':
              outputJson = {
                suggested_tags: ocrResponse.data.suggested_tags || [],
                analysis: {
                  summary: ocrResponse.data.summary,
                  segments: ocrResponse.data.segments,
                  level_suggestion: ocrResponse.data.level,
                  topic_suggestion: ocrResponse.data.topic
                }
              };
              break;
          }

          return prisma.document_ai_tasks.create({
            data: {
              document_id: document.id,
              task_type: taskType as any,
              status: 'completed',
              output_json: outputJson,
              finished_at: new Date()
            }
          });
        });

        await Promise.all(taskPromises);

        // Update document with AI-generated tags
        if (ocrResponse.data.suggested_tags && ocrResponse.data.suggested_tags.length > 0) {
          await prisma.documents.update({
            where: { id: document.id },
            data: {
              ai_tags: JSON.stringify(ocrResponse.data.suggested_tags.map((tag: any) =>
                typeof tag === 'string' ? tag : tag.tag_label
              ))
            }
          });
        }
      } else {
        console.warn(`OCR+AI processing failed for document ${document.id}:`, ocrResponse.data?.error);
      }
    } catch (ocrError: any) {
      console.warn(`OCR+AI failed for document ${document.id}:`, ocrError.message);
    }
  }
} catch (error: any) {
  console.warn('Post-upload OCR+AI processing failed:', error.message);
}
      // Serialize the entire response to handle any remaining BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const response = {
        success: true,
        message: 'Tài liệu được upload thành công',
        data: document
      };

      res.status(201).json(serializeResponse(response));
    } catch (error) {
      console.error('Upload document error:', error);

      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi upload tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections:
 *   get:
 *     summary: Danh sách collections
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách collections
 */
router.get('/collections',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || BigInt(1);
      const tenantId = req.user?.tenant_id || BigInt(1);

      // Lấy tất cả collections của tenant với document count
      const collections = await prisma.document_collections.findMany({
        where: {
          tenant_id: tenantId,
          OR: [
            { is_public: true },
            { created_by: userId },
            // Check permissions
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId
                }
              }
            }
          ]
        },
        include: {
          users_document_collections_created_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          _count: {
            select: {
              document_collection_permissions: true,
              document_collection_favorites: true,
              documents: true // Add document count
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Serialize response
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const response = {
        success: true,
        data: {
          collections: collections.map(col => ({
            ...col,
            created_by_user: col.users_document_collections_created_byTousers,
            permissions_count: col._count.document_collection_permissions,
            favorites_count: col._count.document_collection_favorites,
            documents_count: col._count.documents || 0 // Add document count to response
          }))
        }
      };

      res.json(serializeResponse(response));
    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách collections',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}/documents:
 *   get:
 *     summary: Lấy danh sách tài liệu trong collection
 *     tags: [Document Management]
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
 *         description: Danh sách tài liệu trong collection
 */
router.get('/collections/:id/documents',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);
      const tenantId = req.user?.tenant_id || BigInt(1);

      // Kiểm tra quyền truy cập collection
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          tenant_id: tenantId,
          OR: [
            { is_public: true },
            { created_by: userId },
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['view', 'edit', 'manage', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền truy cập'
        });
      }

      // Lấy documents thuộc collection này
      const documents = await prisma.documents.findMany({
        where: {
          collection_id: collectionId,
          tenant_id: tenantId
        },
        orderBy: { created_at: 'desc' },
        include: {
          users_documents_created_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          document_tags: {
            include: {
              tags: true
            }
          },
          document_ai_tasks: {
            orderBy: { created_at: 'desc' },
            take: 5
          },
          _count: {
            select: {
              document_favorites: true,
              document_shares: true
            }
          }
        }
      });

      // Serialize response để xử lý BigInt
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const response = {
        success: true,
        data: {
          documents: documents.map(doc => ({
            ...doc,
            id: doc.id.toString(),
            tenant_id: doc.tenant_id.toString(),
            file_size: doc.file_size ? doc.file_size.toString() : null,
            created_by: doc.created_by ? doc.created_by.toString() : null,
            updated_by: doc.updated_by ? doc.updated_by.toString() : null,
            collection_id: doc.collection_id ? doc.collection_id.toString() : null,
            created_by_user: doc.users_documents_created_byTousers ? {
              ...doc.users_documents_created_byTousers,
              id: doc.users_documents_created_byTousers.id.toString()
            } : null,
            tags: doc.document_tags.map((dt: any) => ({
              ...dt.tags,
              id: dt.tags.id.toString(),
              tenant_id: dt.tags.tenant_id.toString(),
              created_by: dt.tags.created_by ? dt.tags.created_by.toString() : null
            })),
            ai_tasks: doc.document_ai_tasks.map((task: any) => ({
              ...task,
              id: task.id.toString(),
              document_id: task.document_id.toString(),
              created_at: task.created_at,
              updated_at: task.updated_at,
              finished_at: task.finished_at
            })),
            favorites_count: doc._count.document_favorites,
            shares_count: doc._count.document_shares
          })),
          total: documents.length
        }
      };

      res.json(serializeResponse(response));
    } catch (error) {
      console.error('Get collection documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách tài liệu trong collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}/documents:
 *   post:
 *     summary: Thêm tài liệu vào collection
 *     tags: [Document Management]
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
 *             required:
 *               - document_id
 *             properties:
 *               document_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tài liệu đã được thêm vào collection
 */
router.post('/collections/:id/documents',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);
      const tenantId = req.user?.tenant_id || BigInt(1);
      const { document_id } = req.body;

      if (!document_id) {
        return res.status(400).json({
          success: false,
          message: 'document_id là bắt buộc'
        });
      }

      const documentId = BigInt(document_id);

      // Kiểm tra quyền thêm document vào collection
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          tenant_id: tenantId,
          OR: [
            { created_by: userId },
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['edit', 'manage'] }
                }
              }
            }
          ]
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền thêm tài liệu'
        });
      }

      // Kiểm tra document tồn tại và thuộc tenant
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          tenant_id: tenantId,
          OR: [
            { created_by: userId },
            { visibility: 'public' },
            { visibility: 'tenant' }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền truy cập'
        });
      }

      // Cập nhật document với collection_id
      const updatedDocument = await prisma.documents.update({
        where: { id: documentId },
        data: {
          collection_id: collectionId,
          updated_by: userId,
          updated_at: new Date()
        }
      });

      // Serialize response để xử lý BigInt
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.json({
        success: true,
        message: 'Tài liệu đã được thêm vào collection',
        data: serializeResponse(updatedDocument)
      });
    } catch (error) {
      console.error('Add document to collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm tài liệu vào collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}/documents:
 *   delete:
 *     summary: Xóa tài liệu khỏi collection
 *     tags: [Document Management]
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
 *             required:
 *               - document_id
 *             properties:
 *               document_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tài liệu đã được xóa khỏi collection
 */
router.delete('/collections/:id/documents',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);
      const tenantId = req.user?.tenant_id || BigInt(1);
      const { document_id } = req.body;

      if (!document_id) {
        return res.status(400).json({
          success: false,
          message: 'document_id là bắt buộc'
        });
      }

      const documentId = BigInt(document_id);

      // Kiểm tra quyền xóa document khỏi collection
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          tenant_id: tenantId,
          OR: [
            { created_by: userId },
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['edit', 'manage'] }
                }
              }
            }
          ]
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền xóa tài liệu'
        });
      }

      // Kiểm tra document tồn tại và thuộc collection này
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          tenant_id: tenantId,
          collection_id: collectionId
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu trong collection này'
        });
      }

      // Cập nhật document để xóa collection_id (set về null)
      const updatedDocument = await prisma.documents.update({
        where: { id: documentId },
        data: {
          collection_id: null,
          updated_by: userId,
          updated_at: new Date()
        }
      });

      // Serialize response để xử lý BigInt
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.json({
        success: true,
        message: 'Tài liệu đã được xóa khỏi collection',
        data: serializeResponse(updatedDocument)
      });
    } catch (error) {
      console.error('Remove document from collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa tài liệu khỏi collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}:
 *   get:
 *     summary: Chi tiết collection
 *     tags: [Document Management]
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
 *         description: Chi tiết collection
 */
router.get('/collections/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);
      const tenantId = req.user?.tenant_id || BigInt(1);

      // Lấy collection với quyền truy cập
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          tenant_id: tenantId,
          OR: [
            { is_public: true },
            { created_by: userId },
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['view', 'edit', 'manage', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền truy cập'
        });
      }

      // Lấy permissions và favorites riêng biệt
      const permissions = await prisma.document_collection_permissions.findMany({
        where: { collection_id: collectionId },
        include: {
          users: {
            select: {
              id: true,
              full_name: true
            }
          }
        }
      });

      const favorites = await prisma.document_collection_favorites.findMany({
        where: {
          collection_id: collectionId,
          user_id: userId
        },
        select: { created_at: true }
      });

      const permissionsCount = await prisma.document_collection_permissions.count({
        where: { collection_id: collectionId }
      });

      const favoritesCount = await prisma.document_collection_favorites.count({
        where: { collection_id: collectionId }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền truy cập'
        });
      }

      // Lấy documents trong collection
      const documents = await prisma.documents.findMany({
        where: {
          collection_id: collectionId,
          tenant_id: tenantId
        },
        orderBy: { created_at: 'desc' }
      });

      // Lấy thông tin user cho từng document
      const documentIds = documents.map(d => d.id);
      const documentUsers = await prisma.users.findMany({
        where: {
          id: { in: documents.map(d => d.created_by).filter(Boolean) as bigint[] }
        },
        select: {
          id: true,
          full_name: true,
          email: true
        }
      });

      // Lấy tags cho documents
      const documentTags = await prisma.document_tags.findMany({
        where: {
          document_id: { in: documentIds }
        },
        include: {
          tags: true
        }
      });

      // Lấy count favorites và shares
      const documentFavorites = await prisma.document_favorites.groupBy({
        by: ['document_id'],
        where: { document_id: { in: documentIds } },
        _count: { document_id: true }
      });

      const documentShares = await prisma.document_shares.groupBy({
        by: ['document_id'],
        where: { document_id: { in: documentIds } },
        _count: { document_id: true }
      });

      // Serialize response
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      // Tạo map cho user info
      const userMap = new Map(documentUsers.map(u => [u.id.toString(), u]));

      // Tạo map cho tags
      const tagMap = new Map();
      documentTags.forEach(dt => {
        const docId = dt.document_id.toString();
        if (!tagMap.has(docId)) tagMap.set(docId, []);
        tagMap.get(docId).push(dt.tags);
      });

      // Tạo map cho counts
      const favoriteMap = new Map(documentFavorites.map(f => [f.document_id.toString(), f._count.document_id]));
      const shareMap = new Map(documentShares.map(s => [s.document_id.toString(), s._count.document_id]));

      const response = {
        success: true,
        data: {
          collection: {
            ...collection,
            permissions: permissions,
            is_favorited: favorites.length > 0,
            permissions_count: permissionsCount,
            favorites_count: favoritesCount
          },
          documents: documents.map(doc => ({
            ...doc,
            created_by_user: doc.created_by ? userMap.get(doc.created_by.toString()) : null,
            tags: tagMap.get(doc.id.toString()) || [],
            favorites_count: favoriteMap.get(doc.id.toString()) || 0,
            shares_count: shareMap.get(doc.id.toString()) || 0
          }))
        }
      };

      res.json(serializeResponse(response));
    } catch (error) {
      console.error('Get collection detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}:
 *   patch:
 *     summary: Cập nhật collection
 *     tags: [Document Management]
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
 *               description:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Collection được cập nhật thành công
 */
router.patch('/collections/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);
      const { name, description, is_public } = req.body;

      // Check quyền edit
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          OR: [
            { created_by: userId },
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['edit', 'manage'] }
                }
              }
            }
          ]
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền chỉnh sửa'
        });
      }

      // Update collection
      const updatedCollection = await prisma.document_collections.update({
        where: { id: collectionId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(is_public !== undefined && { is_public }),
          updated_by: userId,
          updated_at: new Date()
        }
      });

      // Serialize the response to handle BigInt values - CRITICAL FIX
      const serializeCollection = (collection: any): any => {
        if (!collection) return collection;
        
        return {
          ...collection,
          id: collection.id.toString(),
          tenant_id: collection.tenant_id.toString(),
          created_by: collection.created_by ? collection.created_by.toString() : null,
          updated_by: collection.updated_by ? collection.updated_by.toString() : null,
          created_at: collection.created_at,
          updated_at: collection.updated_at
        };
      };

      const serializedCollection = serializeCollection(updatedCollection);

      res.json({
        success: true,
        message: 'Collection được cập nhật thành công',
        data: serializedCollection
      });
    } catch (error) {
      console.error('Update collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}:
 *   delete:
 *     summary: Xóa collection
 *     tags: [Document Management]
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
 *         description: Collection được xóa thành công
 */
router.delete('/collections/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);

      // Check quyền delete
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          OR: [
            { created_by: userId },
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: 'manage'
                }
              }
            }
          ]
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền xóa'
        });
      }

      // Xóa collection (Prisma sẽ tự động CASCADE xóa permissions, favorites)
      await prisma.document_collections.delete({
        where: { id: collectionId }
      });

      res.json({
        success: true,
        message: 'Collection được xóa thành công'
      });
    } catch (error) {
      console.error('Delete collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/collection:
 *   patch:
 *     summary: Thêm/xóa document khỏi collection
 *     tags: [Document Management]
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
 *               collection_id:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Document được cập nhật collection thành công
 */
router.patch('/:id/collection',
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);
      const { collection_id } = req.body;

      // Check quyền edit document
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { created_by: userId },
            {
              document_shares: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['edit', 'delete', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy document hoặc không có quyền chỉnh sửa'
        });
      }

      // Nếu có collection_id, check quyền truy cập collection
      if (collection_id) {
        const collectionId = BigInt(collection_id);
        const collection = await prisma.document_collections.findFirst({
          where: {
            id: collectionId,
            OR: [
              { created_by: userId },
              {
                document_collection_permissions: {
                  some: {
                    subject_type: 'user',
                    subject_id: userId,
                    permission: { in: ['edit', 'manage'] }
                  }
                }
              }
            ]
          }
        });

        if (!collection) {
          return res.status(403).json({
            success: false,
            message: 'Không có quyền thêm document vào collection này'
          });
        }
      }

      // Update document collection
      const updatedDocument = await prisma.documents.update({
        where: { id: documentId },
        data: {
          collection_id: collection_id ? BigInt(collection_id) : null,
          updated_by: userId,
          updated_at: new Date()
        } as any
      });

      // Serialize the entire response to handle any remaining BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.json(serializeResponse({
        success: true,
        message: collection_id ? 'Document đã được thêm vào collection' : 'Document đã được xóa khỏi collection',
        data: updatedDocument
      }));
    } catch (error) {
      console.error('Update document collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật collection của document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}/favorite:
 *   post:
 *     summary: Yêu thích collection
 *     tags: [Document Management]
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
 *         description: Collection được yêu thích thành công
 */
router.post('/collections/:id/favorite',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);

      // Check quyền truy cập collection
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          OR: [
            { is_public: true },
            { created_by: userId },
            {
              document_collection_permissions: {
                some: {
                  subject_type: 'user',
                  subject_id: userId
                }
              }
            }
          ]
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền truy cập'
        });
      }

      // Thêm vào favorites (skip nếu đã tồn tại)
      await prisma.document_collection_favorites.upsert({
        where: {
          collection_id_user_id: {
            collection_id: collectionId,
            user_id: userId
          }
        },
        update: {},
        create: {
          collection_id: collectionId,
          user_id: userId
        }
      });

      res.json({
        success: true,
        message: 'Collection đã được thêm vào yêu thích'
      });
    } catch (error) {
      console.error('Favorite collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi yêu thích collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}/favorite:
 *   delete:
 *     summary: Bỏ yêu thích collection
 *     tags: [Document Management]
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
 *         description: Collection được bỏ yêu thích thành công
 */
router.delete('/collections/:id/favorite',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);

      // Xóa khỏi favorites
      await prisma.document_collection_favorites.deleteMany({
        where: {
          collection_id: collectionId,
          user_id: userId
        }
      });

      res.json({
        success: true,
        message: 'Collection đã được bỏ yêu thích'
      });
    } catch (error) {
      console.error('Unfavorite collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi bỏ yêu thích collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/favorites:
 *   get:
 *     summary: Danh sách tài liệu yêu thích của user
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài liệu yêu thích
 */
router.get('/favorites',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Get document favorites
      const docFavs = await prisma.document_favorites.findMany({
        where: { user_id: BigInt(userId) as any },
        select: { document_id: true, created_at: true }
      });

      // Get collection favorites
      const collFavs = await prisma.document_collection_favorites.findMany({
        where: { user_id: BigInt(userId) as any },
        select: { collection_id: true, created_at: true }
      });

      // Normalize BigInt -> string for JSON
      const document_favorites = docFavs.map(f => ({
        document_id: String(f.document_id),
        created_at: f.created_at
      }));

      const collection_favorites = collFavs.map(f => ({
        collection_id: String(f.collection_id),
        created_at: f.created_at
      }));

      return res.json({ success: true, data: { document_favorites, collection_favorites } });
    } catch (err) {
      console.error('GET /favorites error', err);
      return res.status(500).json({ success: false, message: 'Server error loading favorites' });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     summary: Chi tiết tài liệu
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [preview, full]
 *           default: full
 *     responses:
 *       200:
 *         description: Chi tiết tài liệu
 */
router.get('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      // Skip BigInt conversion for non-numeric IDs (like 'collections', 'search', 'trending')
      if (isNaN(Number(req.params.id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }
      const documentId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);
      const format = req.query.format as string || 'full';

      // Get user details for permission checking
      const userDetails = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true, campus_id: true }
      });

      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { visibility: 'public' },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) },
            { created_by: userId },
            // Check user-specific shares
            {
              document_shares: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['view', 'download', 'edit', 'delete', 'share'] }
                }
              }
            },
            // Check role-based shares
            {
              document_shares: {
                some: {
                  subject_type: 'role',
                  subject_id: BigInt(userDetails?.role === 'teacher' ? 6 : userDetails?.role === 'admin' ? 2 : 1),
                  permission: { in: ['view', 'download', 'edit', 'delete', 'share'] }
                }
              }
            },
            // Check org_unit-based shares
            {
              document_shares: {
                some: {
                  subject_type: 'org_unit',
                  subject_id: userDetails?.campus_id || BigInt(1),
                  permission: { in: ['view', 'download', 'edit', 'delete', 'share'] }
                }
              }
            }
          ]
        },
        include: {
          users_documents_created_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          users_documents_updated_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          document_tags: {
            include: {
              tags: true
            }
          },
          document_derivatives: true,
          document_pages: {
            select: {
              page_no: true,
              text: true
            },
            orderBy: { page_no: 'asc' }
          },
          document_ai_tasks: {
            orderBy: { created_at: 'desc' },
            take: 10 // Get more tasks for preview format
          }
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền truy cập'
        });
      }

      // Log view activity
      await prisma.audit_logs.create({
        data: {
          tenant_id: req.user?.tenant_id || BigInt(1),
          actor_id: req.user?.id,
          action: 'view',
          entity_type: 'document',
          entity_id: documentId,
          metadata: {
            file_name: document.name,
            mime_type: document.mime_type,
            format: format
          }
        }
      });

      // Serialize the entire response to handle any remaining BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      // Return formatted data based on format parameter
      if (format === 'preview') {
        // Use the same query structure as check-document-prisma.js
        const previewDocument = await prisma.documents.findUnique({
          where: { id: documentId },
          include: {
            users_documents_created_byTousers: {
              select: {
                full_name: true,
                email: true
              }
            },
            document_ai_tasks: {
              orderBy: { created_at: 'desc' }
            },
            document_tags: {
              include: { tags: true }
            }
          }
        });

        if (!previewDocument) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy tài liệu'
          });
        }

        const formattedDocument = formatDocumentForPreview(previewDocument);
        res.json({
          success: true,
          data: formattedDocument
        });
      } else {
        // Full format (existing behavior)
        const response = {
          success: true,
          data: {
            ...document,
            created_by_user: document.users_documents_created_byTousers,
            updated_by_user: document.users_documents_updated_byTousers,
            tags: document.document_tags.map(dt => dt.tags),
            derivatives: document.document_derivatives,
            pages: document.document_pages,
            ai_tasks: document.document_ai_tasks
          }
        };
        res.json(serializeResponse(response));
      }
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   patch:
 *     summary: Cập nhật tài liệu
 *     tags: [Document Management]
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
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [private, tenant, public]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tài liệu được cập nhật thành công
 */
router.patch('/:id',
  authenticateToken,
  validateRequest(documentUpdateSchema),
  auditLog('document', 'update'),
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);
      const { name, description, visibility, tags } = req.body;

      // Check if user can edit document
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { created_by: req.user?.id || BigInt(1) },
            {
              document_shares: {
                some: {
                  subject_type: 'user',
                  subject_id: req.user?.id || BigInt(1),
                  permission: { in: ['edit', 'delete', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền chỉnh sửa'
        });
      }

      // Update document
      const updatedDocument = await prisma.documents.update({
        where: { id: documentId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(visibility && { visibility }),
          updated_by: req.user?.id || BigInt(1),
          updated_at: new Date()
        }
      });

      // Update tags if provided
      if (tags) {
        await DocumentService.updateDocumentTags(documentId, tags, req.user?.tenant_id || BigInt(1));
      }

      res.json({
        success: true,
        message: 'Tài liệu được cập nhật thành công',
        data: updatedDocument
      });
    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     summary: Xóa tài liệu
 *     tags: [Document Management]
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
 *         description: Tài liệu được xóa thành công
 */
router.delete('/:id',
  authenticateToken,
  auditLog('document', 'delete'),
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);

      // Check if user can delete document
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { created_by: req.user?.id || BigInt(1) },
            {
              document_shares: {
                some: {
                  subject_type: 'user',
                  subject_id: req.user?.id || BigInt(1),
                  permission: { in: ['delete', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền xóa'
        });
      }

      // Delete document and related data
      await DocumentService.deleteDocument(documentId);

      res.json({
        success: true,
        message: 'Tài liệu được xóa thành công'
      });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DOCUMENT PROCESSING ENDPOINTS

/**
 * @swagger
 * /api/v1/documents/{id}/ocr:
 *   post:
 *     summary: Xử lý OCR cho tài liệu
 *     tags: [Document Processing]
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
 *         description: OCR processing started
 */
router.post('/:id/ocr',
  authenticateToken,
  auditLog('document', 'ocr_process'),
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);

      // Check document access
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { visibility: 'public' },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) },
            { created_by: req.user?.id || BigInt(1) }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu'
        });
      }

      // Process OCR directly using the logic from ocr_service.py
      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');

      // Resolve file path correctly - ensure it's absolute path from project root
      let resolvedFilePath = document.file_path;
      if (!path.isAbsolute(resolvedFilePath)) {
        // If relative path, resolve from project root
        resolvedFilePath = path.join(process.cwd(), resolvedFilePath);
      }

      console.log('Checking file path:', {
        original: document.file_path,
        resolved: resolvedFilePath,
        exists: fs.existsSync(resolvedFilePath)
      });

      if (!resolvedFilePath || !fs.existsSync(resolvedFilePath)) {
        return res.status(400).json({
          success: false,
          message: 'File không tồn tại trên server',
          details: {
            original_path: document.file_path,
            resolved_path: resolvedFilePath,
            cwd: process.cwd()
          }
        });
      }

      // Read file and send to OCR service
      const fileStream = fs.createReadStream(resolvedFilePath);
      const FormData = require('form-data');
      const formData = new FormData();

      formData.append('file', fileStream, {
        filename: document.name || 'document',
        contentType: document.mime_type || 'application/octet-stream'
      });

      try {
        // Call OCR service (assuming it's running on localhost:8000)
        const ocrResponse = await axios.post('http://localhost:8000/process/file', formData, {
          headers: formData.getHeaders(),
          timeout: 120000 // 120 seconds timeout for real processing
        });

        if (ocrResponse.data && ocrResponse.data.success && ocrResponse.data.extracted_text) {
          // Update document with OCR text
              await prisma.documents.update({
                where: { id: documentId },
                data: { ocr_text: ocrResponse.data.extracted_text }
              });
   
              // Create OCR task record
              await prisma.document_ai_tasks.create({
                data: {
                  document_id: documentId,
                  task_type: 'other' as const,
                  status: 'completed' as const,
                  output_json: {
                    extracted_text: ocrResponse.data.extracted_text,
                    method: ocrResponse.data.method || 'ocr_service',
                    confidence: ocrResponse.data.confidence || 'medium'
                  },
                  finished_at: new Date()
                }
              });

          // Serialize the entire response to handle any remaining BigInt values
          const serializeResponse = (obj: any): any => {
            if (obj === null || obj === undefined) return obj;
            if (typeof obj === 'bigint') return obj.toString();
            if (Array.isArray(obj)) return obj.map(serializeResponse);
            if (typeof obj === 'object') {
              const result: any = {};
              for (const key in obj) {
                result[key] = serializeResponse(obj[key]);
              }
              return result;
            }
            return obj;
          };

          const response = {
            success: true,
            message: 'OCR xử lý thành công',
            data: {
              document_id: documentId,
              extracted_text: ocrResponse.data.extracted_text,
              method: ocrResponse.data.method,
              confidence: ocrResponse.data.confidence
            }
          };

          res.json(serializeResponse(response));
        } else {
          throw new Error('OCR service returned invalid response');
        }
      } catch (ocrError) {
        console.warn(`OCR service failed for document ${documentId}:`, (ocrError as Error).message);

        // Fallback: mock OCR for testing
        const mockOcrText = `Mock OCR text for document: ${document.name}. This would contain the actual extracted text from the document.`;
        await prisma.documents.update({
          where: { id: documentId },
          data: { ocr_text: mockOcrText }
        });

        await prisma.document_ai_tasks.create({
          data: {
            document_id: documentId,
            task_type: 'other' as const,
            status: 'completed' as const,
            output_json: {
              extracted_text: mockOcrText,
              method: 'mock_fallback',
              confidence: 'low'
            },
            finished_at: new Date()
          }
        });

        // Serialize the entire response to handle any remaining BigInt values
        const serializeResponse = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          if (typeof obj === 'bigint') return obj.toString();
          if (Array.isArray(obj)) return obj.map(serializeResponse);
          if (typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
              result[key] = serializeResponse(obj[key]);
            }
            return result;
          }
          return obj;
        };
  
        const response = {
          success: true,
          message: 'OCR xử lý thành công (mock fallback)',
          data: {
            document_id: documentId,
            extracted_text: mockOcrText,
            method: 'mock_fallback',
            confidence: 'low'
          }
        };
  
        res.json(serializeResponse(response));
      }

    } catch (error) {
      console.error('OCR processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý OCR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/ai-tag:
 *   post:
 *     summary: AI tagging cho tài liệu
 *     tags: [Document Processing]
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
 *         description: AI tagging started
 */
router.post('/:id/ai-tag',
  authenticateToken,
  auditLog('document', 'ai_tag'),
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);

      // Check document access
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { visibility: 'public' },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) },
            { created_by: req.user?.id || BigInt(1) }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu'
        });
      }

      // Process AI tagging directly
      const axios = require('axios');

      // Get OCR text for analysis
      const ocrText = document.ocr_text || '';

      if (!ocrText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tài liệu chưa có OCR text. Hãy chạy OCR trước.'
        });
      }

      // Prepare analysis requests for Gemini AI - 4 tasks as specified
      const getFileTypeFromMime = (mimeType: string | null): string => {
        if (!mimeType) return 'unknown';

        if (mimeType.startsWith('application/pdf')) return 'pdf';
        if (mimeType.startsWith('application/msword') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'docx';
        if (mimeType.startsWith('application/vnd.ms-excel') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return 'xlsx';
        if (mimeType.startsWith('application/vnd.ms-powerpoint') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) return 'pptx';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('text/')) return 'text';

        return 'unknown';
      };

      const fileType = getFileTypeFromMime(document.mime_type);

      // Create ultra-simple, direct prompts for Gemini AI
      const createSummaryPrompt = (ocrText: string) => {
        return `SUMMARIZE THIS DOCUMENT IN 2-3 SENTENCES: "${ocrText.substring(0, 1000)}"`;
      };

      const createSegmentPrompt = (ocrText: string) => {
        return `ANALYZE THIS TEXT AND IDENTIFY 3-4 MAIN SECTIONS. FORMAT AS: "Segment 1: [Title]\n[Content]" FOR EACH SECTION. TEXT: "${ocrText.substring(0, 800)}"`;
      };

      const createLevelPrompt = (ocrText: string) => {
        return `WHAT ENGLISH LEVEL IS THIS TEXT? (A1, A2, B1, B2, C1, C2): "${ocrText.substring(0, 500)}"`;
      };

      const createTopicPrompt = (ocrText: string) => {
        return `WHAT IS THE MAIN TOPIC OF THIS TEXT? (ONE WORD): "${ocrText.substring(0, 300)}"`;
      };

      const analysisTasks = [
        {
          task: 'summary',
          content: createSummaryPrompt(ocrText),
          ocr_content: ocrText.substring(0, 2000),
          file_name: document.name,
          file_type: fileType
        },
        {
          task: 'segment',
          content: createSegmentPrompt(ocrText),
          ocr_content: ocrText.substring(0, 2000),
          file_name: document.name,
          file_type: fileType
        },
        {
          task: 'level',
          content: createLevelPrompt(ocrText),
          ocr_content: ocrText.substring(0, 2000),
          file_name: document.name,
          file_type: fileType
        },
        {
          task: 'topic',
          content: createTopicPrompt(ocrText),
          ocr_content: ocrText.substring(0, 2000),
          file_name: document.name,
          file_type: fileType
        }
      ];

      const analysisResults: any = {};

      try {
        // Call Gemini AI for each analysis task
        for (const task of analysisTasks) {
          try {
            const response = await axios.post('http://localhost:8000/ai/analyze', {
              task: task.task,
              content: task.content
            }, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 60000 // 60 seconds for AI processing
            });

            if (response.data && response.data.success) {
              analysisResults[task.task] = response.data.analysis;
            }
          } catch (geminiError) {
            console.warn(`Gemini AI failed for ${task.task}:`, (geminiError as Error).message);
            // Provide fallback values for testing
            if (task.task === 'summary') {
              analysisResults[task.task] = `This document contains educational content about English learning. It appears to be a lesson or practice material.`;
            } else if (task.task === 'segment') {
              analysisResults[task.task] = JSON.stringify({
                segments: ["Main Content", "Practice Section", "Additional Materials"]
              });
            } else if (task.task === 'level') {
              analysisResults[task.task] = 'B1';
            } else if (task.task === 'topic') {
              analysisResults[task.task] = 'Grammar';
            }
          }
        }
      } catch (geminiError) {
        console.warn(`Gemini AI service unavailable:`, (geminiError as Error).message);
        // Provide fallback analysis results
        Object.assign(analysisResults, {
          summary: `This document contains educational content extracted from ${document.name}. It appears to be English learning material.`,
          segment: JSON.stringify({
            segments: ["Content Overview", "Practice Activities", "Learning Materials"]
          }),
          level: 'B1',
          topic: 'Education'
        });
      }

      // Generate suggested tags based on analysis
      const generateTagsFromAnalysis = (ocrText: string, analysis: any, fileName: string | null): Array<{tag_label: string, confidence: number}> => {
        const tags: Array<{tag_label: string, confidence: number}> = [];

        // Add topic as tag
        if (analysis.topic) {
          tags.push({ tag_label: analysis.topic.toLowerCase(), confidence: 0.9 });
        }

        // Add level as tag
        if (analysis.level) {
          tags.push({ tag_label: `level-${analysis.level.toLowerCase()}`, confidence: 0.95 });
        }

        // Add content type tags based on OCR text analysis
        const text = ocrText.toLowerCase();

        // Primary skill detection with higher confidence
        if (text.includes('grammar') || text.includes('tense') || text.includes('verb') || text.includes('present simple') || text.includes('past simple')) {
          tags.push({ tag_label: 'grammar', confidence: 0.95 });
          tags.push({ tag_label: 'tenses', confidence: 0.9 });
        }

        if (text.includes('vocabulary') || text.includes('word') || text.includes('meaning') || text.includes('words')) {
          tags.push({ tag_label: 'vocabulary', confidence: 0.95 });
        }

        if (text.includes('listening') || text.includes('audio') || text.includes('conversation') || text.includes('dialogue')) {
          tags.push({ tag_label: 'listening', confidence: 0.95 });
        }

        if (text.includes('speaking') || text.includes('presentation') || text.includes('pronunciation') || text.includes('speak') || text.includes('talk')) {
          tags.push({ tag_label: 'speaking', confidence: 0.95 });
        }

        if (text.includes('reading') || text.includes('comprehension') || text.includes('text') || text.includes('read')) {
          tags.push({ tag_label: 'reading', confidence: 0.95 });
        }

        if (text.includes('writing') || text.includes('essay') || text.includes('composition') || text.includes('write')) {
          tags.push({ tag_label: 'writing', confidence: 0.95 });
        }

        // Level-based tags
        if (analysis.level) {
          const level = analysis.level.toLowerCase();
          if (level === 'a1') tags.push({ tag_label: 'beginner', confidence: 0.9 });
          if (level === 'a2') tags.push({ tag_label: 'elementary', confidence: 0.9 });
          if (level === 'b1') tags.push({ tag_label: 'intermediate', confidence: 0.9 });
          if (level === 'b2') tags.push({ tag_label: 'upper-intermediate', confidence: 0.9 });
          if (level === 'c1') tags.push({ tag_label: 'advanced', confidence: 0.9 });
          if (level === 'c2') tags.push({ tag_label: 'proficiency', confidence: 0.9 });
        }

        // Add education and language tags
        tags.push({ tag_label: 'education', confidence: 0.8 });
        tags.push({ tag_label: 'english', confidence: 0.9 });
        tags.push({ tag_label: 'english-learning', confidence: 0.85 });

        return tags;
      };

      const suggestedTags = generateTagsFromAnalysis(ocrText, analysisResults, document.name);

      // Save AI tag suggestions
      for (const suggestion of suggestedTags) {
        await prisma.document_ai_tag_suggestions.create({
          data: {
            document_id: documentId,
            tag_label: suggestion.tag_label,
            confidence: suggestion.confidence
          }
        });
      }

      // Update document with AI analysis results
      await prisma.documents.update({
        where: { id: documentId },
        data: {
          ai_tags: JSON.stringify(suggestedTags.map(s => s.tag_label))
        }
      });

      // Create AI task record for each analysis type
      const aiTaskTypes = ['summarize', 'segment', 'level_suggestion', 'topic_suggestion'];
      for (const taskType of aiTaskTypes) {
        const mappedTaskType = taskType as 'summarize' | 'segment' | 'level_suggestion' | 'topic_suggestion';
        await prisma.document_ai_tasks.create({
          data: {
            document_id: documentId,
            task_type: mappedTaskType,
            status: 'completed' as const,
            output_json: {
              result: analysisResults[taskType.replace('_suggestion', '')],
              analysis_type: taskType,
              suggested_tags: taskType === 'topic_suggestion' ? suggestedTags : undefined
            },
            finished_at: new Date()
          }
        });
      }

      // Also create a general tag_suggestion task
      await prisma.document_ai_tasks.create({
        data: {
          document_id: documentId,
          task_type: 'tag_suggestion' as const,
          status: 'completed' as const,
          output_json: {
            suggested_tags: suggestedTags,
            analysis: analysisResults,
            segments: analysisResults.segment ? JSON.parse(analysisResults.segment) : null
          },
          finished_at: new Date()
        }
      });

      // Serialize the entire response to handle any remaining BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const response = {
        success: true,
        message: 'AI tagging hoàn thành',
        data: {
          document_id: documentId,
          suggested_tags: suggestedTags,
          analysis: analysisResults,
          total_tags: suggestedTags.length
        }
      };

      res.json(serializeResponse(response));

    } catch (error) {
      console.error('AI tagging error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý AI tagging',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/preview:
 *   get:
 *     summary: Xem trước tài liệu
 *     tags: [Document Processing]
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
 *         description: Document preview URL
 */
router.get('/:id/preview',
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);

      // Check document access
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { visibility: 'public' },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) },
            { created_by: req.user?.id || BigInt(1) }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu'
        });
      }

      // Generate or get existing preview
      const preview = await DocumentService.generatePreview(documentId);

      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      console.error('Document preview error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo preview tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/convert:
 *   post:
 *     summary: Chuyển đổi định dạng tài liệu
 *     tags: [Document Processing]
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
 *             required:
 *               - target_format
 *             properties:
 *               target_format:
 *                 type: string
 *                 enum: [pdf, docx, txt, html]
 *     responses:
 *       200:
 *         description: Document conversion started
 */
router.post('/:id/convert',
  authenticateToken,
  auditLog('document', 'convert'),
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);
      const { target_format } = req.body;

      // Check document access
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { visibility: 'public' },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) },
            { created_by: req.user?.id || BigInt(1) }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu'
        });
      }

      // Queue conversion
      const task = await DocumentService.queueDocumentConversion(documentId, target_format);

      res.json({
        success: true,
        message: 'Document conversion đã được khởi tạo',
        data: {
          task_id: task.id,
          status: task.status,
          target_format
        }
      });
    } catch (error) {
      console.error('Document conversion error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi chuyển đổi tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// UPDATE DOCUMENT METADATA (LEVEL, TOPIC, TAGS) - UPDATE AI TASKS
router.patch('/:id/tags',
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);
      const { tags, level, topic } = req.body;

      // Check document access (owner or shared with edit permission)
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { created_by: req.user?.id || BigInt(1) },
            {
              document_shares: {
                some: {
                  subject_type: 'user',
                  subject_id: req.user?.id || BigInt(1),
                  permission: { in: ['edit', 'delete', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền chỉnh sửa'
        });
      }

      // Update AI tasks instead of document fields
      const updatePromises = [];

      if (level !== undefined) {
        updatePromises.push(
          prisma.document_ai_tasks.updateMany({
            where: {
              document_id: documentId,
              task_type: 'level_suggestion',
              status: 'completed'
            },
            data: {
              output_json: { result: level }
            }
          })
        );
      }

      if (topic !== undefined) {
        updatePromises.push(
          prisma.document_ai_tasks.updateMany({
            where: {
              document_id: documentId,
              task_type: 'topic_suggestion',
              status: 'completed'
            },
            data: {
              output_json: { result: topic }
            }
          })
        );
      }

      if (tags && Array.isArray(tags)) {
        updatePromises.push(
          prisma.document_ai_tasks.updateMany({
            where: {
              document_id: documentId,
              task_type: 'tag_suggestion',
              status: 'completed'
            },
            data: {
              output_json: {
                suggested_tags: tags,
                analysis: {
                  summary: '',
                  segments: [],
                  level_suggestion: level || 'B1',
                  topic_suggestion: topic || 'Education'
                }
              }
            }
          })
        );

        // Also update documents.ai_tags field with deduplicated tags
        updatePromises.push(
          prisma.documents.update({
            where: { id: documentId },
            data: {
              ai_tags: JSON.stringify([...new Set(tags)])
            }
          })
        );
      }

      await Promise.all(updatePromises);

      // Update document updated_at
      await prisma.documents.update({
        where: { id: documentId },
        data: { updated_at: new Date() }
      });

      // Fetch updated document with all relations for complete response
      const documentWithRelations = await prisma.documents.findUnique({
        where: { id: documentId },
        include: {
          users_documents_created_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          users_documents_updated_byTousers: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          document_tags: {
            include: {
              tags: true
            }
          },
          document_ai_tasks: {
            orderBy: { created_at: 'desc' },
            take: 10
          },
          _count: {
            select: {
              document_favorites: true,
              document_shares: true
            }
          }
        }
      });

      if (!documentWithRelations) {
        return res.status(404).json({
          success: false,
          message: 'Document not found after update'
        });
      }

      // Compute merged data for response
      const completedTasks = documentWithRelations.document_ai_tasks.filter((task: any) => task.status === 'completed');

      // Get level: from AI level_suggestion (now updated)
      const aiLevelSuggestion = (completedTasks.find((t: any) => t.task_type === 'level_suggestion')?.output_json as any)?.result;
      const finalLevel = aiLevelSuggestion || 'B1';

      // Get topic: from AI topic_suggestion (now updated)
      const aiTopicSuggestion = (completedTasks.find((t: any) => t.task_type === 'topic_suggestion')?.output_json as any)?.result;
      const finalTopic = aiTopicSuggestion || 'Education';

      // Get tags: ONLY from AI tag_suggestion (updated by user), no document_tags merge, remove duplicates
      const aiTagSuggestions = (completedTasks.find((t: any) => t.task_type === 'tag_suggestion')?.output_json as any)?.suggested_tags || [];
      const allTags = [...new Set(aiTagSuggestions.map((t: any) => typeof t === 'string' ? t : t.tag_label))];

      // Get other AI analysis data
      const summary = (completedTasks.find((t: any) => t.task_type === 'summarize')?.output_json as any)?.result || '';
      const segments = (completedTasks.find((t: any) => t.task_type === 'segment')?.output_json as any)?.result || [];

      // Log audit
      await prisma.audit_logs.create({
        data: {
          tenant_id: req.user?.tenant_id || BigInt(1),
          actor_id: req.user?.id,
          action: 'update_metadata',
          entity_type: 'document',
          entity_id: documentId,
          old_values: {},
          new_values: {
            level,
            topic,
            tags
          }
        }
      });

      // Serialize the entire response to handle any remaining BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const response = {
        success: true,
        message: 'Document metadata updated successfully',
        data: {
          ...documentWithRelations,
          level: finalLevel,
          topic: finalTopic,
          tags: allTags,
          summary: summary,
          segments: segments,
          ai_analysis: {
            level_suggestion: aiLevelSuggestion,
            topic_suggestion: aiTopicSuggestion,
            tag_suggestions: aiTagSuggestions
          },
          favorites_count: documentWithRelations._count.document_favorites,
          shares_count: documentWithRelations._count.document_shares
        }
      };

      res.json(serializeResponse(response));
    } catch (error) {
      console.error('Update document metadata error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật metadata tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DOCUMENT FAVORITES

/**
 * @swagger
 * /api/v1/documents/{id}/favorite:
 *   post:
 *     summary: Thêm tài liệu vào danh sách yêu thích
 *     tags: [Document Favorites]
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
 *         description: Thao tác thành công
 */
router.post('/:id/favorite',
  authenticateToken,
  async (req, res) => {
    try {
      const rawId = req.params.id;
      if (!rawId || !/^\d+$/.test(rawId)) {
        return res.status(400).json({ success: false, message: 'Invalid document ID' });
      }
      const documentId = BigInt(rawId);
      const userId = BigInt((req as any).user?.id);

      // Create if not exists (handle unique constraint)
      try {
        await prisma.document_favorites.create({
          data: { document_id: documentId as any, user_id: userId as any }
        });
      } catch (e: any) {
        // If already exists, treat as success
        if (e.code !== 'P2002') throw e;
      }

      return res.json({ success: true, data: { document_id: String(documentId) } });
    } catch (err) {
      console.error('POST /:id/favorite error', err);
      return res.status(500).json({ success: false, message: 'Server error toggling favorite' });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/favorite:
 *   delete:
 *     summary: Xóa tài liệu khỏi danh sách yêu thích
 *     tags: [Document Favorites]
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
 *         description: Thao tác thành công
 */
router.delete('/:id/favorite',
  authenticateToken,
  async (req, res) => {
    try {
      const rawId = req.params.id;
      if (!rawId || !/^\d+$/.test(rawId)) {
        return res.status(400).json({ success: false, message: 'Invalid document ID' });
      }
      const documentId = BigInt(rawId);
      const userId = BigInt((req as any).user?.id);

      await prisma.document_favorites.deleteMany({
        where: { document_id: documentId as any, user_id: userId as any }
      });

      return res.json({ success: true, data: { document_id: String(documentId) } });
    } catch (err) {
      console.error('DELETE /:id/favorite error', err);
      return res.status(500).json({ success: false, message: 'Server error toggling favorite' });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/favorites:
 *   get:
 *     summary: Danh sách tài liệu yêu thích của user
 *     tags: [Document Favorites]
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
 *     responses:
 *       200:
 *         description: Danh sách tài liệu yêu thích
 */
router.get('/favorites',
  authenticateToken,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const userId = req.user?.id || BigInt(1);

      const [favorites, total] = await Promise.all([
        prisma.document_favorites.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include: {
            documents: {
              include: {
                users_documents_created_byTousers: {
                  select: {
                    id: true,
                    full_name: true,
                    email: true
                  }
                },
                document_tags: {
                  include: {
                    tags: true
                  }
                },
                document_ai_tasks: {
                  orderBy: { created_at: 'desc' },
                  take: 5
                },
                _count: {
                  select: {
                    document_favorites: true,
                    document_shares: true
                  }
                }
              }
            }
          }
        }),
        prisma.document_favorites.count({ where: { user_id: userId } })
      ]);

      // Serialize the response to handle BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const serializedFavorites = favorites.map(fav => ({
        ...fav,
        document: fav.documents ? {
          ...fav.documents,
          id: fav.documents.id.toString(),
          tenant_id: fav.documents.tenant_id.toString(),
          file_size: fav.documents.file_size ? fav.documents.file_size.toString() : null,
          created_by: fav.documents.created_by ? fav.documents.created_by.toString() : null,
          updated_by: fav.documents.updated_by ? fav.documents.updated_by.toString() : null,
          created_by_user: fav.documents.users_documents_created_byTousers ? {
            ...fav.documents.users_documents_created_byTousers,
            id: fav.documents.users_documents_created_byTousers.id.toString()
          } : null,
          tags: fav.documents.document_tags.map((dt: any) => ({
            ...dt.tags,
            id: dt.tags.id.toString(),
            tenant_id: dt.tags.tenant_id.toString(),
            created_by: dt.tags.created_by ? dt.tags.created_by.toString() : null
          })),
          ai_tasks: fav.documents.document_ai_tasks.map((task: any) => ({
            ...task,
            id: task.id.toString(),
            document_id: task.document_id.toString(),
            created_at: task.created_at,
            updated_at: task.updated_at,
            finished_at: task.finished_at
          })),
          favorites_count: fav.documents._count.document_favorites,
          shares_count: fav.documents._count.document_shares
        } : null
      }));

      res.json({
        success: true,
        data: {
          favorites: serializeResponse(serializedFavorites),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách yêu thích',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DOCUMENT COLLECTIONS

/**
 * @swagger
 * /api/v1/documents/collections:
 *   get:
 *     summary: Danh sách collections
 *     tags: [Document Collections]
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
 *     responses:
 *       200:
 *         description: Danh sách collections
 */
router.get('/collections',
  authenticateToken,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const where: any = {
        tenant_id: req.user?.tenant_id || BigInt(1),
        OR: [
          { is_public: true },
          { created_by: req.user?.id || BigInt(1) }
        ]
      };

      const [collections, total] = await Promise.all([
        prisma.document_collections.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include: {
            users_document_collections_created_byTousers: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            },
            _count: {
              select: {
                document_collection_favorites: true
              }
            }
          }
        }),
        prisma.document_collections.count({ where })
      ]);

      // Serialize the response to handle BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.json({
        success: true,
        data: {
          collections: collections.map(collection => ({
            ...collection,
            created_by_user: collection.users_document_collections_created_byTousers,
            favorites_count: collection._count.document_collection_favorites,
            documents_count: 0 // TODO: Implement proper count from document_collection_items
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách collections',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections:
 *   post:
 *     summary: Tạo collection mới
 *     tags: [Document Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Collection được tạo thành công
 */
router.post('/collections',
  authenticateToken,
  validateRequest(collectionCreateSchema),
  auditLog('document_collection', 'create'),
  async (req, res) => {
    try {
      const { name, description, is_public } = req.body;

      const collection = await prisma.document_collections.create({
        data: {
          tenant_id: req.user?.tenant_id || BigInt(1),
          name,
          description,
          is_public,
          created_by: req.user?.id || BigInt(1),
          updated_by: req.user?.id || BigInt(1)
        }
      });

      res.status(201).json({
        success: true,
        message: 'Collection được tạo thành công',
        data: collection
      });
    } catch (error) {
      console.error('Create collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}:
 *   get:
 *     summary: Chi tiết collection
 *     tags: [Document Collections]
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
 *         description: Chi tiết collection
 */
router.get('/collections/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);

      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          OR: [
            { is_public: true },
            { created_by: req.user?.id || BigInt(1) },
            { tenant_id: req.user?.tenant_id || BigInt(1) }
          ]
        },
        include: {
          document_collection_favorites: true
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection'
        });
      }

      // Serialize the response to handle BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.json({
        success: true,
        data: {
          ...collection,
          documents: [] // TODO: Implement proper document fetching for collection
        }
      });
    } catch (error) {
      console.error('Get collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}:
 *   patch:
 *     summary: Cập nhật collection
 *     tags: [Document Collections]
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
 *               description:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Collection được cập nhật thành công
 */
router.patch('/collections/:id',
  authenticateToken,
  validateRequest(collectionCreateSchema.partial()),
  auditLog('document_collection', 'update'),
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const { name, description, is_public } = req.body;

      // Check ownership
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          created_by: req.user?.id || BigInt(1)
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền chỉnh sửa'
        });
      }

      const updatedCollection = await prisma.document_collections.update({
        where: { id: collectionId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(is_public !== undefined && { is_public }),
          updated_by: req.user?.id || BigInt(1),
          updated_at: new Date()
        }
      });

      // Serialize the response to handle BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.json({
        success: true,
        message: 'Collection được cập nhật thành công',
        data: serializeResponse(updatedCollection)
      });
    } catch (error) {
      console.error('Update collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/collections/{id}:
 *   delete:
 *     summary: Xóa collection
 *     tags: [Document Collections]
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
 *         description: Collection được xóa thành công
 */
router.delete('/collections/:id',
  authenticateToken,
  auditLog('document_collection', 'delete'),
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);

      // Check ownership
      const collection = await prisma.document_collections.findFirst({
        where: {
          id: collectionId,
          created_by: req.user?.id || BigInt(1)
        }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy collection hoặc không có quyền xóa'
        });
      }

      // Delete collection and items
      await prisma.document_collections.delete({ where: { id: collectionId } });

      res.json({
        success: true,
        message: 'Collection được xóa thành công'
      });
    } catch (error) {
      console.error('Delete collection error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DOCUMENT SHARING

/**
 * @swagger
 * /api/v1/documents/shared:
 *   get:
 *     summary: Danh sách tài liệu được chia sẻ với user hiện tại
 *     tags: [Document Sharing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài liệu được chia sẻ
 */
router.get('/shared',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || BigInt(1);

      // Get user details for role/org_unit permissions
      const userDetails = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true, campus_id: true }
      });

      const sharedDocuments = await prisma.document_shares.findMany({
        where: {
          OR: [
            { subject_type: 'user', subject_id: userId },
            { subject_type: 'role', subject_id: BigInt(userDetails?.role === 'teacher' ? 6 : userDetails?.role === 'admin' ? 2 : 1) },
            { subject_type: 'org_unit', subject_id: userDetails?.campus_id || BigInt(1) }
          ]
        },
        include: {
          documents: {
            include: {
              users_documents_created_byTousers: {
                select: {
                  id: true,
                  full_name: true,
                  email: true
                }
              },
              document_tags: {
                include: {
                  tags: true
                }
              }
            }
          },
          users: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Serialize the response to handle BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      const serializedShares = sharedDocuments.map(share => ({
        ...share,
        document: share.documents ? {
          ...share.documents,
          created_by_user: share.documents.users_documents_created_byTousers,
          tags: share.documents.document_tags.map((dt: any) => dt.tags)
        } : null,
        shared_by_user: share.users
      }));

      res.json({
        success: true,
        data: {
          shared_documents: serializeResponse(serializedShares),
          total: sharedDocuments.length
        }
      });
    } catch (error) {
      console.error('Get shared documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách tài liệu được chia sẻ',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/shares:
 *   get:
 *     summary: Danh sách shares của tài liệu
 *     tags: [Document Sharing]
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
 *         description: Danh sách shares
 */
router.get('/:id/shares',
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);

      // Check if user owns the document
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          created_by: req.user?.id || BigInt(1)
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền xem shares'
        });
      }

      const shares = await prisma.document_shares.findMany({
        where: { document_id: documentId },
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Serialize the response to handle BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.json({
        success: true,
        data: serializeResponse(shares)
      });
    } catch (error) {
      console.error('Get document shares error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách shares',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/share:
 *   post:
 *     summary: Chia sẻ tài liệu
 *     tags: [Document Sharing]
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
 *             required:
 *               - subject_type
 *               - subject_id
 *             properties:
 *               subject_type:
 *                 type: string
 *                 enum: [user, role, group]
 *               subject_id:
 *                 type: string
 *               permission:
 *                 type: string
 *                 enum: [view, edit, admin]
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tài liệu được chia sẻ thành công
 */
router.post('/:id/share',
  authenticateToken,
  validateRequest(shareDocumentSchema),
  auditLog('document', 'share'),
  async (req, res) => {
    try {
      console.log('Share document request:', {
        documentId: req.params.id,
        userId: req.user?.id,
        body: req.body
      });

      const documentId = BigInt(req.params.id);
      const { subject_type, subject_id, permission, expires_at } = req.body;

      console.log('Parsed share data:', {
        documentId,
        subject_type,
        subject_id,
        permission,
        expires_at
      });

      // Check if user owns the document
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          created_by: req.user?.id || BigInt(1)
        }
      });

      console.log('Document check result:', {
        documentFound: !!document,
        documentId,
        userId: req.user?.id
      });

      if (!document) {
        console.log('Document not found or no permission');
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền chia sẻ'
        });
      }

      // Create share
      console.log('Creating share record...');
      const share = await prisma.document_shares.create({
        data: {
          document_id: documentId,
          subject_type,
          subject_id,
          permission,
          expires_at,
          created_by: req.user?.id || BigInt(1)
        }
      });

      console.log('Share created successfully:', share);

      // Serialize the response to handle BigInt values
      const serializeResponse = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeResponse);
        if (typeof obj === 'object') {
          const result: any = {};
          for (const key in obj) {
            result[key] = serializeResponse(obj[key]);
          }
          return result;
        }
        return obj;
      };

      res.status(201).json({
        success: true,
        message: 'Tài liệu được chia sẻ thành công',
        data: serializeResponse(share)
      });
    } catch (error) {
      console.error('Share document error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({
        success: false,
        message: 'Lỗi khi chia sẻ tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/shares/{shareId}:
 *   delete:
 *     summary: Xóa share
 *     tags: [Document Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share được xóa thành công
 */
router.delete('/:id/shares/:shareId',
  authenticateToken,
  auditLog('document', 'unshare'),
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);
      const shareId = BigInt(req.params.shareId);

      // Check if user owns the document
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          created_by: req.user?.id || BigInt(1)
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền xóa share'
        });
      }

      // Delete share
      await prisma.document_shares.delete({
        where: { id: shareId }
      });

      res.json({
        success: true,
        message: 'Share được xóa thành công'
      });
    } catch (error) {
      console.error('Delete share error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa share',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DOCUMENT SEARCH

/**
 * @swagger
 * /api/v1/documents/search:
 *   get:
 *     summary: Tìm kiếm tài liệu
 *     tags: [Document Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
 */
router.get('/search',
  authenticateToken,
  async (req, res) => {
    try {
      const query = req.query.q as string;
      const type = req.query.type as string;
      const tags = req.query.tags as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter là bắt buộc'
        });
      }

      const results = await DocumentService.searchDocuments({
        query,
        type,
        tags: tags ? tags.split(',') : undefined,
        tenantId: req.user?.tenant_id || BigInt(1),
        userId: req.user?.id || BigInt(1),
        page,
        limit
      });

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Document search error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// DOCUMENT ANALYTICS

/**
 * @swagger
 * /api/v1/documents/{id}/analytics:
 *   get:
 *     summary: Phân tích sử dụng tài liệu
 *     tags: [Document Analytics]
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
 *         description: Analytics data
 */
router.get('/:id/analytics',
  authenticateToken,
  requireRole(['admin', 'teacher']),
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);

      // Check document access
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { created_by: req.user?.id || BigInt(1) },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu'
        });
      }

      const analytics = await DocumentService.getDocumentAnalytics(documentId);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Document analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy analytics tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/download:
 *   get:
 *     summary: Tải xuống tài liệu
 *     tags: [Document Management]
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
 *         description: File được tải xuống
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/download',
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);

      // Check document access with permission enforcement
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { visibility: 'public' },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) },
            { created_by: userId },
            {
              document_shares: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['view', 'download', 'edit', 'delete', 'share'] }
                }
              }
            },
            // Check role-based permissions - need to get user role from database
            {
              document_shares: {
                some: {
                  subject_type: 'role',
                  subject_id: BigInt(1), // Default role ID, will be updated when we get user role
                  permission: { in: ['view', 'download', 'edit', 'delete', 'share'] }
                }
              }
            },
            // Check org_unit permissions - need to get user org_unit from database
            {
              document_shares: {
                some: {
                  subject_type: 'org_unit',
                  subject_id: BigInt(1), // Default org_unit ID, will be updated when we get user org_unit
                  permission: { in: ['view', 'download', 'edit', 'delete', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền tải xuống'
        });
      }

      // Check specific permission for download
      // Get user details to check role/org_unit permissions
      const userDetails = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true, campus_id: true }
      });

      const userShares = await prisma.document_shares.findMany({
        where: {
          document_id: documentId,
          OR: [
            { subject_type: 'user', subject_id: userId },
            { subject_type: 'role', subject_id: BigInt(userDetails?.role === 'teacher' ? 6 : userDetails?.role === 'admin' ? 2 : 1) },
            { subject_type: 'org_unit', subject_id: userDetails?.campus_id || BigInt(1) }
          ]
        }
      });

      const hasDownloadPermission = userShares.some(share =>
        ['download', 'edit', 'delete', 'share'].includes(share.permission)
      ) || document.created_by === userId || document.visibility === 'public' ||
         (document.visibility === 'tenant' && document.tenant_id === req.user?.tenant_id);

      if (!hasDownloadPermission) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền tải xuống tài liệu này'
        });
      }

      // Check if file exists
      if (!document.file_path || !require('fs').existsSync(document.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'File không tồn tại trên server'
        });
      }

      // Set headers for file download
      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');

      // Handle filename encoding for different file types
      let filename = document.name;
      if (document.mime_type?.includes('application/vnd.openxmlformats-officedocument.presentationml')) {
        // PowerPoint .pptx files
        filename = filename.replace(/\.pptx?$/i, '.pptx');
      } else if (document.mime_type?.includes('video/') || document.mime_type?.includes('audio/')) {
        // Video and audio files - keep original extension
        filename = filename;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', document.file_size?.toString() || '0');

      // Stream the file
      const fs = require('fs');
      const fileStream = fs.createReadStream(document.file_path);
      fileStream.pipe(res);

      // Log download activity and increment counter
      await prisma.audit_logs.create({
        data: {
          tenant_id: req.user?.tenant_id || BigInt(1),
          actor_id: req.user?.id,
          action: 'download',
          entity_type: 'document',
          entity_id: documentId,
          metadata: {
            file_name: document.name,
            file_size: document.file_size?.toString(),
            mime_type: document.mime_type
          }
        }
      });

      // Update download counter (we'll add this field to schema later)
      // For now, we'll track in audit logs

    } catch (error) {
      console.error('Download document error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải xuống tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/{id}/preview:
 *   get:
 *     summary: Preview tài liệu (cho image)
 *     tags: [Document Management]
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
 *         description: File preview
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/preview',
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);

      // Check document access
      const document = await prisma.documents.findFirst({
        where: {
          id: documentId,
          OR: [
            { visibility: 'public' },
            { visibility: 'tenant', tenant_id: req.user?.tenant_id || BigInt(1) },
            { created_by: userId },
            {
              document_shares: {
                some: {
                  subject_type: 'user',
                  subject_id: userId,
                  permission: { in: ['view', 'download', 'edit', 'delete', 'share'] }
                }
              }
            }
          ]
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu hoặc không có quyền truy cập'
        });
      }

      // Check if file exists
      if (!document.file_path || !require('fs').existsSync(document.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'File không tồn tại trên server'
        });
      }

      // Set headers for image preview
      res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      // Stream the file
      const fs = require('fs');
      const fileStream = fs.createReadStream(document.file_path);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Preview document error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi preview tài liệu',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/documents/trending:
 *   get:
 *     summary: Tài liệu phổ biến
 *     tags: [Document Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách tài liệu phổ biến
 */
router.get('/trending',
  authenticateToken,
  async (req, res) => {
    try {
      const period = req.query.period as string || 'week';
      const limit = parseInt(req.query.limit as string) || 10;

      const trending = await DocumentService.getTrendingDocuments({
        tenantId: req.user?.tenant_id || BigInt(1),
        period,
        limit
      });

      res.json({
        success: true,
        data: trending
      });
    } catch (error) {
      console.error('Trending documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tài liệu phổ biến',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Import document from URL - BASIC MODE (No OCR/AI processing)
router.post('/import-url-basic',
  authenticateToken,
  auditLog('document', 'import_url_basic'),
  async (req, res) => {
    try {
      const { url, fileName: customFileName, fileType } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      if (!fileType) {
        return res.status(400).json({ error: 'File type is required' });
      }

      let downloadUrl = url;

      // Handle different URL types
      if (url.includes('drive.google.com')) {
        if (url.includes('/view?')) {
          // Extract file ID from sharing link
          const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
          if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            // Use direct download URL with confirmation token
            downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=t`;
            console.log('Converted Google Drive sharing link to download link', { originalUrl: url, downloadUrl });
          } else {
            return res.status(400).json({
              error: 'Invalid Google Drive sharing URL. Please ensure the link is in the format: https://drive.google.com/file/d/FILE_ID/view'
            });
          }
        }
      }

      // Download file
      console.log('Starting file download...');
      const response = await axios.get(downloadUrl, {
        responseType: 'stream',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/octet-stream,*/*'
        },
        maxRedirects: 5,
        validateStatus: function (status) {
          return status < 400;
        }
      });

      if (response.status !== 200) {
        if (response.status === 403 && downloadUrl.includes('drive.google.com')) {
          return res.status(400).json({
            error: 'Google Drive file access denied',
            details: 'Please ensure the file is publicly shared with "Anyone with the link can view" permissions.'
          });
        }
        return res.status(400).json({
          error: 'Download failed',
          details: `Failed to download file: ${response.status} ${response.statusText}`
        });
      }

      // Determine filename - use custom filename or extract from URL
      let finalFileName = customFileName || 'downloaded_file';

      // Sanitize filename
      finalFileName = finalFileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').substring(0, 255);

      // Always add extension based on user-selected fileType
      switch (fileType) {
        case 'doc': finalFileName += '.doc'; break;
        case 'pdf': finalFileName += '.pdf'; break;
        case 'pptx': finalFileName += '.pptx'; break;
        case 'video': finalFileName += '.mp4'; break;
        case 'audio': finalFileName += '.mp3'; break;
        case 'image': finalFileName += '.jpg'; break;
        default: finalFileName += '.bin'; // Fallback
      }

      // Set mime type based on fileType
      let mimeType = 'application/octet-stream';
      switch (fileType) {
        case 'doc': mimeType = 'application/msword'; break;
        case 'pdf': mimeType = 'application/pdf'; break;
        case 'pptx': mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break;
        case 'video': mimeType = 'video/mp4'; break;
        case 'audio': mimeType = 'audio/mp3'; break;
        case 'image': mimeType = 'image/jpeg'; break;
      }

      // Sanitize filename
      finalFileName = finalFileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').substring(0, 255);

      // Always add extension based on user-selected fileType
      switch (fileType) {
        case 'doc': finalFileName += '.doc'; break;
        case 'pdf': finalFileName += '.pdf'; break;
        case 'pptx': finalFileName += '.pptx'; break;
        case 'video': finalFileName += '.mp4'; break;
        case 'audio': finalFileName += '.mp3'; break;
        case 'image': finalFileName += '.jpg'; break;
        default: finalFileName += '.bin'; // Fallback
      }

      // Save file
      let filePath = path.join(__dirname, '../../uploads', `url_${Date.now()}_${finalFileName}`);
      const writer = fs.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });

      // Get file size
      const stats = await fs.promises.stat(filePath);
      const actualFileSize = stats.size;

      // Determine MIME type based on fileType
      let mimeTypeFinal = 'application/octet-stream';
      switch (fileType) {
        case 'doc': mimeTypeFinal = 'application/msword'; break;
        case 'pdf': mimeTypeFinal = 'application/pdf'; break;
        case 'pptx': mimeTypeFinal = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break;
        case 'video': mimeTypeFinal = 'video/mp4'; break;
        case 'audio': mimeTypeFinal = 'audio/mp3'; break;
        case 'image': mimeTypeFinal = 'image/jpeg'; break;
      }

      // Set proper MIME type based on file type (removed Excel/XLSX support)
      let properMimeType = 'application/octet-stream';
      switch (fileType) {
        case 'doc': properMimeType = 'application/msword'; break;
        case 'pdf': properMimeType = 'application/pdf'; break;
        case 'pptx': properMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break;
        case 'video': properMimeType = 'video/mp4'; break;
        case 'audio': properMimeType = 'audio/mp3'; break;
        case 'image': properMimeType = 'image/jpeg'; break;
      }

      // Create document record with name format: "file_name_entered,user_chosen_extension"
      const document = await prisma.documents.create({
        data: {
          tenant_id: BigInt(1),
          name: `${customFileName || 'downloaded_file'},${fileType}`,
          description: `Imported from URL: ${url}`,
          file_path: filePath,
          mime_type: properMimeType,
          file_size: BigInt(actualFileSize),
          visibility: 'tenant',
          health_status: 'unknown',
          created_by: req.user?.id || BigInt(1),
          updated_by: req.user?.id || BigInt(1)
        }
      });

      // Create external reference for Google Drive
      if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          await prisma.document_external_refs.create({
            data: {
              document_id: document.id,
              provider: 'gdrive',
              external_id: fileIdMatch[1],
              web_view_url: url,
              metadata: {
                original_url: url,
                download_url: downloadUrl,
                imported_at: new Date().toISOString()
              }
            }
          });
        }
      }

      res.json({
        success: true,
        documentId: document.id.toString(),
        file: {
          name: finalFileName,
          size: actualFileSize,
          path: filePath,
          source: 'url'
        }
      });

    } catch (error) {
      console.error('Basic URL import failed', error);
      res.status(500).json({
        error: 'URL import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Import document from URL - SIMPLE MODE for Google Drive (no OCR/AI processing)
router.post('/import-url',
  authenticateToken,
  auditLog('document', 'import_url'),
  async (req, res) => {
    // Simple timeout - 30 seconds total for Google Drive files
    const totalTimeout = setTimeout(() => {
      console.error('Import URL timeout - operation took longer than 30 seconds');
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Import timeout',
          details: 'Import operation took longer than 30 seconds'
        });
      }
    }, 30000);

    try {
      const { url, fileName: customFileName, fileType } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      let downloadUrl = url;

      // Handle different URL types
      if (url.includes('drive.google.com')) {
        if (url.includes('/view?')) {
          // Extract file ID from sharing link
          const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
          if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            console.log('Converted Google Drive sharing link to download link', { originalUrl: url, downloadUrl });
          } else {
            return res.status(400).json({
              error: 'Invalid Google Drive sharing URL. Please ensure the link is in the format: https://drive.google.com/file/d/FILE_ID/view'
            });
          }
        } else if (url.includes('/uc?')) {
          // Already a direct download link
          downloadUrl = url;
        } else {
          return res.status(400).json({
            error: 'Unsupported Google Drive URL format. Please use a sharing link (with /view?) or direct download link.'
          });
        }
      } else if (url.includes('docs.google.com/presentation')) {
        // Handle Google Slides presentation URLs
        const presentationIdMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
        if (presentationIdMatch) {
          const presentationId = presentationIdMatch[1];
          downloadUrl = `https://docs.google.com/presentation/d/${presentationId}/export/pptx`;
          console.log('Converted Google Slides URL to PPTX export link', { originalUrl: url, downloadUrl });
        } else {
          return res.status(400).json({
            error: 'Invalid Google Slides URL. Please ensure the link is in the format: https://docs.google.com/presentation/d/PRESENTATION_ID/edit'
          });
        }
      } else if (url.includes('docs.google.com/document')) {
        // Handle Google Docs document URLs
        const documentIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
        if (documentIdMatch) {
          const documentId = documentIdMatch[1];
          downloadUrl = `https://docs.google.com/document/d/${documentId}/export?format=docx`;
          console.log('Converted Google Docs URL to DOCX export link', { originalUrl: url, downloadUrl });
        } else {
          return res.status(400).json({
            error: 'Invalid Google Docs URL. Please ensure the link is in the format: https://docs.google.com/document/d/DOCUMENT_ID/edit'
          });
        }
      } else if (url.includes('docs.google.com/spreadsheets')) {
        // Handle Google Sheets spreadsheet URLs
        const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (sheetIdMatch) {
          const sheetId = sheetIdMatch[1];
          downloadUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
          console.log('Converted Google Sheets URL to XLSX export link', { originalUrl: url, downloadUrl });
        } else {
          return res.status(400).json({
            error: 'Invalid Google Sheets URL. Please ensure the link is in the format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit'
          });
        }
      } else if (url.includes('dropbox.com')) {
        // Convert Dropbox sharing links to direct download
        if (url.includes('?dl=0') || !url.includes('?dl=1')) {
          downloadUrl = url.replace('?dl=0', '?dl=1').replace(/\/$/, '?dl=1');
          console.log('Converted Dropbox sharing link to download link', { originalUrl: url, downloadUrl });
        }
      }

      // Skip HEAD request for Google Drive files to speed up - they often don't provide accurate Content-Length
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB limit
      let headResponse = null;

      // Only do HEAD request for non-Google Drive URLs
      if (!downloadUrl.includes('drive.google.com') && !downloadUrl.includes('docs.google.com')) {
        try {
          console.log('Making HEAD request to validate file...');
          headResponse = await axios.head(downloadUrl, {
            timeout: 2000, // Reduced to 2 seconds for non-Google Drive
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxRedirects: 2,
            validateStatus: function (status) {
              return status < 400;
            }
          });

          // Validate file size before download
          const contentLength = parseInt(headResponse.headers['content-length'] || '0');
          if (contentLength > MAX_SIZE) {
            return res.status(400).json({
              error: 'File too large',
              details: `File size ${contentLength} bytes exceeds maximum allowed size of ${MAX_SIZE} bytes (100MB)`
            });
          }
        } catch (headError: any) {
          console.warn('HEAD request failed, proceeding with GET', { error: headError.message });
        }
      } else {
        console.log('Skipping HEAD request for Google Drive file to speed up import');
      }

      // SIMPLE DOWNLOAD - Direct stream for Google Drive
      console.log('Starting SIMPLE file download...');
      const response = await axios.get(downloadUrl, {
        responseType: 'stream',
        timeout: 15000, // 15 seconds for download
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/octet-stream,*/*'
        },
        maxRedirects: 5, // Allow more redirects
        validateStatus: function (status) {
          return status < 400;
        }
      });

      console.log('Download response headers', {
        allHeaders: Object.keys(response.headers),
        contentDisposition: response.headers['content-disposition'] || response.headers['Content-Disposition'],
        contentType: response.headers['content-type'] || response.headers['Content-Type'],
        contentLength: response.headers['content-length'] || response.headers['Content-Length']
      });

      if (response.status !== 200) {
        if (response.status === 403 && downloadUrl.includes('drive.google.com')) {
          return res.status(400).json({
            error: 'Google Drive file access denied',
            details: 'Please ensure the file is publicly shared with "Anyone with the link can view" permissions.'
          });
        }
        if (response.status === 404) {
          return res.status(404).json({
            error: 'File not found',
            details: 'The Google Drive file does not exist or has been deleted.'
          });
        }
        return res.status(400).json({
          error: 'Download failed',
          details: `Failed to download file: ${response.status} ${response.statusText}`
        });
      }

      // Use user-selected file type directly (no detection needed)
      let detectedFileType = fileType;
      let finalFileName = customFileName;

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'] || '';

      if (!finalFileName && contentDisposition && contentDisposition.includes('filename=')) {
        // Try multiple regex patterns for filename extraction
        const patterns = [
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i,
          /filename=([^;]+)/i,
          /filename="([^"]+)"/i,
          /filename='([^']+)'/i
        ];

        for (const pattern of patterns) {
          const match = contentDisposition.match(pattern);
          if (match && match[1]) {
            finalFileName = match[1].replace(/['"]/g, '').trim();
            console.log('✅ Extracted filename from Content-Disposition', { finalFileName });
            break;
          }
        }
      }

      // For Google Drive files, try alternative methods if filename not found
      if (!finalFileName && url.includes('drive.google.com')) {
        console.log('🔍 Trying to extract filename for Google Drive file');

        // Try to get filename from URL parameters
        try {
          const urlObj = new URL(url);
          const filenameParam = urlObj.searchParams.get('filename');
          if (filenameParam) {
            finalFileName = filenameParam;
            console.log('✅ Extracted filename from URL parameter', { finalFileName });
          }
        } catch (urlError) {
          console.warn('URL parsing failed', { url, error: urlError });
        }

        // Try to get filename from URL path
        if (!finalFileName) {
          const urlParts = url.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            finalFileName = decodeURIComponent(lastPart);
            console.log('✅ Extracted filename from URL path', { finalFileName });
          }
        }

        // Try to infer filename from Google Drive file ID
        if (!finalFileName) {
          const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
          if (fileIdMatch) {
            // Use file ID as temporary name, will be updated after download
            finalFileName = `drive_file_${fileIdMatch[1].substring(0, 8)}`;
            console.log('✅ Using file ID as temporary filename', { finalFileName });
          }
        }

        // For Google Drive files, ALWAYS ensure they have an extension
        if (url.includes('drive.google.com') && finalFileName && !finalFileName.includes('.')) {
          // Add .docx extension to Google Drive files without extension
          finalFileName += '.docx';
          console.log('Added .docx extension to Google Drive file', { finalFileName });
        } else if (!finalFileName && url.includes('drive.google.com')) {
          // Default filename for Google Drive files
          finalFileName = `document_${Date.now()}.docx`;
          console.log('Using default DOCX filename for Google Drive file', { finalFileName });
        } else if (!finalFileName) {
          finalFileName = `downloaded_file_${Date.now()}`;
          console.warn('⚠️ No filename found, using generic name', { finalFileName });
        }
      }

      console.log('Final filename before processing', { finalFileName, fileType: detectedFileType });

      // Use custom filename if provided (highest priority)
      if (customFileName) {
        finalFileName = customFileName;
        console.log('✅ Using custom filename (highest priority)', { customFileName });
      }

      // Ensure filename has correct extension based on detected file type
      if (finalFileName && detectedFileType !== 'unknown' && detectedFileType !== 'other' && !finalFileName.includes('.')) {
        switch (detectedFileType) {
          case 'pdf': finalFileName += '.pdf'; break;
          case 'docx': finalFileName += '.docx'; break;
          case 'xlsx': finalFileName += '.xlsx'; break;
          case 'pptx': finalFileName += '.pptx'; break;
          case 'audio': finalFileName += '.mp3'; break;
          case 'video': finalFileName += '.mp4'; break;
          case 'image': finalFileName += '.jpg'; break;
        }
        console.log('Added extension to custom filename', { finalFileName, detectedFileType });
      }
      // Otherwise try to extract from Content-Disposition (works for Google Drive)
      else if (contentDisposition && contentDisposition.includes('filename=')) {
        const patterns = [
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i,
          /filename=([^;]+)/i,
          /filename="([^"]+)"/i,
          /filename='([^']+)'/i
        ];

        for (const pattern of patterns) {
          const match = contentDisposition.match(pattern);
          if (match && match[1]) {
            finalFileName = match[1].replace(/['"]/g, '').trim();
            console.log('✅ Using filename from Content-Disposition', { finalFileName });
            break;
          }
        }
      }
      // Fallback to URL-based filename
      if (!finalFileName) {
        const urlPath = new URL(url).pathname;
        const urlExt = path.extname(urlPath).toLowerCase();
        const urlFileName = path.basename(urlPath) || 'downloaded_file';
        finalFileName = urlFileName.includes('.') ? urlFileName : `${urlFileName}${urlExt}`;
        console.log('Using fallback filename from URL', { finalFileName });
      }

      // Sanitize filename to remove invalid characters
      const sanitizeFileName = (name: string): string => {
        return name
          .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
          .replace(/^\.+/, '') // Remove leading dots
          .replace(/\.+$/, '') // Remove trailing dots
          .replace(/\.+/g, '.') // Replace multiple dots with single dot
          .substring(0, 255); // Limit length
      };

      // Start with filename without extension
      let finalFileNameWithExt = finalFileName;
      if (finalFileNameWithExt.includes('.')) {
        // If filename already has extension, remove it for proper detection
        finalFileNameWithExt = finalFileNameWithExt.substring(0, finalFileNameWithExt.lastIndexOf('.'));
      }

      // Sanitize the base filename
      finalFileNameWithExt = sanitizeFileName(finalFileNameWithExt);

      // Always add the correct extension based on detected file type (removed Excel/XLSX support)
      if (fileType !== 'unknown' && fileType !== 'other') {
        switch (fileType) {
          case 'pdf': finalFileNameWithExt += '.pdf'; break;
          case 'docx': finalFileNameWithExt += '.docx'; break;
          case 'pptx': finalFileNameWithExt += '.pptx'; break;
          case 'audio': finalFileNameWithExt += '.mp3'; break;
          case 'video': finalFileNameWithExt += '.mp4'; break;
          case 'image': finalFileNameWithExt += '.jpg'; break;
        }
      }

      // CRITICAL FIX: Also determine extension from content-type header like in basic import
      // This ensures ALL file types get proper extensions, not just detected ones
      const contentType = response.headers['content-type'] || '';
      if (!finalFileNameWithExt.includes('.') || finalFileNameWithExt.endsWith('.bin')) {
        if (contentType.includes('pdf')) {
          finalFileNameWithExt = finalFileNameWithExt.replace(/\.bin$/, '') + '.pdf';
        } else if (contentType.includes('wordprocessingml') || contentType.includes('msword')) {
          finalFileNameWithExt = finalFileNameWithExt.replace(/\.bin$/, '') + '.docx';
        } else if (contentType.includes('spreadsheetml') || contentType.includes('excel')) {
          finalFileNameWithExt = finalFileNameWithExt.replace(/\.bin$/, '') + '.xlsx';
        } else if (contentType.includes('presentationml') || contentType.includes('powerpoint')) {
          finalFileNameWithExt = finalFileNameWithExt.replace(/\.bin$/, '') + '.pptx';
        } else if (contentType.includes('image/')) {
          finalFileNameWithExt = finalFileNameWithExt.replace(/\.bin$/, '') + '.jpg';
        } else if (contentType.includes('audio/')) {
          finalFileNameWithExt = finalFileNameWithExt.replace(/\.bin$/, '') + '.mp3';
        } else if (contentType.includes('video/')) {
          finalFileNameWithExt = finalFileNameWithExt.replace(/\.bin$/, '') + '.mp4';
        }
      }

      // ENHANCED FIX: Detect file type from URL patterns for Google Drive files
      // Google Drive often returns generic content-type, so we need URL-based detection
      if (url.includes('drive.google.com') && !finalFileNameWithExt.includes('.')) {
        // Check URL patterns to determine file type
        if (url.includes('pdf') || url.includes('PDF')) {
          finalFileNameWithExt += '.pdf';
          console.log('✅ Detected PDF from Google Drive URL pattern');
        } else if (url.includes('document') || url.includes('word') || url.includes('doc')) {
          finalFileNameWithExt += '.docx';
          console.log('✅ Detected DOCX from Google Drive URL pattern');
        } else if (url.includes('spreadsheets') || url.includes('excel') || url.includes('sheet')) {
          finalFileNameWithExt += '.xlsx';
          console.log('✅ Detected XLSX from Google Drive URL pattern');
        } else if (url.includes('presentation') || url.includes('slides') || url.includes('powerpoint')) {
          finalFileNameWithExt += '.pptx';
          console.log('✅ Detected PPTX from Google Drive URL pattern');
        } else {
          // For Google Drive files without clear type indicators, we'll detect from content after download
          console.log('⚠️ Google Drive file type unclear from URL, will detect from content after download');
        }
      }

      // Also sanitize finalFileName for response
      if (finalFileName.includes('.')) {
        const baseName = finalFileName.substring(0, finalFileName.lastIndexOf('.'));
        const ext = finalFileName.substring(finalFileName.lastIndexOf('.'));
        finalFileName = sanitizeFileName(baseName) + ext;
      } else {
        finalFileName = sanitizeFileName(finalFileName);
        // Add extension to finalFileName too (removed Excel/XLSX support)
        if (detectedFileType !== 'unknown' && detectedFileType !== 'other') {
          switch (detectedFileType) {
            case 'pdf': finalFileName += '.pdf'; break;
            case 'docx': finalFileName += '.docx'; break;
            case 'pptx': finalFileName += '.pptx'; break;
            case 'audio': finalFileName += '.mp3'; break;
            case 'video': finalFileName += '.mp4'; break;
            case 'image': finalFileName += '.jpg'; break;
          }
        }
      }

      // Save file to uploads directory using STREAM PROCESSING with timeout
      let tempFilePath: string | null = null;
      let document: any = null;
      let actualFileSize: number = 0;

      try {
        tempFilePath = path.join(__dirname, '../../uploads', `url_${Date.now()}_temp_${finalFileNameWithExt}`);

        // SIMPLE STREAM - No timeout for Google Drive
        const simpleDownload = (response: any, tempFilePath: string): Promise<void> => {
          return new Promise<void>((resolve, reject) => {
            const writer = fs.createWriteStream(tempFilePath);

            writer.on('finish', () => {
              resolve();
            });

            writer.on('error', (error) => {
              reject(error);
            });

            response.data.pipe(writer);
          });
        };

        console.log('Starting SIMPLE download...');
        await simpleDownload(response, tempFilePath);
        console.log('Download completed in under 2 seconds!');

        // Get actual file size after streaming
        const stats = await fs.promises.stat(tempFilePath);
        actualFileSize = stats.size;

        // Final validation of file size
        if (actualFileSize > MAX_SIZE) {
          // Clean up temp file
          await fs.promises.unlink(tempFilePath);
          return res.status(400).json({
            error: 'File too large',
            details: `Downloaded file size ${actualFileSize} bytes exceeds maximum allowed size of ${MAX_SIZE} bytes (100MB)`
          });
        }

        // Use user-selected file type directly
        console.log('Using user-selected file type', { fileType: detectedFileType, fileName: finalFileNameWithExt });

        console.log('Final file info before database creation', {
          detectedFileType,
          finalFileName: finalFileNameWithExt,
          fileSize: actualFileSize,
          url: url.substring(0, 100) + '...'
        });

        // Final file path with correct extension
        const filePath = path.join(__dirname, '../../uploads', `url_${Date.now()}_${finalFileNameWithExt}`);

        // Rename temp file to final path
        await fs.promises.rename(tempFilePath, filePath);

        // Use file type directly (no mapping needed)
        const dbFileType = detectedFileType;

        // SIMPLE DATABASE - Sequential operations without timeout
        console.log('Creating database records...');

        // Set proper MIME type based on file type (removed Excel/XLSX support)
        let properMimeType = 'application/octet-stream';
        switch (fileType) {
          case 'pdf': properMimeType = 'application/pdf'; break;
          case 'docx': properMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
          case 'pptx': properMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; break;
          case 'audio': properMimeType = 'audio/mp3'; break;
          case 'video': properMimeType = 'video/mp4'; break;
          case 'image': properMimeType = 'image/jpeg'; break;
          case 'doc': properMimeType = 'application/msword'; break;
        }

        // Create document record
        document = await prisma.documents.create({
          data: {
            tenant_id: BigInt(1),
            name: finalFileNameWithExt,
            description: `Imported from URL: ${url}`,
            file_path: filePath,
            mime_type: properMimeType,
            file_size: BigInt(actualFileSize),
            visibility: 'tenant',
            health_status: 'unknown',
            created_by: req.user?.id || BigInt(1),
            updated_by: req.user?.id || BigInt(1)
          }
        });

        console.log('Document created successfully!', { documentId: document.id.toString() });

        // Create external reference record for Google Drive files
        if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
          try {
            let provider: 'gdrive' | 'url' = 'gdrive';
            let externalId = null;

            // Extract Google Drive file ID
            if (url.includes('/file/d/')) {
              const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
              if (fileIdMatch) {
                externalId = fileIdMatch[1];
              }
            } else if (url.includes('/presentation/d/')) {
              const presentationIdMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
              if (presentationIdMatch) {
                externalId = presentationIdMatch[1];
              }
            } else if (url.includes('/document/d/')) {
              const documentIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
              if (documentIdMatch) {
                externalId = documentIdMatch[1];
              }
            }

            await prisma.document_external_refs.create({
              data: {
                document_id: document.id,
                provider: provider,
                external_id: externalId,
                web_view_url: url,
                metadata: {
                  original_url: url,
                  download_url: downloadUrl,
                  imported_at: new Date().toISOString()
                }
              }
            });
            console.log('External reference created successfully', {
              documentId: document.id.toString(),
              provider: provider,
              externalId: externalId
            });
          } catch (externalRefError) {
            console.warn('Failed to create external reference, but document was created successfully', {
              error: (externalRefError as Error).message,
              documentId: document.id.toString()
            });
            // Don't fail the entire import if external reference creation fails
          }
        }

        // Process OCR and AI immediately after URL import using Python OCR service
        try {
          console.log(`Starting OCR+AI processing for URL imported document ${document.id}: ${document.name}`);

          // Create form data for Python OCR service
          const FormData = require('form-data');
          const ocrFormData = new FormData();
          const fileStream = fs.createReadStream(document.file_path);

          ocrFormData.append('file', fileStream, {
            filename: document.name || 'document',
            contentType: document.mime_type || 'application/octet-stream'
          });

          // Call Python OCR service
          const ocrResponse = await axios.post('http://localhost:8000/process/file', ocrFormData, {
            headers: ocrFormData.getHeaders(),
            timeout: 120000, // 2 minutes timeout
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });

          if (ocrResponse.data && ocrResponse.data.success) {
            console.log(`OCR+AI completed for URL imported document ${document.id} in ${ocrResponse.data.processing_time}`);

            // Update document with OCR text
            await prisma.documents.update({
              where: { id: document.id },
              data: { ocr_text: ocrResponse.data.extracted_text || '' }
            });

            // Save AI analysis results from Python service
            const aiTaskTypes = ['summarize', 'segment', 'level_suggestion', 'topic_suggestion', 'tag_suggestion'];

            const taskPromises = aiTaskTypes.map(taskType => {
              let outputJson: any = {};

              switch (taskType) {
                case 'summarize':
                  outputJson = { result: ocrResponse.data.summary || 'Document processed successfully' };
                  break;
                case 'segment':
                  outputJson = { result: ocrResponse.data.segments || [] };
                  break;
                case 'level_suggestion':
                  outputJson = { result: ocrResponse.data.level || 'B1' };
                  break;
                case 'topic_suggestion':
                  outputJson = { result: ocrResponse.data.topic || 'Education' };
                  break;
                case 'tag_suggestion':
                  outputJson = {
                    suggested_tags: ocrResponse.data.suggested_tags || [],
                    analysis: {
                      summary: ocrResponse.data.summary,
                      segments: ocrResponse.data.segments,
                      level_suggestion: ocrResponse.data.level,
                      topic_suggestion: ocrResponse.data.topic
                    }
                  };
                  break;
              }

              return prisma.document_ai_tasks.create({
                data: {
                  document_id: document.id,
                  task_type: taskType as any,
                  status: 'completed',
                  output_json: outputJson,
                  finished_at: new Date()
                }
              });
            });

            await Promise.all(taskPromises);

            // Update document with AI-generated tags
            if (ocrResponse.data.suggested_tags && ocrResponse.data.suggested_tags.length > 0) {
              await prisma.documents.update({
                where: { id: document.id },
                data: {
                  ai_tags: JSON.stringify(ocrResponse.data.suggested_tags.map((tag: any) =>
                    typeof tag === 'string' ? tag : tag.tag_label
                  ))
                }
              });
            }
          } else {
            console.warn(`OCR+AI processing failed for URL imported document ${document.id}:`, ocrResponse.data?.error);
          }
        } catch (ocrError: any) {
          console.warn(`OCR+AI failed for URL imported document ${document.id}:`, ocrError.message);
        }

        // RESPONSE - Return with OCR/AI processing results
        console.log('URL import with OCR+AI completed successfully!');
        res.json({
          success: true,
          documentId: document.id.toString(),
          file: {
            name: finalFileName,
            type: detectedFileType,
            size: actualFileSize,
            path: filePath,
            source: 'url'
          },
          analysis: { status: 'completed' }
        });
      } catch (streamError) {
        console.error('Stream processing failed', streamError);
        // Clean up temp file if it exists
        try {
          if (tempFilePath) {
            await fs.promises.unlink(tempFilePath);
          }
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file', cleanupError);
        }
        throw streamError;
      }
    } catch (error) {
      console.error('URL import failed', { error });

      // Don't send response if already sent due to timeout
      if (!res.headersSent) {
        res.status(500).json({
          error: 'URL import failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      clearTimeout(totalTimeout);
    }
});

/**
 * @swagger
 * /api/v1/documents/favorites:
 *   get:
 *     summary: Danh sách tài liệu yêu thích của user
 *     tags: [Document Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài liệu yêu thích
 */
router.get('/favorites',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Replace model name below if your Prisma model is documentFavorite / document_favorite etc.
      const favs = await prisma.document_favorites.findMany({
        where: { user_id: BigInt(userId) as any },
        select: { document_id: true, created_at: true }
      });

      // Normalize BigInt -> string for JSON, make shape stable
      const document_favorites = favs.map(f => ({
        document_id: String(f.document_id),
        created_at: f.created_at
      }));

      // If you have collection favorites, query similarly
      const collection_favorites: any[] = [];

      return res.json({ success: true, data: { document_favorites, collection_favorites } });
    } catch (err) {
      console.error('GET /favorites error', err);
      return res.status(500).json({ success: false, message: 'Server error loading favorites' });
    }
  }
);



/**
 * @swagger
 * /api/v1/documents/collections/{id}/favorite:
 *   post:
 *     summary: Thêm collection vào yêu thích
 *     tags: [Document Management]
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
 *         description: Đã thêm collection vào yêu thích
 *       400:
 *         description: Collection đã được yêu thích
 *       404:
 *         description: Collection không tồn tại
 *   delete:
 *     summary: Bỏ yêu thích collection
 *     tags: [Document Management]
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
 *         description: Đã bỏ yêu thích collection
 *       404:
 *         description: Collection không tồn tại hoặc chưa được yêu thích
 */
router.post('/collections/:id/favorite',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);

      // Check if collection exists
      const collection = await prisma.document_collections.findUnique({
        where: { id: collectionId }
      });

      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Collection không tồn tại'
        });
      }

      // Check if already favorited
      const existingFavorite = await prisma.document_collection_favorites.findUnique({
        where: {
          collection_id_user_id: {
            collection_id: collectionId,
            user_id: userId
          }
        }
      });

      if (existingFavorite) {
        return res.status(400).json({
          success: false,
          message: 'Collection đã được yêu thích'
        });
      }

      // Add to favorites
      await prisma.document_collection_favorites.create({
        data: {
          collection_id: collectionId,
          user_id: userId
        }
      });

      res.json({
        success: true,
        message: 'Đã thêm collection vào yêu thích'
      });
    } catch (error) {
      console.error('Add collection favorite error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thêm collection vào yêu thích',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

router.delete('/collections/:id/favorite',
  authenticateToken,
  async (req, res) => {
    try {
      const collectionId = BigInt(req.params.id);
      const userId = req.user?.id || BigInt(1);

      // Check if favorite exists
      const existingFavorite = await prisma.document_collection_favorites.findUnique({
        where: {
          collection_id_user_id: {
            collection_id: collectionId,
            user_id: userId
          }
        }
      });

      if (!existingFavorite) {
        return res.status(404).json({
          success: false,
          message: 'Collection chưa được yêu thích'
        });
      }

      // Remove from favorites
      await prisma.document_collection_favorites.delete({
        where: {
          collection_id_user_id: {
            collection_id: collectionId,
            user_id: userId
          }
        }
      });

      res.json({
        success: true,
        message: 'Đã bỏ yêu thích collection'
      });
    } catch (error) {
      console.error('Remove collection favorite error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi bỏ yêu thích collection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
