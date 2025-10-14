/**
 * V1 API router using @ts-rest/express
 */

import type { Application } from 'express';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import { Contracts } from '@elope/contracts';
import type { PackagesController } from './packages.http';
import type { AvailabilityController } from './availability.http';
import type { BookingsController } from './bookings.http';
import type { WebhooksController } from './webhooks.http';
import type { AdminController } from './admin.http';
import type { BlackoutsController } from './blackouts.http';

interface Controllers {
  packages: PackagesController;
  availability: AvailabilityController;
  bookings: BookingsController;
  webhooks: WebhooksController;
  admin: AdminController;
  blackouts: BlackoutsController;
}

export function createV1Router(controllers: Controllers, app: Application): void {
  const s = initServer();

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

    createCheckout: async ({ body }: { body: { packageId: string; eventDate: string; coupleName: string; email: string; addOnIds?: string[] } }) => {
      const data = await controllers.bookings.createCheckout(body);
      return { status: 200 as const, body: data };
    },

    stripeWebhook: async () => {
      // TODO: Extract raw body and signature from request
      await controllers.webhooks.handleStripeWebhook('', '');
      return { status: 204 as const, body: undefined };
    },

    adminLogin: async ({ body }: { body: { email: string; password: string } }) => {
      const data = await controllers.admin.login(body);
      return { status: 200 as const, body: data };
    },

    adminGetBookings: async () => {
      // TODO: Add authentication middleware
      const data = await controllers.admin.getBookings();
      return { status: 200 as const, body: data };
    },

    adminGetBlackouts: async () => {
      // TODO: Add authentication middleware
      const data = await controllers.blackouts.getBlackouts();
      return { status: 200 as const, body: data };
    },

    adminCreateBlackout: async ({ body }: { body: { date: string; reason?: string } }) => {
      // TODO: Add authentication middleware
      const data = await controllers.blackouts.createBlackout(body);
      return { status: 200 as const, body: data };
    },
  }), app);
}
