/**
 * File Upload Adapter
 * Handles file uploads for tenant branding (logos), package photos, and segment images
 *
 * Dual-mode storage:
 * - Mock mode (ADAPTERS_PRESET=mock): Local filesystem in /uploads directory
 * - Real mode (ADAPTERS_PRESET=real): Supabase Storage with tenant-scoped paths
 */

import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../lib/core/logger';
import type { StorageProvider, FileSystem, UploadedFile, UploadResult } from '../lib/ports';

// file-type v16 is CommonJS - use createRequire for ESM compatibility in Node 25+
const require = createRequire(import.meta.url);
const fileType = require('file-type') as { fromBuffer: (buffer: Buffer) => Promise<{ mime: string; ext: string } | undefined> };

export interface UploadAdapterConfig {
  logoUploadDir: string;
  packagePhotoUploadDir: string;
  segmentImageUploadDir: string;
  maxFileSizeMB: number;
  maxPackagePhotoSizeMB: number;
  allowedMimeTypes: string[];
  baseUrl: string;
  isRealMode: boolean;
  supabaseClient?: SupabaseClient;
}

// Simple concurrency limiter for uploads to prevent memory exhaustion
const uploadSemaphores = new Map<string, number>();
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Check if tenant has available upload slots
 * Throws 429 error if concurrency limit exceeded
 */
export function checkUploadConcurrency(tenantId: string): void {
  const current = uploadSemaphores.get(tenantId) || 0;
  if (current >= MAX_CONCURRENT_UPLOADS) {
    const error = new Error('Too many concurrent uploads. Please wait and try again.');
    (error as any).status = 429;
    throw error;
  }
  uploadSemaphores.set(tenantId, current + 1);
}

/**
 * Release tenant upload slot after completion
 */
export function releaseUploadConcurrency(tenantId: string): void {
  const current = uploadSemaphores.get(tenantId) || 1;
  uploadSemaphores.set(tenantId, Math.max(0, current - 1));
}

export class UploadAdapter implements StorageProvider {
  private readonly config: UploadAdapterConfig;
  private readonly fileSystem: FileSystem;

  constructor(config: UploadAdapterConfig, fileSystem: FileSystem) {
    this.config = config;
    this.fileSystem = fileSystem;

    // Only create local directories in mock mode
    if (!config.isRealMode) {
      this.ensureUploadDir(config.logoUploadDir);
      this.ensureUploadDir(config.packagePhotoUploadDir);
      this.ensureUploadDir(config.segmentImageUploadDir);
    }
  }

  private ensureUploadDir(dir: string): void {
    if (!this.fileSystem.existsSync(dir)) {
      this.fileSystem.mkdirSync(dir, { recursive: true });
      logger.info({ uploadDir: dir }, 'Created upload directory');
    }
  }

  private async validateFile(file: UploadedFile, maxSizeMB?: number): Promise<void> {
    const maxSize = maxSizeMB || this.config.maxFileSizeMB;
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds maximum of ${maxSize}MB`);
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }

    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`);
    }

    const detectedType = await fileType.fromBuffer(file.buffer);

    if (file.mimetype === 'image/svg+xml') {
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

    if (!this.config.allowedMimeTypes.includes(detectedType.mime)) {
      logger.warn({ declared: file.mimetype, detected: detectedType.mime, filename: file.originalname },
        'SECURITY: MIME type mismatch detected - possible spoofing attempt');
      throw new Error('File validation failed');
    }

    const normalizedDeclared = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
    const normalizedDetected = detectedType.mime;
    if (normalizedDetected !== normalizedDeclared) {
      logger.warn({ declared: file.mimetype, detected: detectedType.mime, filename: file.originalname },
        'SECURITY: MIME type mismatch detected - possible spoofing attempt');
      throw new Error('File validation failed');
    }
  }

  private generateFilename(originalName: string, prefix: string = 'logo'): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    return `${prefix}-${timestamp}-${randomStr}${ext}`;
  }

  private async uploadToSupabase(
    tenantId: string,
    folder: 'logos' | 'packages' | 'segments',
    filename: string,
    file: UploadedFile
  ): Promise<UploadResult> {
    if (!this.config.supabaseClient) {
      throw new Error('Supabase client not configured for real mode');
    }

    const supabase = this.config.supabaseClient;
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

    const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('images')
      .createSignedUrl(storagePath, ONE_YEAR_SECONDS);

    if (signedUrlError || !signedUrlData) {
      logger.error({ tenantId, folder, error: signedUrlError }, 'Failed to create signed URL');
      throw new Error('Failed to generate access URL');
    }

    logger.info({ tenantId, folder, filename, size: file.size }, 'File uploaded to Supabase Storage with signed URL');

    return {
      url: signedUrlData.signedUrl,
      filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async uploadLogo(file: UploadedFile, tenantId: string): Promise<UploadResult> {
    try {
      await this.validateFile(file);
      const filename = this.generateFilename(file.originalname, 'logo');

      if (this.config.isRealMode) {
        return this.uploadToSupabase(tenantId, 'logos', filename, file);
      }

      const filepath = path.join(this.config.logoUploadDir, filename);
      await this.fileSystem.writeFile(filepath, file.buffer);

      logger.info({ tenantId, filename, size: file.size, mimetype: file.mimetype }, 'Logo uploaded successfully');

      return {
        url: `${this.config.baseUrl}/uploads/logos/${filename}`,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Error uploading logo');
      throw error;
    }
  }

  async uploadPackagePhoto(file: UploadedFile, packageId: string, tenantId?: string): Promise<UploadResult> {
    try {
      await this.validateFile(file, this.config.maxPackagePhotoSizeMB);
      const filename = this.generateFilename(file.originalname, 'package');

      if (this.config.isRealMode && tenantId) {
        return this.uploadToSupabase(tenantId, 'packages', filename, file);
      }

      const filepath = path.join(this.config.packagePhotoUploadDir, filename);
      await this.fileSystem.writeFile(filepath, file.buffer);

      logger.info({ packageId, filename, size: file.size, mimetype: file.mimetype }, 'Package photo uploaded successfully');

      return {
        url: `${this.config.baseUrl}/uploads/packages/${filename}`,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error({ error, packageId }, 'Error uploading package photo');
      throw error;
    }
  }

  async uploadSegmentImage(file: UploadedFile, tenantId: string): Promise<UploadResult> {
    try {
      await this.validateFile(file, this.config.maxPackagePhotoSizeMB);
      const filename = this.generateFilename(file.originalname, 'segment');

      if (this.config.isRealMode) {
        return this.uploadToSupabase(tenantId, 'segments', filename, file);
      }

      const filepath = path.join(this.config.segmentImageUploadDir, filename);
      await this.fileSystem.writeFile(filepath, file.buffer);

      logger.info({ tenantId, filename, size: file.size, mimetype: file.mimetype }, 'Segment image uploaded successfully');

      return {
        url: `${this.config.baseUrl}/uploads/segments/${filename}`,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Error uploading segment image');
      throw error;
    }
  }

  async deleteLogo(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.config.logoUploadDir, filename);

      if (this.fileSystem.existsSync(filepath)) {
        await this.fileSystem.unlink(filepath);
        logger.info({ filename }, 'Logo deleted successfully');
      }
    } catch (error) {
      logger.error({ error, filename }, 'Error deleting logo');
      throw error;
    }
  }

  async deletePackagePhoto(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.config.packagePhotoUploadDir, filename);

      if (this.fileSystem.existsSync(filepath)) {
        await this.fileSystem.unlink(filepath);
        logger.info({ filename }, 'Package photo deleted successfully');
      }
    } catch (error) {
      logger.error({ error, filename }, 'Error deleting package photo');
      throw error;
    }
  }

  private extractStoragePathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
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

  async deleteSegmentImage(url: string, tenantId: string): Promise<void> {
    if (!url) return;

    try {
      if (this.config.isRealMode && url.includes('supabase')) {
        const storagePath = this.extractStoragePathFromUrl(url);

        if (!storagePath.startsWith(`${tenantId}/`)) {
          logger.error({ tenantId, storagePath, url },
            'SECURITY: Attempted cross-tenant file deletion blocked');
          return;
        }

        if (!this.config.supabaseClient) {
          throw new Error('Supabase client not configured for real mode');
        }

        const { error } = await this.config.supabaseClient.storage
          .from('images')
          .remove([storagePath]);

        if (error) {
          logger.warn({ error: error.message, storagePath },
            'Supabase delete failed - file may already be deleted');
        } else {
          logger.info({ tenantId, storagePath }, 'Segment image deleted from Supabase storage');
        }
      } else {
        const filename = path.basename(new URL(url).pathname);
        const filepath = path.join(this.config.segmentImageUploadDir, filename);
        if (this.fileSystem.existsSync(filepath)) {
          await this.fileSystem.unlink(filepath);
          logger.info({ filename }, 'Segment image deleted from local storage');
        }
      }
    } catch (error) {
      logger.warn({ error, url, tenantId }, 'Error deleting segment image - continuing');
    }
  }

  getLogoUploadDir(): string {
    return this.config.logoUploadDir;
  }

  getPackagePhotoUploadDir(): string {
    return this.config.packagePhotoUploadDir;
  }

  getSegmentImageUploadDir(): string {
    return this.config.segmentImageUploadDir;
  }
}
