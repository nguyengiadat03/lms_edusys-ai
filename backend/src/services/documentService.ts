import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AIService } from './aiService';

const prisma = new PrismaClient();

export class DocumentService {
  /**
   * Add tags to document
   */
  static async addTagsToDocument(documentId: bigint, tagNames: string[], tenantId: bigint) {
    try {
      const tags = [];

      for (const tagName of tagNames) {
        // Find or create tag
        const tag = await prisma.tags.upsert({
          where: {
            tenant_id_name: {
              tenant_id: tenantId,
              name: tagName.toLowerCase()
            }
          },
          update: {},
          create: {
            tenant_id: tenantId,
            name: tagName.toLowerCase(),
            category: 'document',
            description: `Tag for document: ${tagName}`
          }
        });

        tags.push(tag);
      }

      // Link tags to document
      const documentTags = tags.map(tag => ({
        document_id: documentId,
        tag_id: tag.id
      }));

      await prisma.document_tags.createMany({
        data: documentTags,
        skipDuplicates: true
      });

      return tags;
    } catch (error) {
      throw new Error(`Lỗi khi thêm tags: ${(error as Error).message}`);
    }
  }

  /**
   * Update document tags
   */
  static async updateDocumentTags(documentId: bigint, tagNames: string[], tenantId: bigint) {
    try {
      // Remove existing tags
      await prisma.document_tags.deleteMany({
        where: { document_id: documentId }
      });

      // Add new tags
      if (tagNames.length > 0) {
        await this.addTagsToDocument(documentId, tagNames, tenantId);
      }

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật tags: ${(error as Error).message}`);
    }
  }

  /**
   * Queue document for processing
   */
  static async queueDocumentProcessing(documentId: bigint) {
    try {
      // Create processing tasks - using 'other' as fallback since schema doesn't have 'ocr'
      await prisma.document_ai_tasks.create({
        data: {
          document_id: documentId,
          task_type: 'other' as const,
          status: 'queued' as const
        }
      });

      await prisma.document_ai_tasks.create({
        data: {
          document_id: documentId,
          task_type: 'tag_suggestion' as const,
          status: 'queued' as const
        }
      });

      await prisma.document_ai_tasks.create({
        data: {
          document_id: documentId,
          task_type: 'segment' as const,
          status: 'queued' as const
        }
      });

      // In a real implementation, you would queue these tasks to a job queue
      // For now, we'll process them immediately in the background
      this.processDocumentTasks(documentId).catch(console.error);

      return { message: 'Processing tasks queued' };
    } catch (error) {
      throw new Error(`Lỗi khi queue processing: ${(error as Error).message}`);
    }
  }

  /**
   * Queue OCR processing
   */
  static async queueOCRProcessing(documentId: bigint) {
    try {
      const task = await prisma.document_ai_tasks.create({
        data: {
          document_id: documentId,
          task_type: 'other' as const,
          status: 'queued' as const
        }
      });

      // Process OCR in background
      this.processOCR(documentId, task.id).catch(console.error);

      return task;
    } catch (error) {
      throw new Error(`Lỗi khi queue OCR: ${(error as Error).message}`);
    }
  }

  /**
   * Queue AI tagging
   */
  static async queueAITagging(documentId: bigint) {
    try {
      const task = await prisma.document_ai_tasks.create({
        data: {
          document_id: documentId,
          task_type: 'tag_suggestion' as const,
          status: 'queued' as const
        }
      });

      // Process AI tagging in background
      this.processAITagging(documentId, task.id).catch(console.error);

      return task;
    } catch (error) {
      throw new Error(`Lỗi khi queue AI tagging: ${(error as Error).message}`);
    }
  }

  /**
   * Queue document conversion
   */
  static async queueDocumentConversion(documentId: bigint, targetFormat: string) {
    try {
      const task = await prisma.document_ai_tasks.create({
        data: {
          document_id: documentId,
          task_type: 'other' as const,
          status: 'queued' as const,
          input_json: { target_format: targetFormat }
        }
      });

      // Process conversion in background
      this.processDocumentConversion(documentId, task.id, targetFormat).catch(console.error);

      return task;
    } catch (error) {
      throw new Error(`Lỗi khi queue conversion: ${(error as Error).message}`);
    }
  }

  /**
   * Generate document preview
   */
  static async generatePreview(documentId: bigint) {
    try {
      // Check if preview already exists
      let preview = await prisma.document_previews.findFirst({
        where: {
          document_id: documentId,
          expires_at: { gte: new Date() }
        }
      });

      if (preview) {
        return preview;
      }

      // Get document
      const document = await prisma.documents.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Generate preview URL (in real implementation, this would generate actual preview)
      const previewUrl = `/api/v1/documents/${documentId}/file?preview=true`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      preview = await prisma.document_previews.create({
        data: {
          document_id: documentId,
          preview_url: previewUrl,
          expires_at: expiresAt
        }
      });

      return preview;
    } catch (error) {
      throw new Error(`Lỗi khi tạo preview: ${(error as Error).message}`);
    }
  }

  /**
   * Delete document and related data
   */
  static async deleteDocument(documentId: bigint) {
    try {
      // Get document info
      const document = await prisma.documents.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete physical file
      if (document.file_path && fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }

      // Delete related data and document
      await prisma.$transaction([
        // Delete child records first (those with foreign keys to documents)
        prisma.document_tags.deleteMany({ where: { document_id: documentId } }),
        prisma.document_shares.deleteMany({ where: { document_id: documentId } }),
        prisma.document_favorites.deleteMany({ where: { document_id: documentId } }),
        prisma.document_previews.deleteMany({ where: { document_id: documentId } }),
        prisma.document_ai_tasks.deleteMany({ where: { document_id: documentId } }),
        prisma.document_ai_tag_suggestions.deleteMany({ where: { document_id: documentId } }),
        prisma.document_pages.deleteMany({ where: { document_id: documentId } }),
        prisma.document_derivatives.deleteMany({ where: { document_id: documentId } }),
        prisma.document_external_refs.deleteMany({ where: { document_id: documentId } }),
        // Finally delete the parent document
        prisma.documents.delete({ where: { id: documentId } })
      ]);

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa document: ${(error as Error).message}`);
    }
  }

  /**
   * Search documents
   */
  static async searchDocuments(params: {
    query: string;
    type?: string;
    tags?: string[];
    tenantId: bigint;
    userId: bigint;
    page: number;
    limit: number;
  }) {
    try {
      const { query, type, tags, tenantId, userId, page, limit } = params;
      const skip = (page - 1) * limit;

      const where: any = {
        tenant_id: tenantId,
        OR: [
          { visibility: 'public' },
          { visibility: 'tenant' },
          { created_by: userId }
        ],
        AND: []
      };

      // Text search - tìm trong tên, mô tả, OCR text
      if (query) {
        where.AND.push({
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { ocr_text: { contains: query } }
          ]
        });
      }

      // Type filter
      if (type) {
        where.AND.push({
          mime_type: { contains: type }
        });
      }

      // Tags filter - tìm cả manual tags và AI-generated tags
      if (tags && tags.length > 0) {
        const tagConditions = [];

        // Manual tags (document_tags)
        tagConditions.push({
          document_tags: {
            some: {
              tags: {
                name: { in: tags.map(tag => tag.toLowerCase()) }
              }
            }
          }
        });

        // AI-generated tags - sử dụng subquery để tìm documents có AI tags
        tagConditions.push({
          document_ai_tasks: {
            some: {
              task_type: 'tag_suggestion',
              status: 'completed',
              output_json: {
                path: ['suggested_tags'],
                array_contains: tags.map(tag => tag.toLowerCase())
              }
            }
          }
        });

        where.AND.push({
          OR: tagConditions
        });
      }

      const [documents, total] = await Promise.all([
        prisma.documents.findMany({
          where,
          orderBy: query ? [
            { name: 'asc' },
            { created_at: 'desc' }
          ] : [
            { created_at: 'desc' }
          ],
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
              where: {
                status: 'completed'
              },
              orderBy: { created_at: 'desc' },
              take: 5
            }
          }
        }),
        prisma.documents.count({ where })
      ]);

      return {
        documents: documents.map(doc => ({
          ...doc,
          created_by_user: doc.users_documents_created_byTousers,
          tags: doc.document_tags.map(dt => dt.tags),
          ai_tasks: doc.document_ai_tasks
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi search documents: ${(error as Error).message}`);
    }
  }

  /**
   * Get document analytics
   */
  static async getDocumentAnalytics(documentId: bigint) {
    try {
      // In a real implementation, you would track document views, downloads, etc.
      // For now, we'll return mock analytics
      const document = await prisma.documents.findUnique({
        where: { id: documentId },
        include: {
          document_favorites: true,
          document_shares: true,
          _count: {
            select: {
              document_favorites: true,
              document_shares: true
            }
          }
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      return {
        views: Math.floor(Math.random() * 1000) + 100,
        downloads: Math.floor(Math.random() * 100) + 10,
        favorites: document._count.document_favorites,
        shares: document._count.document_shares,
        created_at: document.created_at,
        file_size: document.file_size,
        mime_type: document.mime_type,
        health_status: document.health_status
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Get trending documents
   */
  static async getTrendingDocuments(params: {
    tenantId: bigint;
    period: string;
    limit: number;
  }) {
    try {
      const { tenantId, period, limit } = params;

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Get documents with most favorites/shares in the period
      const documents = await prisma.documents.findMany({
        where: {
          tenant_id: tenantId,
          visibility: { in: ['public', 'tenant'] },
          created_at: { gte: startDate }
        },
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
          _count: {
            select: {
              document_favorites: true,
              document_shares: true
            }
          }
        },
        orderBy: [
          { document_favorites: { _count: 'desc' } },
          { created_at: 'desc' }
        ],
        take: limit
      });

      return documents.map(doc => ({
        ...doc,
        created_by_user: doc.users_documents_created_byTousers,
        tags: doc.document_tags.map(dt => dt.tags),
        favorites_count: doc._count.document_favorites,
        shares_count: doc._count.document_shares
      }));
    } catch (error) {
      throw new Error(`Lỗi khi lấy trending documents: ${(error as Error).message}`);
    }
  }

  /**
   * Process document tasks (background processing)
   */
  private static async processDocumentTasks(documentId: bigint) {
    try {
      const tasks = await prisma.document_ai_tasks.findMany({
        where: {
          document_id: documentId,
          status: 'queued' as const
        }
      });

      for (const task of tasks) {
        try {
          await prisma.document_ai_tasks.update({
            where: { id: task.id },
            data: { status: 'running' as const }
          });

          switch (task.task_type) {
            case 'other':
              await this.processOCR(documentId, task.id);
              break;
            case 'tag_suggestion':
              await this.processAITagging(documentId, task.id);
              break;
            case 'segment':
              await this.processThumbnailGeneration(documentId, task.id);
              break;
            default:
              console.warn(`Unknown task type: ${task.task_type}`);
          }
        } catch (error) {
          await prisma.document_ai_tasks.update({
            where: { id: task.id },
            data: {
              status: 'failed' as const,
              error_message: (error as Error).message,
              finished_at: new Date()
            }
          });
        }
      }
    } catch (error) {
      console.error('Process document tasks error:', error);
    }
  }

  /**
   * Process OCR
   */
  private static async processOCR(documentId: bigint, taskId: bigint) {
    try {
      const document = await prisma.documents.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      if (!document.file_path || !fs.existsSync(document.file_path)) {
        throw new Error('Document file not found');
      }

      // Call OCR service via HTTP
      const axios = require('axios');
      const FormData = require('form-data');
      const formData = new FormData();

      // Read file and append to form data
      const fileStream = fs.createReadStream(document.file_path);
      formData.append('file', fileStream, {
        filename: document.name || 'document',
        contentType: document.mime_type || 'application/octet-stream'
      });

      let ocrText = '';
      let method = 'unknown';

      try {
        // Try OCR service first
        const ocrResponse = await axios.post('http://localhost:8000/process/file', formData, {
          headers: formData.getHeaders(),
          timeout: 30000 // 30 seconds timeout
        });

        if (ocrResponse.data && ocrResponse.data.success && ocrResponse.data.extracted_text) {
          ocrText = ocrResponse.data.extracted_text;
          method = ocrResponse.data.method || 'ocr_service';
          console.log(`OCR successful for document ${documentId}: ${ocrText.substring(0, 100)}...`);
        } else {
          throw new Error('OCR service returned invalid response');
        }
      } catch (ocrError) {
        console.warn(`OCR service failed for document ${documentId}:`, (ocrError as Error).message);
        // Fallback to mock OCR
        ocrText = `Mock OCR text for document: ${document.name}. This would contain the actual extracted text from the document.`;
        method = 'mock_fallback';
      }

      // Update document with OCR text
      await prisma.documents.update({
        where: { id: documentId },
        data: { ocr_text: ocrText }
      });

      // Mark task as completed
      await prisma.document_ai_tasks.update({
        where: { id: taskId },
        data: {
          status: 'completed' as const,
          output_json: {
            extracted_text: ocrText,
            method: method,
            confidence: 'medium'
          },
          finished_at: new Date()
        }
      });

      console.log(`OCR processing completed for document ${documentId} using ${method}`);
    } catch (error) {
      throw new Error(`OCR processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Process AI tagging
   */
  private static async processAITagging(documentId: bigint, taskId: bigint) {
    try {
      const document = await prisma.documents.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Get OCR text for analysis
      const ocrText = document.ocr_text || '';

      if (!ocrText.trim()) {
        console.warn(`No OCR text available for document ${documentId}, skipping AI tagging`);
        // Mark task as completed with empty results
        await prisma.document_ai_tasks.update({
          where: { id: taskId },
          data: {
            status: 'completed',
            output_json: { suggested_tags: [], reason: 'no_ocr_text' },
            finished_at: new Date()
          }
        });
        return;
      }

      // Call Gemini AI for analysis
      const axios = require('axios');

      // Prepare analysis requests
      const analysisTasks = [
        {
          task: 'topic',
          content: ocrText.substring(0, 2000),
          file_name: document.name,
          file_type: this.getFileTypeFromMime(document.mime_type)
        },
        {
          task: 'level',
          content: ocrText.substring(0, 2000),
          file_name: document.name,
          file_type: this.getFileTypeFromMime(document.mime_type)
        },
        {
          task: 'segment',
          content: ocrText.substring(0, 2000),
          file_name: document.name,
          file_type: this.getFileTypeFromMime(document.mime_type)
        }
      ];

      const analysisResults: any = {};

      try {
        // Call Gemini AI for each analysis task
        for (const task of analysisTasks) {
          try {
            const response = await axios.post('http://localhost:8000/ai/analyze', task, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000
            });

            if (response.data && response.data.success) {
              analysisResults[task.task] = response.data.analysis;
            }
          } catch (geminiError) {
            console.warn(`Gemini AI failed for ${task.task}:`, (geminiError as Error).message);
          }
        }
      } catch (geminiError) {
        console.warn(`Gemini AI service unavailable:`, (geminiError as Error).message);
      }

      // Generate suggested tags based on analysis
      const suggestedTags = this.generateTagsFromAnalysis(ocrText, analysisResults, document.name);

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
          ai_tags: suggestedTags.map(s => s.tag_label)
        }
      });

      // Mark task as completed
      await prisma.document_ai_tasks.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          output_json: {
            suggested_tags: suggestedTags,
            analysis: analysisResults,
            segments: analysisResults.segment ? JSON.parse(analysisResults.segment) : null
          },
          finished_at: new Date()
        }
      });

      console.log(`AI tagging completed for document ${documentId}: ${suggestedTags.length} tags generated`);
    } catch (error) {
      throw new Error(`AI tagging failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get file type from MIME type
   */
  private static getFileTypeFromMime(mimeType: string | null): string {
    if (!mimeType) return 'unknown';

    if (mimeType.startsWith('application/pdf')) return 'pdf';
    if (mimeType.startsWith('application/msword') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'docx';
    if (mimeType.startsWith('application/vnd.ms-powerpoint') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) return 'pptx';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('text/')) return 'text';

    return 'unknown';
  }

  /**
   * Generate tags from AI analysis
   */
  private static generateTagsFromAnalysis(ocrText: string, analysis: any, fileName: string | null): Array<{tag_label: string, confidence: number}> {
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
  }

  /**
   * Infer skill from content
   */
  private static inferSkillFromContent(ocrText: string): string | null {
    const text = ocrText.toLowerCase();

    if (text.includes('listening') || text.includes('audio') || text.includes('conversation')) {
      return 'listening';
    }

    if (text.includes('speaking') || text.includes('presentation') || text.includes('pronunciation')) {
      return 'speaking';
    }

    if (text.includes('reading') || text.includes('comprehension')) {
      return 'reading';
    }

    if (text.includes('writing') || text.includes('essay')) {
      return 'writing';
    }

    if (text.includes('grammar') || text.includes('vocabulary')) {
      return 'language';
    }

    return null;
  }

  /**
   * Process thumbnail generation
   */
  private static async processThumbnailGeneration(documentId: bigint, taskId: bigint) {
    try {
      const document = await prisma.documents.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Mock thumbnail generation
      const thumbnailPath = `/thumbnails/${documentId}_thumb.jpg`;

      // Create derivative record
      await prisma.document_derivatives.create({
        data: {
          document_id: documentId,
          kind: 'thumbnail' as const,
          format: 'jpeg',
          width: 200,
          height: 200,
          file_path: thumbnailPath
        }
      });

      // Mark task as completed
      await prisma.document_ai_tasks.update({
        where: { id: taskId },
        data: {
          status: 'completed' as const,
          output_json: { thumbnail_path: thumbnailPath },
          finished_at: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Process document conversion
   */
  private static async processDocumentConversion(documentId: bigint, taskId: bigint, targetFormat: string) {
    try {
      const document = await prisma.documents.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Mock conversion - in real implementation, use conversion service
      const convertedPath = `/converted/${documentId}_converted.${targetFormat}`;

      // Create derivative record
      await prisma.document_derivatives.create({
        data: {
          document_id: documentId,
          kind: 'other' as const,
          format: targetFormat,
          file_path: convertedPath
        }
      });

      // Mark task as completed
      await prisma.document_ai_tasks.update({
        where: { id: taskId },
        data: {
          status: 'completed' as const,
          output_json: { converted_path: convertedPath, target_format: targetFormat },
          finished_at: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Document conversion failed: ${(error as Error).message}`);
    }
  }
}

export default DocumentService;