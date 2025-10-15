/**
 * API v1 contract definition using ts-rest
 */

import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  PackageDtoSchema,
  AvailabilityDtoSchema,
  CreateCheckoutDtoSchema,
  AdminLoginDtoSchema,
  BookingDtoSchema,
  CreatePackageDtoSchema,
  UpdatePackageDtoSchema,
  PackageResponseDtoSchema,
  CreateAddOnDtoSchema,
  UpdateAddOnDtoSchema,
  AddOnDtoSchema,
} from './dto';

const c = initContract();

export const Contracts = c.router({
  // Public endpoints
  getPackages: {
    method: 'GET',
    path: '/v1/packages',
    responses: {
      200: z.array(PackageDtoSchema),
    },
    summary: 'Get all packages',
  },

  getPackageBySlug: {
    method: 'GET',
    path: '/v1/packages/:slug',
    pathParams: z.object({
      slug: z.string(),
    }),
    responses: {
      200: PackageDtoSchema,
    },
    summary: 'Get package by slug',
  },

  getAvailability: {
    method: 'GET',
    path: '/v1/availability',
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    responses: {
      200: AvailabilityDtoSchema,
    },
    summary: 'Check availability for a date',
  },

  createCheckout: {
    method: 'POST',
    path: '/v1/bookings/checkout',
    body: CreateCheckoutDtoSchema,
    responses: {
      200: z.object({
        checkoutUrl: z.string(),
      }),
    },
    summary: 'Create a checkout session',
  },

  // Webhook endpoint (raw body)
  stripeWebhook: {
    method: 'POST',
    path: '/v1/webhooks/stripe',
    body: z.any(), // Raw body
    responses: {
      204: z.void(),
    },
    summary: 'Handle Stripe webhook (raw body)',
  },

  // Admin endpoints (authentication required - documented)
  adminLogin: {
    method: 'POST',
    path: '/v1/admin/login',
    body: AdminLoginDtoSchema,
    responses: {
      200: z.object({
        token: z.string(),
      }),
    },
    summary: 'Admin login',
  },

  adminGetBookings: {
    method: 'GET',
    path: '/v1/admin/bookings',
    responses: {
      200: z.array(BookingDtoSchema),
    },
    summary: 'Get all bookings (requires authentication)',
  },

  adminGetBlackouts: {
    method: 'GET',
    path: '/v1/admin/blackouts',
    responses: {
      200: z.array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          reason: z.string().optional(),
        })
      ),
    },
    summary: 'Get all blackout dates (requires authentication)',
  },

  adminCreateBlackout: {
    method: 'POST',
    path: '/v1/admin/blackouts',
    body: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string().optional(),
    }),
    responses: {
      200: z.object({
        ok: z.literal(true),
      }),
    },
    summary: 'Create a blackout date (requires authentication)',
  },

  // Admin Package CRUD endpoints
  adminCreatePackage: {
    method: 'POST',
    path: '/v1/admin/packages',
    body: CreatePackageDtoSchema,
    responses: {
      200: PackageResponseDtoSchema,
    },
    summary: 'Create a new package (requires authentication)',
  },

  adminUpdatePackage: {
    method: 'PUT',
    path: '/v1/admin/packages/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: UpdatePackageDtoSchema,
    responses: {
      200: PackageResponseDtoSchema,
    },
    summary: 'Update a package (requires authentication)',
  },

  adminDeletePackage: {
    method: 'DELETE',
    path: '/v1/admin/packages/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.void(),
    },
    summary: 'Delete a package (requires authentication)',
  },

  // Admin AddOn CRUD endpoints
  adminCreateAddOn: {
    method: 'POST',
    path: '/v1/admin/packages/:packageId/addons',
    pathParams: z.object({
      packageId: z.string(),
    }),
    body: CreateAddOnDtoSchema,
    responses: {
      200: AddOnDtoSchema,
    },
    summary: 'Create a new add-on for a package (requires authentication)',
  },

  adminUpdateAddOn: {
    method: 'PUT',
    path: '/v1/admin/addons/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: UpdateAddOnDtoSchema,
    responses: {
      200: AddOnDtoSchema,
    },
    summary: 'Update an add-on (requires authentication)',
  },

  adminDeleteAddOn: {
    method: 'DELETE',
    path: '/v1/admin/addons/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.void(),
    },
    summary: 'Delete an add-on (requires authentication)',
  },
});
