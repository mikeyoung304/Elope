/**
 * DTO schemas using zod
 */
import { z } from 'zod';
export declare const AddOnDtoSchema: z.ZodObject<{
    id: z.ZodString;
    packageId: z.ZodString;
    title: z.ZodString;
    priceCents: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AddOnDto = z.infer<typeof AddOnDtoSchema>;
export declare const PackageDtoSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    priceCents: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
    addOns: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        packageId: z.ZodString;
        title: z.ZodString;
        priceCents: z.ZodNumber;
        photoUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PackageDto = z.infer<typeof PackageDtoSchema>;
export declare const AvailabilityDtoSchema: z.ZodObject<{
    date: z.ZodString;
    available: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodEnum<{
        blackout: "blackout";
        booked: "booked";
        calendar: "calendar";
    }>>;
}, z.core.$strip>;
export type AvailabilityDto = z.infer<typeof AvailabilityDtoSchema>;
export declare const BookingDtoSchema: z.ZodObject<{
    id: z.ZodString;
    packageId: z.ZodString;
    coupleName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    eventDate: z.ZodString;
    addOnIds: z.ZodArray<z.ZodString>;
    totalCents: z.ZodNumber;
    status: z.ZodEnum<{
        PAID: "PAID";
        REFUNDED: "REFUNDED";
        CANCELED: "CANCELED";
    }>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type BookingDto = z.infer<typeof BookingDtoSchema>;
export declare const CreateCheckoutDtoSchema: z.ZodObject<{
    packageId: z.ZodString;
    eventDate: z.ZodString;
    coupleName: z.ZodString;
    email: z.ZodString;
    addOnIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateCheckoutDto = z.infer<typeof CreateCheckoutDtoSchema>;
export declare const AdminLoginDtoSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type AdminLoginDto = z.infer<typeof AdminLoginDtoSchema>;
export declare const CreatePackageDtoSchema: z.ZodObject<{
    slug: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    priceCents: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreatePackageDto = z.infer<typeof CreatePackageDtoSchema>;
export declare const UpdatePackageDtoSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    priceCents: z.ZodOptional<z.ZodNumber>;
    photoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdatePackageDto = z.infer<typeof UpdatePackageDtoSchema>;
export declare const PackageResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    priceCents: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PackageResponseDto = z.infer<typeof PackageResponseDtoSchema>;
export declare const CreateAddOnDtoSchema: z.ZodObject<{
    packageId: z.ZodString;
    title: z.ZodString;
    priceCents: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateAddOnDto = z.infer<typeof CreateAddOnDtoSchema>;
export declare const UpdateAddOnDtoSchema: z.ZodObject<{
    packageId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    priceCents: z.ZodOptional<z.ZodNumber>;
    photoUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateAddOnDto = z.infer<typeof UpdateAddOnDtoSchema>;
//# sourceMappingURL=dto.d.ts.map