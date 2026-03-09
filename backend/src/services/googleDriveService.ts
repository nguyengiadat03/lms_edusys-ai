import { google } from 'googleapis';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

export class GoogleDriveService {
  private drive: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Extract file ID from Google Drive URL
   */
  extractFileId(driveUrl: string): string | null {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /\/open\?id=([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = driveUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get file metadata from Google Drive
   */
  async getFileMetadata(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,modifiedTime,webContentLink,webViewLink'
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata from Google Drive');
    }
  }

  /**
   * Download file from Google Drive
   */
  async downloadFile(fileId: string, localPath: string): Promise<{ size: number; mimeType: string }> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      const writer = require('fs').createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve({
            size: parseInt(response.headers['content-length'] || '0'),
            mimeType: response.headers['content-type'] || 'application/octet-stream'
          });
        });
        writer.on('error', reject);
      });
    } catch (error) {
      logger.error('Error downloading file from Drive:', error);
      throw new Error('Failed to download file from Google Drive');
    }
  }

  /**
   * Check if file type is supported
   */
  isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-powerpoint', // .ppt
      'audio/mpeg', // .mp3
      'audio/mp4', // .m4a
      'video/mp4', // .mp4
      'audio/wav',
      'audio/ogg',
      'text/plain',
      'text/markdown',
      'text/html'
    ];

    return supportedTypes.includes(mimeType);
  }

  /**
   * Get file extension from MIME type
   */
  getFileExtension(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/msword': '.doc',
      'application/vnd.ms-powerpoint': '.ppt',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'video/mp4': '.mp4',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'text/plain': '.txt',
      'text/markdown': '.md',
      'text/html': '.html'
    };

    return mimeToExt[mimeType] || '.bin';
  }
}

// Alternative implementation using direct download links (for public files)
export class GoogleDriveDirectService {
  /**
   * Extract file ID from Google Drive URL
   */
  extractFileId(driveUrl: string): string | null {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /\/open\?id=([a-zA-Z0-9-_]+)/,
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/presentation\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = driveUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Download file using direct download link
   */
  async downloadFile(driveUrl: string, localPath: string): Promise<{ size: number; mimeType: string; fileName: string }> {
    try {
      const fileId = this.extractFileId(driveUrl);
      if (!fileId) {
        throw new Error('Invalid Google Drive URL');
      }

      // Try multiple download methods for different file types
      let downloadUrl: string;
      let response: any;

      // For Google Docs files (Docs, Sheets, Slides), use export URLs
      if (driveUrl.includes('/document/') || driveUrl.includes('/spreadsheets/') || driveUrl.includes('/presentation/')) {
        // Convert to export URLs for Google Docs files
        if (driveUrl.includes('/document/')) {
          downloadUrl = `https://docs.google.com/document/d/${fileId}/export?format=docx`;
        } else if (driveUrl.includes('/spreadsheets/')) {
          downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
        } else if (driveUrl.includes('/presentation/')) {
          downloadUrl = `https://docs.google.com/presentation/d/${fileId}/export?format=pptx`;
        } else {
          downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      } else {
        // For regular files, use direct download
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }

      try {
        response = await axios.get(downloadUrl, {
          responseType: 'stream',
          timeout: 60000, // 60 seconds timeout
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });
      } catch (firstAttemptError) {
        // If first attempt fails, try alternative method
        logger.warn('First download attempt failed, trying alternative method:', firstAttemptError);

        downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;

        response = await axios.get(downloadUrl, {
          responseType: 'stream',
          timeout: 60000,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });
      }

      const writer = require('fs').createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        let downloadedSize = 0;

        response.data.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
        });

        writer.on('finish', () => {
          const contentDisposition = response.headers['content-disposition'];
          const contentType = response.headers['content-type'] || response.headers['Content-Type'];
          let fileName = `drive_file_${fileId}`;

          if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
              fileName = match[1].replace(/['"]/g, '');
            }
          }

          // If no filename from headers, generate based on file type
          if (fileName === `drive_file_${fileId}` && contentType) {
            const ext = this.getFileExtension(contentType);
            fileName = `drive_file_${fileId}${ext}`;
          }

          resolve({
            size: downloadedSize || parseInt(response.headers['content-length'] || '0'),
            mimeType: contentType || 'application/octet-stream',
            fileName: fileName
          });
        });

        writer.on('error', (error: Error) => {
          logger.error('File write error:', error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Error downloading file from Drive:', error);
      throw new Error(`Failed to download file from Google Drive: ${(error as Error).message}`);
    }
  }

  /**
   * Check if file type is supported
   */
  isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-powerpoint', // .ppt
      'audio/mpeg', // .mp3
      'audio/mp4', // .m4a
      'video/mp4', // .mp4
      'audio/wav',
      'audio/ogg',
      'text/plain',
      'text/markdown',
      'text/html'
    ];

    return supportedTypes.includes(mimeType);
  }

  /**
   * Get file extension from MIME type
   */
  getFileExtension(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'video/mp4': '.mp4',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg'
    };

    return mimeToExt[mimeType] || '.bin';
  }
}