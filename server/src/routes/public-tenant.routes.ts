/**
 * Public tenant lookup routes for storefront routing
 *
 * Provides public endpoint to resolve tenant by slug for customer-facing storefronts.
 * SECURITY: Only returns safe public fields - never secrets, Stripe IDs, or PII.
 *
 * @example
 * GET /v1/public/tenants/little-bit-farm
 * Returns: { id, slug, name, apiKeyPublic, branding }
 */

import { Router } from 'express';
import type { PrismaClient } from '../generated/prisma';
import { logger } from '../lib/core/logger';

/**
 * Create public tenant routes
 * @param prisma - Prisma client for database access
 */
export function createPublicTenantRoutes(prisma: PrismaClient): Router {
  const router = Router();

  /**
   * GET /v1/public/tenants/:slug
   * Get public tenant info by slug (for storefront routing)
   *
   * SECURITY: Only returns allowlisted fields:
   * - id, slug, name - Public identifiers
   * - apiKeyPublic - Read-only API key for X-Tenant-Key header
   * - branding - Visual customization only
   *
   * NEVER returns: apiKeySecret, stripeAccountId, email, encryptedSecrets
   */
  router.get('/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
      const tenant = await prisma.tenant.findUnique({
        where: {
          slug,
          isActive: true,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          apiKeyPublic: true,
          branding: true,
        },
      });

      if (!tenant) {
        logger.info({ slug }, 'Tenant not found for public lookup');
        return res.status(404).json({
          status: 'error',
          statusCode: 404,
          error: 'NOT_FOUND',
          message: 'Tenant not found',
        });
      }

      logger.info({ tenantId: tenant.id, slug: tenant.slug }, 'Public tenant lookup');

      // Extract branding fields safely
      const branding = tenant.branding as Record<string, unknown> | null;

      return res.status(200).json({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        apiKeyPublic: tenant.apiKeyPublic,
        branding: branding ? {
          primaryColor: branding.primaryColor as string | undefined,
          secondaryColor: branding.secondaryColor as string | undefined,
          accentColor: branding.accentColor as string | undefined,
          backgroundColor: branding.backgroundColor as string | undefined,
          fontFamily: branding.fontFamily as string | undefined,
          logoUrl: branding.logo as string | undefined, // branding stores 'logo', DTO expects 'logoUrl'
        } : undefined,
      });
    } catch (error) {
      logger.error({ error, slug }, 'Error fetching public tenant');
      return res.status(500).json({
        status: 'error',
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tenant',
      });
    }
  });

  return router;
}
