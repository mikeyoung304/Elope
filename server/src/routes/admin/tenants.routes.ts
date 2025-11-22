/**
 * Admin routes for tenant management
 * Protected with admin authentication middleware
 *
 * Endpoints:
 * - GET    /api/v1/admin/tenants       - List all tenants
 * - POST   /api/v1/admin/tenants       - Create new tenant
 * - GET    /api/v1/admin/tenants/:id   - Get tenant details
 * - PUT    /api/v1/admin/tenants/:id   - Update tenant
 * - DELETE /api/v1/admin/tenants/:id   - Deactivate tenant
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { PrismaTenantRepository } from '../../adapters/prisma/tenant.repository';
import { apiKeyService } from '../../lib/api-key.service';
import { ValidationError, NotFoundError } from '../../lib/errors';

const router = Router();
const prisma = new PrismaClient();
const tenantRepo = new PrismaTenantRepository(prisma);

/**
 * GET /api/v1/admin/tenants
 * List all tenants with stats
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        apiKeyPublic: true,
        commissionPercent: true,
        stripeOnboarded: true,
        stripeAccountId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            packages: true,
            addOns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      tenants: tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        apiKeyPublic: t.apiKeyPublic,
        commissionPercent: Number(t.commissionPercent),
        stripeOnboarded: t.stripeOnboarded,
        stripeAccountId: t.stripeAccountId,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        stats: {
          bookings: t._count.bookings,
          packages: t._count.packages,
          addOns: t._count.addOns,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/tenants
 * Create new tenant with API keys
 *
 * Body:
 * - slug: string (required, URL-safe identifier)
 * - name: string (required, display name)
 * - commission: number (optional, default 10.0)
 *
 * Returns:
 * - tenant: Created tenant object
 * - secretKey: SECRET API KEY (shown ONCE, never stored in plaintext)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, name, commission = 10.0 } = req.body;

    // Validation
    if (!slug || !name) {
      throw new ValidationError('slug and name are required');
    }

    if (typeof commission !== 'number' || commission < 0 || commission > 100) {
      throw new ValidationError('commission must be a number between 0 and 100');
    }

    // Check if slug already exists
    const existing = await tenantRepo.findBySlug(slug);
    if (existing) {
      throw new ValidationError(`Tenant with slug "${slug}" already exists`);
    }

    // Generate API key pair
    const keys = apiKeyService.generateKeyPair(slug);

    // Create tenant
    const tenant = await tenantRepo.create({
      slug,
      name,
      apiKeyPublic: keys.publicKey,
      apiKeySecret: keys.secretKeyHash,
      commissionPercent: commission,
      branding: {},
    });

    res.status(201).json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        apiKeyPublic: tenant.apiKeyPublic,
        commissionPercent: Number(tenant.commissionPercent),
        isActive: tenant.isActive,
        createdAt: tenant.createdAt.toISOString(),
      },
      secretKey: keys.secretKey, // ⚠️ Shown ONCE, never stored in plaintext
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/tenants/:id
 * Get tenant details with full stats
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            packages: true,
            addOns: true,
            blackoutDates: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant not found: ${id}`);
    }

    res.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        apiKeyPublic: tenant.apiKeyPublic,
        commissionPercent: Number(tenant.commissionPercent),
        branding: tenant.branding,
        stripeOnboarded: tenant.stripeOnboarded,
        stripeAccountId: tenant.stripeAccountId,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
        stats: {
          bookings: tenant._count.bookings,
          packages: tenant._count.packages,
          addOns: tenant._count.addOns,
          blackoutDates: tenant._count.blackoutDates,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/tenants/:id
 * Update tenant settings
 *
 * Body (all optional):
 * - name: string
 * - commission: number
 * - branding: object
 * - isActive: boolean
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, commission, branding, isActive } = req.body;

    // Validate commission if provided
    if (commission !== undefined) {
      if (typeof commission !== 'number' || commission < 0 || commission > 100) {
        throw new ValidationError('commission must be a number between 0 and 100');
      }
    }

    const tenant = await tenantRepo.update(id, {
      name,
      commissionPercent: commission,
      branding,
      isActive,
    });

    res.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        apiKeyPublic: tenant.apiKeyPublic,
        commissionPercent: Number(tenant.commissionPercent),
        branding: tenant.branding,
        isActive: tenant.isActive,
        updatedAt: tenant.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/admin/tenants/:id
 * Deactivate tenant (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await tenantRepo.deactivate(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
