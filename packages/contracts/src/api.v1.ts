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
  TenantBrandingDtoSchema,
  UpdateBrandingDtoSchema,
  LogoUploadResponseDtoSchema,
  BlackoutDtoSchema,
  CreateBlackoutDtoSchema,
  PackagePhotoDtoSchema,
  PackageWithPhotosDtoSchema,
  TenantDtoSchema,
  SegmentDtoSchema,
  CreateSegmentDtoSchema,
  UpdateSegmentDtoSchema,
  CreateTenantDtoSchema,
  CreateTenantResponseDtoSchema,
  UpdateTenantDtoSchema,
  TenantDetailDtoSchema,
  PlatformStatsSchema,
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

  getUnavailableDates: {
    method: 'GET',
    path: '/v1/availability/unavailable',
    query: z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    responses: {
      200: z.object({
        dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      }),
    },
    summary: 'Get all unavailable dates in a date range (batch query)',
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

  getBookingById: {
    method: 'GET',
    path: '/v1/bookings/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: BookingDtoSchema,
    },
    summary: 'Get booking by ID (public endpoint for confirmation)',
  },

  getTenantBranding: {
    method: 'GET',
    path: '/v1/tenant/branding',
    responses: {
      200: TenantBrandingDtoSchema,
    },
    summary: 'Get tenant branding configuration for widget customization',
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

  // Tenant admin authentication endpoints
  tenantLogin: {
    method: 'POST',
    path: '/v1/tenant-auth/login',
    body: AdminLoginDtoSchema, // Same schema: email + password
    responses: {
      200: z.object({
        token: z.string(),
      }),
    },
    summary: 'Tenant admin login',
  },

  // ============================================================================
  // Tenant Admin Branding Endpoints
  // ============================================================================

  tenantAdminUploadLogo: {
    method: 'POST',
    path: '/v1/tenant-admin/logo',
    body: z.any(), // Multipart form data (file upload)
    responses: {
      200: LogoUploadResponseDtoSchema,
    },
    summary: 'Upload logo for tenant (requires tenant admin authentication)',
  },

  tenantAdminGetBranding: {
    method: 'GET',
    path: '/v1/tenant-admin/branding',
    responses: {
      200: TenantBrandingDtoSchema,
    },
    summary: 'Get tenant branding configuration (requires tenant admin authentication)',
  },

  tenantAdminUpdateBranding: {
    method: 'PUT',
    path: '/v1/tenant-admin/branding',
    body: UpdateBrandingDtoSchema,
    responses: {
      200: TenantBrandingDtoSchema,
    },
    summary: 'Update tenant branding (requires tenant admin authentication)',
  },

  // ============================================================================
  // Tenant Admin Package Endpoints
  // ============================================================================

  tenantAdminGetPackages: {
    method: 'GET',
    path: '/v1/tenant-admin/packages',
    responses: {
      200: z.array(PackageWithPhotosDtoSchema),
    },
    summary: 'Get all packages for tenant (requires tenant admin authentication)',
  },

  tenantAdminCreatePackage: {
    method: 'POST',
    path: '/v1/tenant-admin/packages',
    body: CreatePackageDtoSchema,
    responses: {
      201: PackageResponseDtoSchema,
    },
    summary: 'Create new package (requires tenant admin authentication)',
  },

  tenantAdminUpdatePackage: {
    method: 'PUT',
    path: '/v1/tenant-admin/packages/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: UpdatePackageDtoSchema,
    responses: {
      200: PackageResponseDtoSchema,
    },
    summary: 'Update package (requires tenant admin authentication)',
  },

  tenantAdminDeletePackage: {
    method: 'DELETE',
    path: '/v1/tenant-admin/packages/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.void(),
    },
    summary: 'Delete package (requires tenant admin authentication)',
  },

  tenantAdminUploadPackagePhoto: {
    method: 'POST',
    path: '/v1/tenant-admin/packages/:id/photos',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.any(), // Multipart form data (file upload)
    responses: {
      201: PackagePhotoDtoSchema,
    },
    summary: 'Upload photo for package (requires tenant admin authentication)',
  },

  tenantAdminDeletePackagePhoto: {
    method: 'DELETE',
    path: '/v1/tenant-admin/packages/:id/photos/:filename',
    pathParams: z.object({
      id: z.string(),
      filename: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.void(),
    },
    summary: 'Delete package photo (requires tenant admin authentication)',
  },

  // ============================================================================
  // Tenant Admin Blackout Endpoints
  // ============================================================================

  tenantAdminGetBlackouts: {
    method: 'GET',
    path: '/v1/tenant-admin/blackouts',
    responses: {
      200: z.array(BlackoutDtoSchema),
    },
    summary: 'Get all blackout dates for tenant (requires tenant admin authentication)',
  },

  tenantAdminCreateBlackout: {
    method: 'POST',
    path: '/v1/tenant-admin/blackouts',
    body: CreateBlackoutDtoSchema,
    responses: {
      201: z.object({
        ok: z.literal(true),
      }),
    },
    summary: 'Create blackout date (requires tenant admin authentication)',
  },

  tenantAdminDeleteBlackout: {
    method: 'DELETE',
    path: '/v1/tenant-admin/blackouts/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.void(),
    },
    summary: 'Delete blackout date (requires tenant admin authentication)',
  },

  // ============================================================================
  // Tenant Admin Booking Endpoints
  // ============================================================================

  tenantAdminGetBookings: {
    method: 'GET',
    path: '/v1/tenant-admin/bookings',
    query: z.object({
      status: z.enum(['PAID', 'REFUNDED', 'CANCELED']).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).optional(),
    responses: {
      200: z.array(BookingDtoSchema),
    },
    summary: 'Get all bookings for tenant with optional filters (requires tenant admin authentication)',
  },

  // Platform admin endpoints (authentication required - documented)
  adminLogin: {
    method: 'POST',
    path: '/v1/admin/login',
    body: AdminLoginDtoSchema,
    responses: {
      200: z.object({
        token: z.string(),
      }),
    },
    summary: 'Platform admin login',
  },

  platformGetAllTenants: {
    method: 'GET',
    path: '/v1/admin/tenants',
    responses: {
      200: z.array(TenantDtoSchema),
    },
    summary: 'Get all tenants (requires platform admin authentication)',
  },

  platformCreateTenant: {
    method: 'POST',
    path: '/v1/admin/tenants',
    body: CreateTenantDtoSchema,
    responses: {
      201: CreateTenantResponseDtoSchema,
    },
    summary: 'Create new tenant (requires platform admin authentication)',
  },

  platformGetTenant: {
    method: 'GET',
    path: '/v1/admin/tenants/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: TenantDetailDtoSchema,
    },
    summary: 'Get tenant details (requires platform admin authentication)',
  },

  platformUpdateTenant: {
    method: 'PUT',
    path: '/v1/admin/tenants/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: UpdateTenantDtoSchema,
    responses: {
      200: TenantDtoSchema,
    },
    summary: 'Update tenant (requires platform admin authentication)',
  },

  platformDeleteTenant: {
    method: 'DELETE',
    path: '/v1/admin/tenants/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.void(),
    },
    summary: 'Deactivate tenant (requires platform admin authentication)',
  },

  platformGetStats: {
    method: 'GET',
    path: '/v1/admin/stats',
    responses: {
      200: PlatformStatsSchema,
    },
    summary: 'Get platform-wide statistics (requires platform admin authentication)',
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

  // Tenant Admin Segment CRUD endpoints
  tenantAdminGetSegments: {
    method: 'GET',
    path: '/v1/tenant/admin/segments',
    responses: {
      200: z.array(SegmentDtoSchema),
    },
    summary: 'Get all segments for tenant (requires tenant admin authentication)',
  },

  tenantAdminCreateSegment: {
    method: 'POST',
    path: '/v1/tenant/admin/segments',
    body: CreateSegmentDtoSchema,
    responses: {
      200: SegmentDtoSchema,
    },
    summary: 'Create a new segment (requires tenant admin authentication)',
  },

  tenantAdminGetSegment: {
    method: 'GET',
    path: '/v1/tenant/admin/segments/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: SegmentDtoSchema,
    },
    summary: 'Get segment by ID (requires tenant admin authentication)',
  },

  tenantAdminUpdateSegment: {
    method: 'PUT',
    path: '/v1/tenant/admin/segments/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: UpdateSegmentDtoSchema,
    responses: {
      200: SegmentDtoSchema,
    },
    summary: 'Update a segment (requires tenant admin authentication)',
  },

  tenantAdminDeleteSegment: {
    method: 'DELETE',
    path: '/v1/tenant/admin/segments/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    body: z.undefined(),
    responses: {
      204: z.void(),
    },
    summary: 'Delete a segment (requires tenant admin authentication)',
  },

  tenantAdminGetSegmentStats: {
    method: 'GET',
    path: '/v1/tenant/admin/segments/:id/stats',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({
        packageCount: z.number().int(),
        addOnCount: z.number().int(),
      }),
    },
    summary: 'Get segment statistics (requires tenant admin authentication)',
  },
});
