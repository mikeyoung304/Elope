/**
 * V1 API router using @ts-rest/express
 */

import type { Application } from 'express';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import { Contracts } from '@elope/contracts';
import type { PackagesController } from './packages.routes';
import type { AvailabilityController } from './availability.routes';
import type { BookingsController } from './bookings.routes';
import type { WebhooksController } from './webhooks.routes';
import type { AdminController } from './admin.routes';
import type { BlackoutsController } from './blackouts.routes';
import type { AdminPackagesController } from './admin-packages.routes';
import type { TenantController } from './tenant.routes';
import { createAuthMiddleware } from '../middleware/auth';
import { createTenantAuthMiddleware } from '../middleware/tenant-auth';
import type { IdentityService } from '../services/identity.service';
import type { TenantAuthService } from '../services/tenant-auth.service';
import type { CatalogService } from '../services/catalog.service';
import type { BookingService } from '../services/booking.service';
import { resolveTenant, requireTenant, getTenantId, type TenantRequest } from '../middleware/tenant';
import { PrismaClient } from '../generated/prisma';
import { PrismaTenantRepository, PrismaBlackoutRepository } from '../adapters/prisma';
import adminTenantsRoutes from './admin/tenants.routes';
import adminStripeRoutes from './admin/stripe.routes';
import { createTenantAdminRoutes } from './tenant-admin.routes';
import { createTenantAuthRoutes } from './tenant-auth.routes';
import { createUnifiedAuthRoutes } from './auth.routes';
import { loginLimiter } from '../middleware/rateLimiter';
import { logger } from '../lib/core/logger';

interface Controllers {
  packages: PackagesController;
  availability: AvailabilityController;
  bookings: BookingsController;
  webhooks: WebhooksController;
  admin: AdminController;
  blackouts: BlackoutsController;
  adminPackages: AdminPackagesController;
  tenant: TenantController;
}

interface Services {
  catalog: CatalogService;
  booking: BookingService;
  tenantAuth: TenantAuthService;
}

export function createV1Router(
  controllers: Controllers,
  identityService: IdentityService,
  app: Application,
  services?: Services
): void {
  // Create Prisma instance for tenant middleware
  const prisma = new PrismaClient();

  // Create tenant middleware for multi-tenant data isolation
  const tenantMiddleware = resolveTenant(prisma);

  // Create auth middleware for admin endpoints
  const authMiddleware = createAuthMiddleware(identityService);

  const s = initServer();

  // ts-rest express has type compatibility issues with Express 5
  createExpressEndpoints(Contracts, s.router(Contracts, {
    getPackages: async ({ req }: { req: any }) => {
      const tenantId = getTenantId(req as TenantRequest);
      const data = await controllers.packages.getPackages(tenantId);
      return { status: 200 as const, body: data };
    },

    getPackageBySlug: async ({ req, params }: { req: any; params: { slug: string } }) => {
      const tenantId = getTenantId(req as TenantRequest);
      const data = await controllers.packages.getPackageBySlug(tenantId, params.slug);
      return { status: 200 as const, body: data };
    },

    getAvailability: async ({ req, query }: { req: any; query: { date: string } }) => {
      const tenantId = getTenantId(req as TenantRequest);
      const data = await controllers.availability.getAvailability(tenantId, query.date);
      return { status: 200 as const, body: data };
    },

    getUnavailableDates: async ({ req, query }: { req: any; query: { startDate: string; endDate: string } }) => {
      const tenantId = getTenantId(req as TenantRequest);
      const data = await controllers.availability.getUnavailableDates(tenantId, query.startDate, query.endDate);
      return { status: 200 as const, body: data };
    },

    createCheckout: async ({ req, body }: { req: any; body: { packageId: string; eventDate: string; coupleName: string; email: string; addOnIds?: string[] } }) => {
      const tenantId = getTenantId(req as TenantRequest);
      const data = await controllers.bookings.createCheckout(tenantId, body);
      return { status: 200 as const, body: data };
    },

    getBookingById: async ({ req, params }: { req: any; params: { id: string } }) => {
      const tenantId = getTenantId(req as TenantRequest);
      const data = await controllers.bookings.getBookingById(tenantId, params.id);
      return { status: 200 as const, body: data };
    },

    getTenantBranding: async ({ req }: { req: any }) => {
      const tenantId = getTenantId(req as TenantRequest);
      const data = await controllers.tenant.getBranding(tenantId);
      return { status: 200 as const, body: data };
    },

    stripeWebhook: async ({ req }: { req: any }) => {
      // Extract raw body (Buffer) and Stripe signature header
      const rawBody = req.body ? req.body.toString('utf8') : '';
      const signature = req.headers['stripe-signature'] || '';

      await controllers.webhooks.handleStripeWebhook(rawBody, signature);
      return { status: 204 as const, body: undefined };
    },

    adminLogin: async ({ req, body }: { req: any; body: { email: string; password: string } }) => {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      try {
        const data = await controllers.admin.login(body);
        return { status: 200 as const, body: data };
      } catch (error) {
        // Log failed admin login attempts
        logger.warn({
          event: 'admin_login_failed',
          endpoint: '/v1/admin/login',
          email: body.email,
          ipAddress,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        }, 'Failed admin login attempt');
        throw error;
      }
    },

    tenantLogin: async ({ req, body }: { req: any; body: { email: string; password: string } }) => {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      try {
        if (!services) {
          throw new Error('Tenant auth service not available');
        }
        const data = await services.tenantAuth.login(body.email, body.password);
        return { status: 200 as const, body: data };
      } catch (error) {
        logger.warn({
          event: 'tenant_login_failed',
          endpoint: '/v1/tenant-auth/login',
          email: body.email,
          ipAddress,
        }, 'Failed tenant login attempt');
        throw error;
      }
    },

    adminGetBookings: async () => {
      // Auth middleware applied via app.use('/v1/admin/bookings', authMiddleware)
      const data = await controllers.admin.getBookings();
      return { status: 200 as const, body: data };
    },

    adminGetBlackouts: async () => {
      // Auth middleware applied via app.use('/v1/admin/blackouts', authMiddleware)
      const data = await controllers.blackouts.getBlackouts();
      return { status: 200 as const, body: data };
    },

    adminCreateBlackout: async ({ body }: { body: { date: string; reason?: string } }) => {
      // Auth middleware applied via app.use('/v1/admin/blackouts', authMiddleware)
      const data = await controllers.blackouts.createBlackout(body);
      return { status: 200 as const, body: data };
    },

    adminCreatePackage: async ({ body }: { body: { slug: string; title: string; description: string; priceCents: number; photoUrl?: string } }) => {
      // Auth middleware applied via app.use('/v1/admin/packages', authMiddleware)
      const data = await controllers.adminPackages.createPackage(body);
      return { status: 200 as const, body: data };
    },

    adminUpdatePackage: async ({ params, body }: { params: { id: string }; body: { slug?: string; title?: string; description?: string; priceCents?: number; photoUrl?: string } }) => {
      // Auth middleware applied via app.use('/v1/admin/packages', authMiddleware)
      const data = await controllers.adminPackages.updatePackage(params.id, body);
      return { status: 200 as const, body: data };
    },

    adminDeletePackage: async ({ params }: { params: { id: string } }) => {
      // Auth middleware applied via app.use('/v1/admin/packages', authMiddleware)
      await controllers.adminPackages.deletePackage(params.id);
      return { status: 204 as const, body: undefined };
    },

    adminCreateAddOn: async ({ params, body }: { params: { packageId: string }; body: { packageId: string; title: string; priceCents: number; photoUrl?: string } }) => {
      // Auth middleware applied via app.use('/v1/admin/packages', authMiddleware)
      const data = await controllers.adminPackages.createAddOn(params.packageId, body);
      return { status: 200 as const, body: data };
    },

    adminUpdateAddOn: async ({ params, body }: { params: { id: string }; body: { packageId?: string; title?: string; priceCents?: number; photoUrl?: string } }) => {
      // Auth middleware applied via app.use('/v1/admin/addons', authMiddleware)
      const data = await controllers.adminPackages.updateAddOn(params.id, body);
      return { status: 200 as const, body: data };
    },

    adminDeleteAddOn: async ({ params }: { params: { id: string } }) => {
      // Auth middleware applied via app.use('/v1/admin/addons', authMiddleware)
      await controllers.adminPackages.deleteAddOn(params.id);
      return { status: 204 as const, body: undefined };
    },
  } as any), app, {
    // Apply middleware based on route path
    globalMiddleware: [
      (req, res, next) => {
        // Apply strict rate limiting to login endpoints
        if ((req.path === '/v1/admin/login' || req.path === '/v1/tenant-auth/login') && req.method === 'POST') {
          return loginLimiter(req, res, next);
        }
        // Public API routes (packages, bookings, availability, tenant) require tenant
        if (req.path.startsWith('/v1/packages') ||
            req.path.startsWith('/v1/bookings') ||
            req.path.startsWith('/v1/availability') ||
            req.path.startsWith('/v1/tenant')) {
          // Chain tenant middleware with requireTenant
          tenantMiddleware(req as any, res, (err?: any) => {
            if (err) return next(err);
            if (res.headersSent) return; // Middleware already sent response
            requireTenant(req as any, res, next);
          });
        }
        // Admin routes require authentication
        else if (req.path.startsWith('/v1/admin/') && !req.path.startsWith('/v1/admin/login')) {
          authMiddleware(req, res, next);
        }
        // Webhooks and other routes pass through
        else {
          next();
        }
      }
    ]
  });

  // Register admin tenant management routes (Express router, not ts-rest)
  app.use('/v1/admin/tenants', authMiddleware, adminTenantsRoutes);

  // Register admin Stripe Connect routes (Express router, not ts-rest)
  app.use('/v1/admin/tenants', authMiddleware, adminStripeRoutes);

  // Register tenant authentication routes (login, /me)
  if (services) {
    const tenantAuthRoutes = createTenantAuthRoutes(services.tenantAuth);
    const tenantAuthMiddleware = createTenantAuthMiddleware(services.tenantAuth);

    // Mount tenant auth routes under /v1/tenant-auth
    // /v1/tenant-auth/login - public
    // /v1/tenant-auth/me - requires authentication (protected by middleware in route handler)
    app.use('/v1/tenant-auth', tenantAuthRoutes);

    // Register tenant admin routes (for tenant self-service)
    // These routes use tenant auth middleware for authentication and authorization
    const tenantRepo = new PrismaTenantRepository(prisma);
    const blackoutRepo = new PrismaBlackoutRepository(prisma);
    const tenantAdminRoutes = createTenantAdminRoutes(
      tenantRepo,
      services.catalog,
      services.booking,
      blackoutRepo
    );
    app.use('/v1/tenant/admin', tenantAuthMiddleware, tenantAdminRoutes);

    // Register unified authentication routes (RECOMMENDED)
    // /v1/auth/login - public - unified login for both platform admins and tenant admins
    // /v1/auth/verify - requires token - verify token and get user info
    const unifiedAuthRoutes = createUnifiedAuthRoutes(
      identityService,
      services.tenantAuth,
      tenantRepo
    );
    app.use('/v1/auth', unifiedAuthRoutes);
  }
}
