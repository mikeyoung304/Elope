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
  private logoUploadDir: string;
  private packagePhotoUploadDir: string;
  private maxFileSizeMB: number;
  private maxPackagePhotoSizeMB: number;
  private allowedMimeTypes: string[];
  private baseUrl: string;

  constructor() {
    // Configuration from environment or defaults
    this.logoUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'logos');
    this.packagePhotoUploadDir = path.join(process.cwd(), 'uploads', 'packages');
    this.maxFileSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '2', 10);
    this.maxPackagePhotoSizeMB = 5; // 5MB for package photos
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ];
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

    // Ensure upload directories exist
    this.ensureUploadDir(this.logoUploadDir);
    this.ensureUploadDir(this.packagePhotoUploadDir);
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info({ uploadDir: dir }, 'Created upload directory');
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: UploadedFile, maxSizeMB?: number): void {
    // Check file size
    const maxSize = maxSizeMB || this.maxFileSizeMB;
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds maximum of ${maxSize}MB`);
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
  private generateFilename(originalName: string, prefix: string = 'logo'): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    return `${prefix}-${timestamp}-${randomStr}${ext}`;
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
      const filename = this.generateFilename(file.originalname, 'logo');
      const filepath = path.join(this.logoUploadDir, filename);

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
   * Upload package photo
   * @param file - File object from multer
   * @param packageId - Package ID for organization
   * @returns Upload result with public URL
   */
  async uploadPackagePhoto(file: UploadedFile, packageId: string): Promise<UploadResult> {
    try {
      // Validate file with higher size limit
      this.validateFile(file, this.maxPackagePhotoSizeMB);

      // Generate unique filename
      const filename = this.generateFilename(file.originalname, 'package');
      const filepath = path.join(this.packagePhotoUploadDir, filename);

      // Write file to disk
      await fs.promises.writeFile(filepath, file.buffer);

      logger.info(
        {
          packageId,
          filename,
          size: file.size,
          mimetype: file.mimetype,
        },
        'Package photo uploaded successfully'
      );

      // Return result with public URL
      return {
        url: `${this.baseUrl}/uploads/packages/${filename}`,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error({ error, packageId }, 'Error uploading package photo');
      throw error;
    }
  }

  /**
   * Delete logo file
   * @param filename - Filename to delete
   */
  async deleteLogo(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.logoUploadDir, filename);

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
   * Delete package photo file
   * @param filename - Filename to delete
   */
  async deletePackagePhoto(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.packagePhotoUploadDir, filename);

      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        logger.info({ filename }, 'Package photo deleted successfully');
      }
    } catch (error) {
      logger.error({ error, filename }, 'Error deleting package photo');
      throw error;
    }
  }

  /**
   * Get logo upload directory path (for serving static files)
   */
  getLogoUploadDir(): string {
    return this.logoUploadDir;
  }

  /**
   * Get package photo upload directory path (for serving static files)
   */
  getPackagePhotoUploadDir(): string {
    return this.packagePhotoUploadDir;
  }
}

// Singleton instance
export const uploadService = new UploadService();
