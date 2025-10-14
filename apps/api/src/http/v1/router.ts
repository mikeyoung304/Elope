/**
 * V1 API router using @ts-rest/express
 */

import { initServer } from '@ts-rest/express';
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

export function createV1Router(controllers: Controllers) {
  const s = initServer();

  return s.router(Contracts, {
    getPackages: async () => {
      const data = await controllers.packages.getPackages();
      return { status: 200, body: data };
    },

    getPackageBySlug: async ({ params }) => {
      const data = await controllers.packages.getPackageBySlug(params.slug);
      return { status: 200, body: data };
    },

    getAvailability: async ({ query }) => {
      const data = await controllers.availability.getAvailability(query.date);
      return { status: 200, body: data };
    },

    createCheckout: async ({ body }) => {
      const data = await controllers.bookings.createCheckout(body);
      return { status: 200, body: data };
    },

    stripeWebhook: async ({ body }) => {
      // TODO: Extract raw body and signature from request
      await controllers.webhooks.handleStripeWebhook('', '');
      return { status: 204, body: undefined };
    },

    adminLogin: async ({ body }) => {
      const data = await controllers.admin.login(body);
      return { status: 200, body: data };
    },

    adminGetBookings: async () => {
      // TODO: Add authentication middleware
      const data = await controllers.admin.getBookings();
      return { status: 200, body: data };
    },

    adminGetBlackouts: async () => {
      // TODO: Add authentication middleware
      const data = await controllers.blackouts.getBlackouts();
      return { status: 200, body: data };
    },

    adminCreateBlackout: async ({ body }) => {
      // TODO: Add authentication middleware
      const data = await controllers.blackouts.createBlackout(body);
      return { status: 200, body: data };
    },
  });
}
