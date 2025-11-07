/**
 * File Upload Service
 * Handles file uploads for tenant branding (logos)
 *
 * MVP Implementation: Local file storage in /uploads directory
 * Future: Can be upgraded to cloud storage (Cloudinary, AWS S3)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../lib/core/logger';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export class UploadService {
  private uploadDir: string;
  private maxFileSizeMB: number;
  private allowedMimeTypes: string[];
  private baseUrl: string;

  constructor() {
    // Configuration from environment or defaults
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'logos');
    this.maxFileSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '2', 10);
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ];
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info({ uploadDir: this.uploadDir }, 'Created upload directory');
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: UploadedFile): void {
    // Check file size
    const maxSizeBytes = this.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds maximum of ${this.maxFileSizeMB}MB`);
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    // Check buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    return `logo-${timestamp}-${randomStr}${ext}`;
  }

  /**
   * Upload logo file
   * @param file - File object from multer
   * @param tenantId - Tenant ID for organization
   * @returns Upload result with public URL
   */
  async uploadLogo(file: UploadedFile, tenantId: string): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const filename = this.generateFilename(file.originalname);
      const filepath = path.join(this.uploadDir, filename);

      // Write file to disk
      await fs.promises.writeFile(filepath, file.buffer);

      logger.info(
        {
          tenantId,
          filename,
          size: file.size,
          mimetype: file.mimetype,
        },
        'Logo uploaded successfully'
      );

      // Return result with public URL
      return {
        url: `${this.baseUrl}/uploads/logos/${filename}`,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Error uploading logo');
      throw error;
    }
  }

  /**
   * Delete logo file
   * @param filename - Filename to delete
   */
  async deleteLogo(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        logger.info({ filename }, 'Logo deleted successfully');
      }
    } catch (error) {
      logger.error({ error, filename }, 'Error deleting logo');
      throw error;
    }
  }

  /**
   * Get upload directory path (for serving static files)
   */
  getUploadDir(): string {
    return this.uploadDir;
  }
}

// Singleton instance
export const uploadService = new UploadService();
