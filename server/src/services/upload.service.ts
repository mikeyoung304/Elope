/**
 * File Upload Service
 * Handles file uploads for tenant branding (logos), package photos, and segment images
 *
 * Dual-mode storage:
 * - Mock mode (ADAPTERS_PRESET=mock): Local filesystem in /uploads directory
 * - Real mode (ADAPTERS_PRESET=real): Supabase Storage with tenant-scoped paths
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { fromBuffer as detectFileType } from 'file-type';
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
  private segmentImageUploadDir: string;
  private maxFileSizeMB: number;
  private maxPackagePhotoSizeMB: number;
  private allowedMimeTypes: string[];
  private baseUrl: string;
  private supabase: SupabaseClient | null = null;
  private isRealMode: boolean;

  constructor() {
    // Configuration from environment or defaults
    this.logoUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'logos');
    this.packagePhotoUploadDir = path.join(process.cwd(), 'uploads', 'packages');
    this.segmentImageUploadDir = path.join(process.cwd(), 'uploads', 'segments');
    this.maxFileSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '2', 10);
    this.maxPackagePhotoSizeMB = 5; // 5MB for package photos and segment images
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ];
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    // Use Supabase storage only when:
    // 1. ADAPTERS_PRESET=real AND SUPABASE_URL is configured, OR
    // 2. STORAGE_MODE=supabase is explicitly set
    // This allows integration tests to use real DB with local storage by not setting STORAGE_MODE
    this.isRealMode = process.env.STORAGE_MODE === 'supabase' ||
      (process.env.ADAPTERS_PRESET === 'real' && !!process.env.SUPABASE_URL && process.env.STORAGE_MODE !== 'local');

    // Only create local directories in mock mode
    if (!this.isRealMode) {
      this.ensureUploadDir(this.logoUploadDir);
      this.ensureUploadDir(this.packagePhotoUploadDir);
      this.ensureUploadDir(this.segmentImageUploadDir);
    }
  }

  /**
   * Lazily initialize Supabase client for real mode
   * Only called when actually needed to avoid startup errors in mock mode
   */
  private getSupabaseClient(): SupabaseClient {
    if (!this.supabase) {
      // Dynamic import to avoid requiring Supabase config in mock mode
      const { getSupabaseClient } = require('../config/database');
      this.supabase = getSupabaseClient();
      logger.info('UploadService: Supabase client initialized for storage');
    }
    if (!this.supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    return this.supabase;
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
   * Performs size, MIME type, and magic byte validation
   */
  private async validateFile(file: UploadedFile, maxSizeMB?: number): Promise<void> {
    // Check file size
    const maxSize = maxSizeMB || this.maxFileSizeMB;
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds maximum of ${maxSize}MB`);
    }

    // Check buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }

    // Check declared MIME type (basic filter)
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    // CRITICAL: Verify actual file content via magic bytes
    // This prevents attackers from uploading PHP shells disguised as images
    const detectedType = await detectFileType(file.buffer);

    // SVG files don't have magic bytes (they're XML text), so skip detection for them
    if (file.mimetype === 'image/svg+xml') {
      // For SVG, we verify it starts with valid XML/SVG content
      const content = file.buffer.toString('utf8', 0, 500).trim();
      const isSvg = content.startsWith('<?xml') || content.startsWith('<svg') ||
                    content.toLowerCase().includes('<svg');
      if (!isSvg) {
        logger.warn({ declaredType: file.mimetype, filename: file.originalname },
          'SECURITY: File claimed to be SVG but does not contain valid SVG content');
        throw new Error('File validation failed');
      }
      return;
    }

    if (!detectedType) {
      logger.warn({ declaredType: file.mimetype, filename: file.originalname },
        'Could not detect file type from magic bytes');
      throw new Error('Unable to verify file type. File may be corrupted.');
    }

    if (!this.allowedMimeTypes.includes(detectedType.mime)) {
      logger.warn({ declared: file.mimetype, detected: detectedType.mime, filename: file.originalname },
        'SECURITY: MIME type mismatch detected - possible spoofing attempt');
      throw new Error('File validation failed');
    }

    // Also verify the detected type matches the declared type
    // This prevents uploading PNG as JPEG etc. (defense in depth)
    // Note: image/jpg and image/jpeg are equivalent - normalize both to image/jpeg
    // The file-type library always returns 'image/jpeg' (never 'image/jpg')
    const normalizedDeclared = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
    const normalizedDetected = detectedType.mime; // file-type already normalizes to image/jpeg
    if (normalizedDetected !== normalizedDeclared) {
      logger.warn({ declared: file.mimetype, detected: detectedType.mime, filename: file.originalname },
        'SECURITY: MIME type mismatch detected - possible spoofing attempt');
      throw new Error('File validation failed');
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
   * Upload file to Supabase Storage (private bucket with signed URLs)
   * Files are organized by tenant: {tenantId}/{folder}/{filename}
   *
   * SECURITY: Uses private bucket + signed URLs to prevent cross-tenant data access.
   * Public URLs would allow anyone who guesses the path to access the image.
   */
  private async uploadToSupabase(
    tenantId: string,
    folder: 'logos' | 'packages' | 'segments',
    filename: string,
    file: UploadedFile
  ): Promise<UploadResult> {
    const supabase = this.getSupabaseClient();
    const storagePath = `${tenantId}/${folder}/${filename}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      logger.error({ tenantId, folder, error: error.message }, 'Supabase upload failed');
      throw new Error('Failed to upload image to storage');
    }

    // Generate signed URL with 1-year expiry for private bucket
    // This prevents cross-tenant data access - only users with the signed URL can view
    const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('images')
      .createSignedUrl(storagePath, ONE_YEAR_SECONDS);

    if (signedUrlError || !signedUrlData) {
      logger.error({ tenantId, folder, error: signedUrlError }, 'Failed to create signed URL');
      throw new Error('Failed to generate access URL');
    }

    logger.info(
      { tenantId, folder, filename, size: file.size },
      'File uploaded to Supabase Storage with signed URL'
    );

    return {
      url: signedUrlData.signedUrl,
      filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Upload logo file
   * @param file - File object from multer
   * @param tenantId - Tenant ID for organization
   * @returns Upload result with public URL
   */
  async uploadLogo(file: UploadedFile, tenantId: string): Promise<UploadResult> {
    try {
      // Validate file (includes magic byte detection)
      await this.validateFile(file);

      // Generate unique filename
      const filename = this.generateFilename(file.originalname, 'logo');

      // Use Supabase in real mode, filesystem in mock mode
      if (this.isRealMode) {
        return this.uploadToSupabase(tenantId, 'logos', filename, file);
      }

      // Mock mode: write to local filesystem
      const filepath = path.join(this.logoUploadDir, filename);
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
   * @param tenantId - Tenant ID for Supabase storage path (optional for backwards compatibility)
   * @returns Upload result with public URL
   */
  async uploadPackagePhoto(file: UploadedFile, packageId: string, tenantId?: string): Promise<UploadResult> {
    try {
      // Validate file with higher size limit (includes magic byte detection)
      await this.validateFile(file, this.maxPackagePhotoSizeMB);

      // Generate unique filename
      const filename = this.generateFilename(file.originalname, 'package');

      // Use Supabase in real mode (requires tenantId), filesystem in mock mode
      if (this.isRealMode && tenantId) {
        return this.uploadToSupabase(tenantId, 'packages', filename, file);
      }

      // Mock mode: write to local filesystem
      const filepath = path.join(this.packagePhotoUploadDir, filename);
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
   * Upload segment hero image
   * @param file - File object from multer
   * @param tenantId - Tenant ID for storage path
   * @returns Upload result with public URL
   */
  async uploadSegmentImage(file: UploadedFile, tenantId: string): Promise<UploadResult> {
    try {
      // Validate file with 5MB limit (same as package photos), includes magic byte detection
      await this.validateFile(file, this.maxPackagePhotoSizeMB);

      // Generate unique filename
      const filename = this.generateFilename(file.originalname, 'segment');

      // Use Supabase in real mode, filesystem in mock mode
      if (this.isRealMode) {
        return this.uploadToSupabase(tenantId, 'segments', filename, file);
      }

      // Mock mode: write to local filesystem
      const filepath = path.join(this.segmentImageUploadDir, filename);
      await fs.promises.writeFile(filepath, file.buffer);

      logger.info(
        {
          tenantId,
          filename,
          size: file.size,
          mimetype: file.mimetype,
        },
        'Segment image uploaded successfully'
      );

      // Return result with public URL
      return {
        url: `${this.baseUrl}/uploads/segments/${filename}`,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Error uploading segment image');
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
   * Extract storage path from a Supabase URL (public or signed)
   * Handles both formats:
   * - Public: https://xxx.supabase.co/storage/v1/object/public/images/tenant-123/segments/photo.jpg
   * - Signed: https://xxx.supabase.co/storage/v1/object/sign/images/tenant-123/segments/photo.jpg?token=...
   */
  private extractStoragePathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query params (for signed URLs)
      const pathname = urlObj.pathname;
      const pathParts = pathname.split('/');
      const bucketIndex = pathParts.indexOf('images');
      if (bucketIndex === -1) {
        throw new Error('Invalid storage URL format');
      }
      return pathParts.slice(bucketIndex + 1).join('/');
    } catch (error) {
      logger.error({ url, error }, 'Failed to extract storage path from URL');
      throw new Error('Invalid storage URL format');
    }
  }

  /**
   * Delete segment hero image from storage
   * SECURITY: Validates tenant ownership before deletion to prevent cross-tenant access
   *
   * @param url - The full URL of the image to delete
   * @param tenantId - The tenant ID that owns the image
   */
  async deleteSegmentImage(url: string, tenantId: string): Promise<void> {
    if (!url) return;

    try {
      if (this.isRealMode && url.includes('supabase')) {
        const storagePath = this.extractStoragePathFromUrl(url);

        // SECURITY: Verify tenant owns this file before deletion
        if (!storagePath.startsWith(`${tenantId}/`)) {
          logger.error({ tenantId, storagePath, url },
            'SECURITY: Attempted cross-tenant file deletion blocked');
          return; // Don't throw - just block and log
        }

        const supabase = this.getSupabaseClient();
        const { error } = await supabase.storage
          .from('images')
          .remove([storagePath]);

        if (error) {
          logger.warn({ error: error.message, storagePath },
            'Supabase delete failed - file may already be deleted');
        } else {
          logger.info({ tenantId, storagePath }, 'Segment image deleted from Supabase storage');
        }
      } else {
        // Mock mode: delete from local filesystem
        const filename = path.basename(new URL(url).pathname);
        const filepath = path.join(this.segmentImageUploadDir, filename);
        if (fs.existsSync(filepath)) {
          await fs.promises.unlink(filepath);
          logger.info({ filename }, 'Segment image deleted from local storage');
        }
      }
    } catch (error) {
      // Don't throw - cleanup failures shouldn't block segment deletion
      logger.warn({ error, url, tenantId }, 'Error deleting segment image - continuing');
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

  /**
   * Get segment image upload directory path (for serving static files)
   */
  getSegmentImageUploadDir(): string {
    return this.segmentImageUploadDir;
  }
}

// Singleton instance
export const uploadService = new UploadService();
