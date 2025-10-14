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
