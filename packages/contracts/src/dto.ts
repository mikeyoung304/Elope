/**
 * DTO schemas using zod
 */

import { z } from 'zod';

// Add-on DTO
export const AddOnDtoSchema = z.object({
  id: z.string(),
  packageId: z.string(),
  title: z.string(),
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
  priceCents: z.number().int().min(0),
  photoUrl: z.string().url().optional(),
});

export type CreateAddOnDto = z.infer<typeof CreateAddOnDtoSchema>;

export const UpdateAddOnDtoSchema = z.object({
  packageId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  priceCents: z.number().int().min(0).optional(),
  photoUrl: z.string().url().optional(),
});

export type UpdateAddOnDto = z.infer<typeof UpdateAddOnDtoSchema>;

// Tenant Branding DTO
export const TenantBrandingDtoSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logo: z.string().url().optional(),
});

export type TenantBrandingDto = z.infer<typeof TenantBrandingDtoSchema>;

// Update Tenant Branding DTO (for tenant admin)
export const UpdateBrandingDtoSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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
