/**
 * API v1 contract definition using ts-rest
 */
import { z } from 'zod';
export declare const Contracts: {
    getPackages: {
        [x: string]: any;
        summary: "Get all packages";
        method: "GET";
    };
    getPackageBySlug: {
        [x: string]: any;
        pathParams: z.ZodObject<{
            slug: z.ZodString;
        }, z.core.$strip>;
        summary: "Get package by slug";
        method: "GET";
    };
    getAvailability: {
        [x: string]: any;
        query: z.ZodObject<{
            date: z.ZodString;
        }, z.core.$strip>;
        summary: "Check availability for a date";
        method: "GET";
    };
    createCheckout: {
        [x: string]: any;
        summary: "Create a checkout session";
        method: "POST";
        body: z.ZodObject<{
            packageId: z.ZodString;
            eventDate: z.ZodString;
            coupleName: z.ZodString;
            email: z.ZodString;
            addOnIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
    };
    getBookingById: {
        [x: string]: any;
        pathParams: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        summary: "Get booking by ID (public endpoint for confirmation)";
        method: "GET";
    };
    stripeWebhook: {
        [x: string]: any;
        summary: "Handle Stripe webhook (raw body)";
        method: "POST";
        body: z.ZodAny;
    };
    adminLogin: {
        [x: string]: any;
        summary: "Admin login";
        method: "POST";
        body: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
        }, z.core.$strip>;
    };
    adminGetBookings: {
        [x: string]: any;
        summary: "Get all bookings (requires authentication)";
        method: "GET";
    };
    adminGetBlackouts: {
        [x: string]: any;
        summary: "Get all blackout dates (requires authentication)";
        method: "GET";
    };
    adminCreateBlackout: {
        [x: string]: any;
        summary: "Create a blackout date (requires authentication)";
        method: "POST";
        body: z.ZodObject<{
            date: z.ZodString;
            reason: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    adminCreatePackage: {
        [x: string]: any;
        summary: "Create a new package (requires authentication)";
        method: "POST";
        body: z.ZodObject<{
            slug: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            priceCents: z.ZodNumber;
            photoUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    adminUpdatePackage: {
        [x: string]: any;
        pathParams: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        summary: "Update a package (requires authentication)";
        method: "PUT";
        body: z.ZodObject<{
            slug: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            priceCents: z.ZodOptional<z.ZodNumber>;
            photoUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    adminDeletePackage: {
        [x: string]: any;
        pathParams: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        summary: "Delete a package (requires authentication)";
        method: "DELETE";
        body: z.ZodUndefined;
    };
    adminCreateAddOn: {
        [x: string]: any;
        pathParams: z.ZodObject<{
            packageId: z.ZodString;
        }, z.core.$strip>;
        summary: "Create a new add-on for a package (requires authentication)";
        method: "POST";
        body: z.ZodObject<{
            packageId: z.ZodString;
            title: z.ZodString;
            priceCents: z.ZodNumber;
            photoUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    adminUpdateAddOn: {
        [x: string]: any;
        pathParams: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        summary: "Update an add-on (requires authentication)";
        method: "PUT";
        body: z.ZodObject<{
            packageId: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            priceCents: z.ZodOptional<z.ZodNumber>;
            photoUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    };
    adminDeleteAddOn: {
        [x: string]: any;
        pathParams: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        summary: "Delete an add-on (requires authentication)";
        method: "DELETE";
        body: z.ZodUndefined;
    };
};
//# sourceMappingURL=api.v1.d.ts.map