import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// OCR Libraries (conditional imports)
let pdfParse: any = null;
let tesseract: any = null;
let mammoth: any = null;

try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not available');
}

try {
  tesseract = require('tesseract.js');
} catch (e) {
  console.warn('tesseract.js not available');
}

try {
  mammoth = require('mammoth');
} catch (e) {
  console.warn('mammoth not available');
}

// OCR Model initialization (following ocr_service.py pattern)
let easyocrModel: any = null;
let pytesseract: any = null;
let genaiModel: any = null;
let whisperModel: any = null;

// Library availability flags (following ocr_service.py)
let EASYOCR_AVAILABLE = false;
let PYMUPDF_AVAILABLE = false;
let PPTX_AVAILABLE = false;
let DOCX_AVAILABLE = false;
let GEMINI_AVAILABLE = false;
let WHISPER_AVAILABLE = false;

async function initOCRModels() {
  try {
    // Check library availability (following ocr_service.py pattern)
    try {
      const pdfParse = require('pdf-parse');
      PYMUPDF_AVAILABLE = true;
      console.log('PyMuPDF (pdf-parse) available');
    } catch (e) {
      console.warn('pdf-parse not available');
      PYMUPDF_AVAILABLE = false;
    }

    try {
      const tesseract = require('tesseract.js');
      EASYOCR_AVAILABLE = true;
      console.log('Tesseract.js (EasyOCR alternative) available');
    } catch (e) {
      console.warn('tesseract.js not available');
      EASYOCR_AVAILABLE = false;
    }

    try {
      const mammoth = require('mammoth');
      DOCX_AVAILABLE = true;
      console.log('Mammoth (DOCX) available');
    } catch (e) {
      console.warn('mammoth not available');
      DOCX_AVAILABLE = false;
    }

    // Initialize Gemini AI (following ocr_service.py pattern)
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

      if (process.env.GOOGLE_AI_API_KEY) {
        genaiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        GEMINI_AVAILABLE = true;
        console.log('Gemini AI initialized successfully');
      } else {
        console.warn('GOOGLE_AI_API_KEY not found');
        GEMINI_AVAILABLE = false;
      }
    } catch (e) {
      console.warn('Gemini AI initialization failed:', e);
      GEMINI_AVAILABLE = false;
    }

    console.log(`Library check complete: EasyOCR=${EASYOCR_AVAILABLE}, PyMuPDF=${PYMUPDF_AVAILABLE}, DOCX=${DOCX_AVAILABLE}, Gemini=${GEMINI_AVAILABLE}`);

  } catch (error) {
    console.warn('Failed to initialize OCR models:', error);
  }
}

// Initialize models on startup
initOCRModels();

export interface OCRResult {
  success: boolean;
  extracted_text: string;
  method: string;
  confidence: string;
  error?: string;
}

export interface AIResult {
  success: boolean;
  summary: string;
  segments: string[];
  level: string;
  topic: string;
  suggested_tags: Array<{tag_label: string, confidence: number}>;
  processing_time: string;
  error?: string;
}

export interface AIAnalysisResult {
  success: boolean;
  summary: string;
  segments: string[];
  level: string;
  topic: string;
  suggested_tags: Array<{tag_label: string, confidence: number}>;
  processing_time: string;
  error?: string;
}

// Memory management utilities (simplified for Node.js)
function getMemoryUsage(): number {
  try {
    const memUsage = process.memoryUsage();
    return (memUsage.heapUsed / memUsage.heapTotal) * 100;
  } catch {
    return 0.0;
  }
}

function forceGc(): void {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}

function logMemoryStatus(message: string = ""): void {
  const mem = getMemoryUsage();
  console.log(`Memory status ${message}: ${mem.toFixed(1)}%`);
}

export class OCRService {
  /**
   * Process file and extract text using appropriate method
   */
  async processFile(filePath: string, mimeType: string, fileName: string): Promise<OCRResult> {
    return this.processFileWithOCR(filePath, mimeType, fileName);
  }

  /**
   * Process file with OCR service integration (optimized for memory and performance)
   */
  async processFileWithOCR(filePath: string, mimeType: string, fileName: string): Promise<OCRResult> {
    try {
      const fileExtension = path.extname(fileName).toLowerCase();

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          extracted_text: '',
          method: 'error',
          confidence: 'none',
          error: 'File not found'
        };
      }

      // Route to appropriate processing method
      if (mimeType.includes('pdf') || fileExtension === '.pdf') {
        return await this.processPDF(filePath);
      } else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword') || fileExtension === '.docx' || fileExtension === '.doc') {
        return await this.processDOCX(filePath);
      } else if (mimeType.includes('presentationml') || mimeType.includes('powerpoint') || fileExtension === '.pptx' || fileExtension === '.ppt') {
        return await this.processPPTX(filePath);
      } else if (mimeType.includes('presentationml') || mimeType.includes('powerpoint') || fileExtension === '.pptx' || fileExtension === '.ppt') {
        return await this.processPPTX(filePath);
      } else if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(fileExtension)) {
        return await this.processImage(filePath);
      } else if (mimeType.startsWith('text/') || fileExtension === '.txt' || fileExtension === '.md') {
        return await this.processText(filePath);
      } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/') || ['.mp3', '.wav', '.mp4', '.avi'].includes(fileExtension)) {
        return await this.processAudioVideo(filePath);
      } else {
        return {
          success: false,
          extracted_text: '',
          method: 'unsupported',
          confidence: 'none',
          error: `Unsupported file type: ${mimeType}`
        };
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        success: false,
        extracted_text: '',
        method: 'error',
        confidence: 'none',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process PDF files (following ocr_service.py pattern)
   */
  private async processPDF(filePath: string): Promise<OCRResult> {
    try {
      // Check if PyMuPDF (pdf-parse) is available
      if (!PYMUPDF_AVAILABLE) {
        return {
          success: false,
          extracted_text: '',
          method: 'pdf-no-tools',
          confidence: 'none',
          error: 'PyMuPDF not available for PDF processing'
        };
      }

      // Use pdf-parse (equivalent to PyMuPDF in Python)
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      if (data.text && data.text.trim().length > 0) {
        const cleanedText = this.cleanText(data.text);
        return {
          success: true,
          extracted_text: cleanedText,
          method: 'pdf-parse',
          confidence: cleanedText.length > 100 ? 'high' : 'medium'
        };
      }

      return {
        success: false,
        extracted_text: '',
        method: 'pdf-empty',
        confidence: 'none',
        error: 'PDF contains no extractable text'
      };

    } catch (error) {
      console.warn('PDF processing failed:', error);
      return {
        success: false,
        extracted_text: '',
        method: 'pdf-error',
        confidence: 'none',
        error: 'PDF processing failed'
      };
    }
  }

  /**
   * Process DOCX files (following ocr_service.py pattern)
   */
  private async processDOCX(filePath: string): Promise<OCRResult> {
    try {
      // Check if DOCX processing is available
      if (!DOCX_AVAILABLE) {
        return {
          success: false,
          extracted_text: '',
          method: 'docx-no-tools',
          confidence: 'none',
          error: 'DOCX processing tools not available'
        };
      }

      // Use mammoth (equivalent to python-docx in Python)
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;

      if (text && text.trim().length > 0) {
        const cleanedText = this.cleanText(text);
        return {
          success: true,
          extracted_text: cleanedText,
          method: 'mammoth',
          confidence: 'high'
        };
      }

      return {
        success: false,
        extracted_text: '',
        method: 'docx-empty',
        confidence: 'none',
        error: 'DOCX contains no extractable text'
      };
    } catch (error) {
      console.warn('DOCX processing failed:', error);
      return {
        success: false,
        extracted_text: '',
        method: 'docx-error',
        confidence: 'none',
        error: 'DOCX processing failed'
      };
    }
  }

  /**
   * Process PPTX files (following ocr_service.py pattern)
   */
  private async processPPTX(filePath: string): Promise<OCRResult> {
    try {
      // Check if PPTX processing is available
      if (!PPTX_AVAILABLE) {
        return {
          success: false,
          extracted_text: '',
          method: 'pptx-no-tools',
          confidence: 'none',
          error: 'PPTX processing tools not available'
        };
      }

      // Use pptx library (equivalent to python-pptx in Python)
      const PptxGenJS = require('pptxgenjs');
      const pptx = new PptxGenJS();

      // Load and extract text from slides
      await pptx.load(filePath);
      let extractedText = '';

      for (let i = 0; i < pptx.slides.length; i++) {
        const slide = pptx.slides[i];
        extractedText += `\n--- Slide ${i + 1} ---\n`;

        // Extract text from slide elements
        slide.elements.forEach((element: any) => {
          if (element.text) {
            extractedText += element.text + '\n';
          }
        });
      }

      if (extractedText.trim().length > 0) {
        const cleanedText = this.cleanText(extractedText);
        return {
          success: true,
          extracted_text: cleanedText,
          method: 'pptxgenjs',
          confidence: 'high'
        };
      }

      return {
        success: false,
        extracted_text: '',
        method: 'pptx-empty',
        confidence: 'none',
        error: 'PPTX contains no extractable text'
      };
    } catch (error) {
      console.warn('PPTX processing failed:', error);
      return {
        success: false,
        extracted_text: '',
        method: 'pptx-error',
        confidence: 'none',
        error: 'PPTX processing failed'
      };
    }
  }

  /**
   * Process image files with OCR
   */
  private async processImage(filePath: string): Promise<OCRResult> {
    try {
      const { createWorker } = await import('tesseract.js');

      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();

      return {
        success: true,
        extracted_text: this.cleanText(text),
        method: 'tesseract',
        confidence: text.length > 10 ? 'medium' : 'low'
      };
    } catch (error) {
      console.warn('Image OCR failed:', error);
      return {
        success: false,
        extracted_text: '',
        method: 'ocr-error',
        confidence: 'none',
        error: 'Image OCR failed'
      };
    }
  }

  /**
   * Process text files
   */
  private async processText(filePath: string): Promise<OCRResult> {
    try {
      const text = fs.readFileSync(filePath, 'utf-8');

      return {
        success: true,
        extracted_text: this.cleanText(text),
        method: 'text-read',
        confidence: 'high'
      };
    } catch (error) {
      console.warn('Text processing failed:', error);
      return {
        success: false,
        extracted_text: '',
        method: 'text-error',
        confidence: 'none',
        error: 'Text file processing failed'
      };
    }
  }

  /**
   * Process audio/video files (placeholder for future implementation)
   */
  private async processAudioVideo(filePath: string): Promise<OCRResult> {
    try {
      // For audio/video, we could integrate with speech-to-text services
      // For now, return basic info
      const fileName = path.basename(filePath);
      const text = `Media file: ${fileName}\n\n[Audio/Video transcription not fully implemented - requires speech-to-text service]`;

      return {
        success: true,
        extracted_text: text,
        method: 'media-basic',
        confidence: 'low'
      };
    } catch (error) {
      console.warn('Audio/Video processing failed:', error);
      return {
        success: false,
        extracted_text: '',
        method: 'media-error',
        confidence: 'none',
        error: 'Audio/Video processing failed'
      };
    }
  }


  /**
   * Process file with OCR and AI analysis using integrated Node.js service
   * Based on ocr_service.py logic with memory management and chunking
   */
  async processFileWithAI(filePath: string, mimeType: string, fileName: string): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      // Check memory before processing
      const memBefore = getMemoryUsage();
      if (memBefore > 80) {
        console.log(`High memory usage (${memBefore.toFixed(1)}%), forcing GC before OCR processing`);
        forceGc();
      }

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          summary: '',
          segments: [],
          level: '',
          topic: '',
          suggested_tags: [],
          processing_time: '0.0s',
          error: 'File not found'
        };
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      // Validate file size (50MB limit)
      const MAX_FILE_SIZE_MB = 50;
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return {
          success: false,
          summary: '',
          segments: [],
          level: '',
          topic: '',
          suggested_tags: [],
          processing_time: '0.0s',
          error: `File too large: ${fileSizeMB.toFixed(1)}MB (max ${MAX_FILE_SIZE_MB}MB)`
        };
      }

      console.log(`Starting OCR+AI processing for ${fileName} (${fileSizeMB.toFixed(1)}MB)`);

      // Step 1: Extract text using OCR
      const ocrResult = await this.processFileWithOCR(filePath, mimeType, fileName);

      if (!ocrResult.success || !ocrResult.extracted_text) {
        return {
          success: false,
          summary: '',
          segments: [],
          level: '',
          topic: '',
          suggested_tags: [],
          processing_time: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
          error: ocrResult.error || 'OCR extraction failed'
        };
      }

      const extractedText = ocrResult.extracted_text;
      console.log(`OCR completed, extracted ${extractedText.length} characters`);

      // Step 2: Process with AI (following ocr_service.py pattern)
      const aiResult = await this.processTextWithAI(extractedText, fileName);

      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

      // Force GC after processing to free memory
      forceGc();
      const memAfter = getMemoryUsage();
      console.log(`OCR+AI processing completed in ${processingTime}, memory: ${memBefore.toFixed(1)}% -> ${memAfter.toFixed(1)}%`);

      return {
        success: true,
        summary: aiResult.summary,
        segments: aiResult.segments,
        level: aiResult.level,
        topic: aiResult.topic,
        suggested_tags: aiResult.suggested_tags,
        processing_time: processingTime
      };

    } catch (error: any) {
      const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
      console.error(`OCR+AI processing failed after ${processingTime}:`, error.message);

      // Force GC on error to free memory
      forceGc();

      return {
        success: false,
        summary: '',
        segments: [],
        level: '',
        topic: '',
        suggested_tags: [],
        processing_time: processingTime,
        error: error.message || 'OCR+AI processing failed'
      };
    }
  }

  /**
   * Process extracted text with AI analysis (following ocr_service.py pattern)
   */
  private async processTextWithAI(text: string, fileName: string): Promise<{
    summary: string;
    segments: string[];
    level: string;
    topic: string;
    suggested_tags: Array<{tag_label: string, confidence: number}>;
  }> {
    try {
      // Chunk text if too long (following ocr_service.py pattern)
      const MAX_CHUNK_SIZE = 30000; // ~30KB chunks
      const chunks = this.chunkText(text, MAX_CHUNK_SIZE);

      console.log(`Processing ${chunks.length} text chunks with AI`);

      // Process chunks concurrently (like ocr_service.py)
      const chunkPromises = chunks.map(async (chunk, index) => {
        try {
          return await this.analyzeTextChunk(chunk, index, chunks.length);
        } catch (error) {
          console.warn(`Chunk ${index} analysis failed:`, error);
          return null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      const validResults = chunkResults.filter(result => result !== null);

      if (validResults.length === 0) {
        throw new Error('All AI analysis chunks failed');
      }

      // Combine results (following ocr_service.py pattern)
      return this.combineAnalysisResults(validResults);

    } catch (error) {
      console.error('AI text processing failed:', error);
      // Return basic fallback
      return {
        summary: `Document: ${fileName} - ${text.substring(0, 200)}...`,
        segments: ['Document content'],
        level: 'B1',
        topic: 'General',
        suggested_tags: [{ tag_label: 'document', confidence: 0.5 }]
      };
    }
  }

  /**
   * Analyze a single text chunk with AI
   */
  private async analyzeTextChunk(chunk: string, index: number, total: number): Promise<any> {
    const prompt = `Analyze this document text chunk ${index + 1}/${total}. Provide:
1. Brief summary (2-3 sentences)
2. Content segments (3-5 main sections)
3. Difficulty level (A1, A2, B1, B2, C1, C2)
4. Main topic/subject
5. Suggested tags (5-8 relevant tags with confidence scores)

Text:
${chunk}

Return as JSON with keys: summary, segments, level, topic, suggested_tags`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid AI response format');
    } catch (error) {
      console.warn(`AI analysis failed for chunk ${index}:`, error);
      throw error;
    }
  }

  /**
   * Combine analysis results from multiple chunks
   */
  private combineAnalysisResults(results: any[]): {
    summary: string;
    segments: string[];
    level: string;
    topic: string;
    suggested_tags: Array<{tag_label: string, confidence: number}>;
  } {
    // Take the first result as primary (following ocr_service.py pattern)
    const primary = results[0];

    // Combine segments from all chunks
    const allSegments = results.flatMap(r => r.segments || []);
    const uniqueSegments = [...new Set(allSegments)].slice(0, 10); // Max 10 segments

    // Combine and deduplicate tags
    const allTags = results.flatMap(r => r.suggested_tags || []);
    const tagMap = new Map<string, number>();

    allTags.forEach(tag => {
      if (typeof tag === 'string') {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 0.5);
      } else if (tag && tag.tag_label) {
        tagMap.set(tag.tag_label, Math.max(tagMap.get(tag.tag_label) || 0, tag.confidence || 0.5));
      }
    });

    const combinedTags = Array.from(tagMap.entries())
      .map(([tag_label, confidence]) => ({ tag_label, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 tags

    return {
      summary: primary.summary || 'Document analysis completed',
      segments: uniqueSegments,
      level: primary.level || 'B1',
      topic: primary.topic || 'General',
      suggested_tags: combinedTags
    };
  }

  /**
   * Chunk text into smaller pieces for AI processing
   */
  private chunkText(text: string, maxChunkSize: number): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChunkSize;

      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);

        if (lastPeriod > start && lastPeriod > end - 1000) {
          end = lastPeriod + 1;
        } else if (lastNewline > start && lastNewline > end - 500) {
          end = lastNewline;
        }
      }

      chunks.push(text.substring(start, end));
      start = end;
    }

    return chunks;
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\n+/g, '\n')
      // Trim whitespace
      .trim();
  }
}


export const ocrService = new OCRService();

/**
 * Optimized OCR Service that integrates with the Python OCR service
 * Handles memory management and prevents crashes during file processing
 */
export class OptimizedOCRService {
  private readonly OCR_SERVICE_URL = 'http://localhost:8000/process/file';
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 120000; // 2 minutes

  /**
   * Process file with OCR and AI analysis using the optimized Python service
   */
  async processFileWithAI(
    filePath: string,
    mimeType: string,
    fileName: string
  ): Promise<AIResult> {
    try {
      console.log(`🔄 Starting optimized OCR+AI processing for: ${fileName}`);

      // Check if file exists
      if (!require('fs').existsSync(filePath)) {
        return {
          success: false,
          summary: '',
          segments: [],
          level: '',
          topic: '',
          suggested_tags: [],
          processing_time: '0s',
          error: 'File not found'
        };
      }

      // Create form data for the Python service
      const FormData = require('form-data');
      const fs = require('fs');
      const formData = new FormData();

      const fileStream = fs.createReadStream(filePath);
      formData.append('file', fileStream, {
        filename: fileName,
        contentType: mimeType || 'application/octet-stream'
      });

      // Call Python OCR service with retry logic
      let lastError: any = null;
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          console.log(`📡 OCR attempt ${attempt}/${this.MAX_RETRIES} for ${fileName}`);

          const axios = require('axios');
          const response = await axios.post(this.OCR_SERVICE_URL, formData, {
            headers: formData.getHeaders(),
            timeout: this.TIMEOUT_MS,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });

          if (response.data && response.data.success) {
            console.log(`✅ OCR+AI completed successfully in ${response.data.processing_time}`);

            return {
              success: true,
              summary: response.data.summary || '',
              segments: response.data.segments || [],
              level: response.data.level || '',
              topic: response.data.topic || '',
              suggested_tags: response.data.suggested_tags || [],
              processing_time: response.data.processing_time || '0s'
            };
          } else {
            throw new Error(response.data?.error || 'OCR service returned unsuccessful response');
          }

        } catch (error: any) {
          lastError = error;
          console.warn(`⚠️ OCR attempt ${attempt} failed:`, error.message);

          if (attempt < this.MAX_RETRIES) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      // All retries failed
      console.error(`❌ OCR+AI failed after ${this.MAX_RETRIES} attempts:`, lastError?.message);
      return {
        success: false,
        summary: '',
        segments: [],
        level: '',
        topic: '',
        suggested_tags: [],
        processing_time: '0s',
        error: `OCR processing failed: ${lastError?.message || 'Unknown error'}`
      };

    } catch (error: any) {
      console.error(`❌ Optimized OCR service error:`, error.message);
      return {
        success: false,
        summary: '',
        segments: [],
        level: '',
        topic: '',
        suggested_tags: [],
        processing_time: '0s',
        error: `Service error: ${error.message}`
      };
    }
  }
}

export const optimizedOCRService = new OptimizedOCRService();
