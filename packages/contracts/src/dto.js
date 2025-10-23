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
// Availability DTO
export const AvailabilityDtoSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    available: z.boolean(),
    reason: z.enum(['booked', 'blackout', 'calendar']).optional(),
});
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
// Create Checkout DTO (request body)
export const CreateCheckoutDtoSchema = z.object({
    packageId: z.string(),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    coupleName: z.string(),
    email: z.string().email(),
    addOnIds: z.array(z.string()).optional(),
});
// Admin Login DTO (request body)
export const AdminLoginDtoSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
// Admin Package CRUD DTOs
export const CreatePackageDtoSchema = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    priceCents: z.number().int().min(0),
    photoUrl: z.string().url().optional(),
});
export const UpdatePackageDtoSchema = z.object({
    slug: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    priceCents: z.number().int().min(0).optional(),
    photoUrl: z.string().url().optional(),
});
export const PackageResponseDtoSchema = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    priceCents: z.number().int(),
    photoUrl: z.string().url().optional(),
});
// Admin AddOn CRUD DTOs
export const CreateAddOnDtoSchema = z.object({
    packageId: z.string().min(1),
    title: z.string().min(1),
    priceCents: z.number().int().min(0),
    photoUrl: z.string().url().optional(),
});
export const UpdateAddOnDtoSchema = z.object({
    packageId: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    priceCents: z.number().int().min(0).optional(),
    photoUrl: z.string().url().optional(),
});
//# sourceMappingURL=dto.js.map