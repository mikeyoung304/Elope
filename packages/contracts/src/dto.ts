/**
 * DTO schemas using zod
 */

import { z } from 'zod';

// Add-on DTO
export const AddOnDtoSchema = z.object({
  id: z.string(),
  packageId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priceCents: z.number().int(),
  photoUrl: z.string().url().optional(),
});

export type AddOnDto = z.infer<typeof AddOnDtoSchema>;

// Package DTO
export const PackageDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  photoUrl: z.string().url().optional(),
  addOns: z.array(AddOnDtoSchema),
});

export type PackageDto = z.infer<typeof PackageDtoSchema>;

// Availability DTO
export const AvailabilityDtoSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  available: z.boolean(),
  reason: z.enum(['booked', 'blackout', 'calendar']).optional(),
});

export type AvailabilityDto = z.infer<typeof AvailabilityDtoSchema>;

// Batch Availability DTO (for date range queries)
export const BatchAvailabilityDtoSchema = z.object({
  unavailableDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export type BatchAvailabilityDto = z.infer<typeof BatchAvailabilityDtoSchema>;

// Booking DTO
export const BookingDtoSchema = z.object({
  id: z.string(),
  packageId: z.string(),
  coupleName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  addOnIds: z.array(z.string()),
  totalCents: z.number().int(),
  status: z.enum(['PAID', 'REFUNDED', 'CANCELED']),
  createdAt: z.string().datetime(), // ISO datetime
});

export type BookingDto = z.infer<typeof BookingDtoSchema>;

// Create Checkout DTO (request body)
export const CreateCheckoutDtoSchema = z.object({
  packageId: z.string(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  coupleName: z.string(),
  email: z.string().email(),
  addOnIds: z.array(z.string()).optional(),
});

export type CreateCheckoutDto = z.infer<typeof CreateCheckoutDtoSchema>;

// Admin Login DTO (request body)
export const AdminLoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type AdminLoginDto = z.infer<typeof AdminLoginDtoSchema>;

// Admin Package CRUD DTOs
export const CreatePackageDtoSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.number().int().min(0),
  photoUrl: z.string().url().optional(),
});

export type CreatePackageDto = z.infer<typeof CreatePackageDtoSchema>;

export const UpdatePackageDtoSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  photoUrl: z.string().url().optional(),
});

export type UpdatePackageDto = z.infer<typeof UpdatePackageDtoSchema>;

export const PackageResponseDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  photoUrl: z.string().url().optional(),
});

export type PackageResponseDto = z.infer<typeof PackageResponseDtoSchema>;

// Admin AddOn CRUD DTOs
export const CreateAddOnDtoSchema = z.object({
  packageId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().min(0),
  photoUrl: z.string().url().optional(),
});

export type CreateAddOnDto = z.infer<typeof CreateAddOnDtoSchema>;

export const UpdateAddOnDtoSchema = z.object({
  packageId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().min(0).optional(),
  photoUrl: z.string().url().optional(),
});

export type UpdateAddOnDto = z.infer<typeof UpdateAddOnDtoSchema>;

// Tenant Branding DTO
export const TenantBrandingDtoSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logo: z.string().url().optional(),
});

export type TenantBrandingDto = z.infer<typeof TenantBrandingDtoSchema>;

// Update Tenant Branding DTO (for tenant admin)
export const UpdateBrandingDtoSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
});

export type UpdateBrandingDto = z.infer<typeof UpdateBrandingDtoSchema>;

// Logo Upload Response DTO
export const LogoUploadResponseDtoSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  size: z.number(),
  mimetype: z.string(),
});

export type LogoUploadResponseDto = z.infer<typeof LogoUploadResponseDtoSchema>;

// Blackout Date DTOs
export const BlackoutDtoSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

export type BlackoutDto = z.infer<typeof BlackoutDtoSchema>;

export const CreateBlackoutDtoSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

export type CreateBlackoutDto = z.infer<typeof CreateBlackoutDtoSchema>;

// Package Photo DTOs
export const PackagePhotoDtoSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  size: z.number(),
  order: z.number().int(),
});

export type PackagePhotoDto = z.infer<typeof PackagePhotoDtoSchema>;

// Package with Photos DTO (for tenant admin)
export const PackageWithPhotosDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  priceCents: z.number().int(),
  photoUrl: z.string().url().optional(),
  photos: z.array(PackagePhotoDtoSchema).optional(),
});

export type PackageWithPhotosDto = z.infer<typeof PackageWithPhotosDtoSchema>;

// Stripe Connect DTOs
export const StripeConnectDtoSchema = z.object({
  accountId: z.string(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  detailsSubmitted: z.boolean(),
});

export type StripeConnectDto = z.infer<typeof StripeConnectDtoSchema>;

export const StripeOnboardingLinkDtoSchema = z.object({
  url: z.string().url(),
  expiresAt: z.number(),
});

export type StripeOnboardingLinkDto = z.infer<typeof StripeOnboardingLinkDtoSchema>;

export const StripeAccountStatusDtoSchema = z.object({
  accountId: z.string(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  detailsSubmitted: z.boolean(),
  requirements: z.object({
    currentlyDue: z.array(z.string()),
    eventuallyDue: z.array(z.string()),
    pastDue: z.array(z.string()),
  }),
});

export type StripeAccountStatusDto = z.infer<typeof StripeAccountStatusDtoSchema>;

// Tenant DTO (for platform admin)
export const TenantDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  commissionPercent: z.number(),
  stripeAccountId: z.string().nullable(),
  stripeOnboarded: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
  // Stats
  packageCount: z.number().optional(),
  bookingCount: z.number().optional(),
});

export type TenantDto = z.infer<typeof TenantDtoSchema>;

// Segment DTOs
export const SegmentDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  slug: z.string(),
  name: z.string(),
  heroTitle: z.string(),
  heroSubtitle: z.string().nullable(),
  heroImage: z.string().nullable(),
  description: z.string().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  sortOrder: z.number().int(),
  active: z.boolean(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
});

export type SegmentDto = z.infer<typeof SegmentDtoSchema>;

export const CreateSegmentDtoSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Lowercase alphanumeric + hyphens only'),
  name: z.string().min(1).max(100),
  heroTitle: z.string().min(1).max(200),
  heroSubtitle: z.string().max(300).optional(),
  heroImage: z.string().url().or(z.literal('')).optional(),
  description: z.string().max(2000).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export type CreateSegmentDto = z.infer<typeof CreateSegmentDtoSchema>;

export const UpdateSegmentDtoSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Lowercase alphanumeric + hyphens only').optional(),
  name: z.string().min(1).max(100).optional(),
  heroTitle: z.string().min(1).max(200).optional(),
  heroSubtitle: z.string().max(300).optional(),
  heroImage: z.string().url().or(z.literal('')).optional(),
  description: z.string().max(2000).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export type UpdateSegmentDto = z.infer<typeof UpdateSegmentDtoSchema>;

// Platform Admin - Tenant Management DTOs

export const CreateTenantDtoSchema = z.object({
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string()
    .min(2, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email format')
    .optional(),
  commissionPercent: z.number()
    .min(0, 'Commission must be at least 0%')
    .max(100, 'Commission cannot exceed 100%')
    .default(10.0),
});

export type CreateTenantDto = z.infer<typeof CreateTenantDtoSchema>;

export const CreateTenantResponseDtoSchema = z.object({
  tenant: TenantDtoSchema,
  secretKey: z.string(), // API secret key - shown ONCE, never stored in plaintext
});

export type CreateTenantResponseDto = z.infer<typeof CreateTenantResponseDtoSchema>;

export const UpdateTenantDtoSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  branding: z.record(z.string(), z.any()).optional(), // JSON object
  isActive: z.boolean().optional(),
  stripeAccountId: z.string().optional(),
  stripeOnboarded: z.boolean().optional(),
});

export type UpdateTenantDto = z.infer<typeof UpdateTenantDtoSchema>;

export const TenantDetailDtoSchema = TenantDtoSchema.extend({
  stats: z.object({
    bookings: z.number().int(),
    packages: z.number().int(),
    addOns: z.number().int(),
    segments: z.number().int(),
    blackoutDates: z.number().int(),
  }),
});

export type TenantDetailDto = z.infer<typeof TenantDetailDtoSchema>;

export const PlatformStatsSchema = z.object({
  // Tenant metrics
  totalTenants: z.number().int(),
  activeTenants: z.number().int(),

  // Segment metrics
  totalSegments: z.number().int(),
  activeSegments: z.number().int(),

  // Booking metrics
  totalBookings: z.number().int(),
  confirmedBookings: z.number().int(),
  pendingBookings: z.number().int(),

  // Revenue metrics (in cents)
  totalRevenue: z.number().int(),
  platformCommission: z.number().int(),
  tenantRevenue: z.number().int(),

  // Time-based metrics (optional)
  revenueThisMonth: z.number().int().optional(),
  bookingsThisMonth: z.number().int().optional(),
});

export type PlatformStats = z.infer<typeof PlatformStatsSchema>;
