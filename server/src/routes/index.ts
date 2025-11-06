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
import { createAuthMiddleware } from '../middleware/auth';
import type { IdentityService } from '../services/identity.service';

interface Controllers {
  packages: PackagesController;
  availability: AvailabilityController;
  bookings: BookingsController;
  webhooks: WebhooksController;
  admin: AdminController;
  blackouts: BlackoutsController;
  adminPackages: AdminPackagesController;
}

export function createV1Router(
  controllers: Controllers,
  identityService: IdentityService,
  app: Application
): void {
  // Create auth middleware for admin endpoints
  const authMiddleware = createAuthMiddleware(identityService);

  // Apply auth middleware to all /v1/admin/* routes (except /v1/admin/login)
  app.use('/v1/admin/bookings', authMiddleware);
  app.use('/v1/admin/blackouts', authMiddleware);
  app.use('/v1/admin/packages', authMiddleware);
  app.use('/v1/admin/addons', authMiddleware);

  const s = initServer();

  // ts-rest express has type compatibility issues with Express 5
  createExpressEndpoints(Contracts, s.router(Contracts, {
    getPackages: async () => {
      const data = await controllers.packages.getPackages();
      return { status: 200 as const, body: data };
    },

    getPackageBySlug: async ({ params }: { params: { slug: string } }) => {
      const data = await controllers.packages.getPackageBySlug(params.slug);
      return { status: 200 as const, body: data };
    },

    getAvailability: async ({ query }: { query: { date: string } }) => {
      const data = await controllers.availability.getAvailability(query.date);
      return { status: 200 as const, body: data };
    },

    getUnavailableDates: async ({ query }: { query: { startDate: string; endDate: string } }) => {
      const data = await controllers.availability.getUnavailableDates(query.startDate, query.endDate);
      return { status: 200 as const, body: data };
    },

    createCheckout: async ({ body }: { body: { packageId: string; eventDate: string; coupleName: string; email: string; addOnIds?: string[] } }) => {
      const data = await controllers.bookings.createCheckout(body);
      return { status: 200 as const, body: data };
    },

    getBookingById: async ({ params }: { params: { id: string } }) => {
      const data = await controllers.bookings.getBookingById(params.id);
      return { status: 200 as const, body: data };
    },

    stripeWebhook: async ({ req }: { req: any }) => {
      // Extract raw body (Buffer) and Stripe signature header
      const rawBody = req.body ? req.body.toString('utf8') : '';
      const signature = req.headers['stripe-signature'] || '';

      await controllers.webhooks.handleStripeWebhook(rawBody, signature);
      return { status: 204 as const, body: undefined };
    },

    adminLogin: async ({ body }: { body: { email: string; password: string } }) => {
      const data = await controllers.admin.login(body);
      return { status: 200 as const, body: data };
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
  } as any), app);
}
