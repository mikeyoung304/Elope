/**
 * Tenant Admin Routes
 * Authenticated routes for tenant administrators to manage their branding,
 * packages, blackouts, and bookings
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ZodError } from 'zod';
import { uploadService } from '../services/upload.service';
import { logger } from '../lib/core/logger';
import type { PrismaTenantRepository } from '../adapters/prisma/tenant.repository';
import type { CatalogService } from '../services/catalog.service';
import type { BookingService } from '../services/booking.service';
import type { BlackoutRepository } from '../lib/ports';
import {
  createPackageSchema,
  updatePackageSchema,
  createBlackoutSchema,
  bookingQuerySchema,
} from '../validation/tenant-admin.schemas';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

export class TenantAdminController {
  constructor(private readonly tenantRepository: PrismaTenantRepository) {}

  /**
   * Upload logo
   * POST /v1/tenant/logo
   */
  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;

      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Upload file
      const result = await uploadService.uploadLogo(req.file as any, tenantId);

      // Update tenant branding with logo URL
      const tenant = await this.tenantRepository.findById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      const currentBranding = (tenant.branding as any) || {};
      const updatedBranding = {
        ...currentBranding,
        logo: result.url,
      };

      await this.tenantRepository.update(tenantId, {
        branding: updatedBranding,
      });

      logger.info(
        { tenantId, logoUrl: result.url },
        'Tenant logo uploaded and branding updated'
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error({ error }, 'Error uploading logo');

      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Update branding
   * PUT /v1/tenant/branding
   */
  async updateBranding(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;

      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      // Validate request body
      const UpdateBrandingSchema = z.object({
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        fontFamily: z.string().optional(),
      });

      const validation = UpdateBrandingSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues,
        });
        return;
      }

      // Get current tenant
      const tenant = await this.tenantRepository.findById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      // Merge with existing branding (preserve logo URL)
      const currentBranding = (tenant.branding as any) || {};
      const updatedBranding = {
        ...currentBranding,
        ...validation.data,
      };

      // Update tenant
      await this.tenantRepository.update(tenantId, {
        branding: updatedBranding,
      });

      logger.info({ tenantId, branding: updatedBranding }, 'Tenant branding updated');

      res.status(200).json({
        primaryColor: updatedBranding.primaryColor,
        secondaryColor: updatedBranding.secondaryColor,
        fontFamily: updatedBranding.fontFamily,
        logo: updatedBranding.logo,
      });
    } catch (error) {
      logger.error({ error }, 'Error updating branding');

      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Get branding (for tenant admin)
   * GET /v1/tenant/branding
   */
  async getBranding(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;

      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const tenant = await this.tenantRepository.findById(tenantId);
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      const branding = (tenant.branding as any) || {};

      res.status(200).json({
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        fontFamily: branding.fontFamily,
        logo: branding.logo,
      });
    } catch (error) {
      logger.error({ error }, 'Error getting branding');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Create tenant admin routes
 */
export function createTenantAdminRoutes(
  tenantRepository: PrismaTenantRepository,
  catalogService: CatalogService,
  bookingService: BookingService,
  blackoutRepo: BlackoutRepository
): Router {
  const router = Router();
  const controller = new TenantAdminController(tenantRepository);

  // Logo upload endpoint
  router.post(
    '/logo',
    upload.single('logo'),
    (req, res) => controller.uploadLogo(req, res)
  );

  // Branding endpoints
  router.get('/branding', (req, res) => controller.getBranding(req, res));
  router.put('/branding', (req, res) => controller.updateBranding(req, res));

  // ============================================================================
  // Package Management Endpoints
  // ============================================================================

  /**
   * GET /v1/tenant-admin/packages
   * List all packages for authenticated tenant
   */
  router.get('/packages', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const packages = await catalogService.getAllPackages(tenantId);
      const packagesDto = packages.map((pkg) => ({
        id: pkg.id,
        slug: pkg.slug,
        title: pkg.title,
        description: pkg.description,
        priceCents: pkg.priceCents,
        photoUrl: pkg.photoUrl,
      }));

      res.json(packagesDto);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /v1/tenant-admin/packages
   * Create new package for authenticated tenant
   */
  router.post('/packages', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const data = createPackageSchema.parse(req.body);
      const pkg = await catalogService.createPackage(tenantId, data);

      res.status(201).json({
        id: pkg.id,
        slug: pkg.slug,
        title: pkg.title,
        description: pkg.description,
        priceCents: pkg.priceCents,
        photoUrl: pkg.photoUrl,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  });

  /**
   * PUT /v1/tenant-admin/packages/:id
   * Update package (verifies ownership)
   */
  router.put('/packages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const { id } = req.params;
      const data = updatePackageSchema.parse(req.body);
      const pkg = await catalogService.updatePackage(tenantId, id, data);

      res.json({
        id: pkg.id,
        slug: pkg.slug,
        title: pkg.title,
        description: pkg.description,
        priceCents: pkg.priceCents,
        photoUrl: pkg.photoUrl,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  });

  /**
   * DELETE /v1/tenant-admin/packages/:id
   * Delete package (verifies ownership)
   */
  router.delete('/packages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const { id } = req.params;
      await catalogService.deletePackage(tenantId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // ============================================================================
  // Blackout Management Endpoints
  // ============================================================================

  /**
   * GET /v1/tenant-admin/blackouts
   * List all blackout dates for authenticated tenant
   */
  router.get('/blackouts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      // Need to fetch full records with IDs
      const prisma = (blackoutRepo as any).prisma;
      const fullBlackouts = await prisma.blackoutDate.findMany({
        where: { tenantId },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          reason: true,
        },
      });

      const blackouts = fullBlackouts.map((b: any) => ({
        id: b.id,
        date: b.date.toISOString().split('T')[0],
        ...(b.reason && { reason: b.reason }),
      }));

      res.json(blackouts);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /v1/tenant-admin/blackouts
   * Add blackout date for authenticated tenant
   */
  router.post('/blackouts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const data = createBlackoutSchema.parse(req.body);
      await blackoutRepo.addBlackout(tenantId, data.date, data.reason);
      res.status(201).json({ ok: true });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  });

  /**
   * DELETE /v1/tenant-admin/blackouts/:id
   * Remove blackout date (verifies ownership)
   */
  router.delete('/blackouts/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const { id } = req.params;

      // Verify blackout belongs to tenant
      const blackout = await blackoutRepo.findBlackoutById(tenantId, id);
      if (!blackout) {
        res.status(404).json({ error: 'Blackout date not found' });
        return;
      }

      await blackoutRepo.deleteBlackout(tenantId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // ============================================================================
  // Booking View Endpoint (Read-Only)
  // ============================================================================

  /**
   * GET /v1/tenant-admin/bookings
   * List all bookings for authenticated tenant
   * Query params: ?status=PAID&startDate=2025-01-01&endDate=2025-12-31
   */
  router.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: No tenant context' });
        return;
      }

      const query = bookingQuerySchema.parse(req.query);
      let bookings = await bookingService.getAllBookings(tenantId);

      // Apply filters
      if (query.status) {
        bookings = bookings.filter((b) => b.status === query.status);
      }

      if (query.startDate) {
        bookings = bookings.filter((b) => b.eventDate >= query.startDate!);
      }

      if (query.endDate) {
        bookings = bookings.filter((b) => b.eventDate <= query.endDate!);
      }

      // Map to DTO
      const bookingsDto = bookings.map((booking) => ({
        id: booking.id,
        packageId: booking.packageId,
        coupleName: booking.coupleName,
        email: booking.email,
        phone: booking.phone,
        eventDate: booking.eventDate,
        addOnIds: booking.addOnIds,
        totalCents: booking.totalCents,
        status: booking.status,
        createdAt: booking.createdAt,
      }));

      res.json(bookingsDto);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  });

  return router;
}
