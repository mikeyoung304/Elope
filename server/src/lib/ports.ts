/**
 * Port interfaces for repositories and external adapters
 */

import type { Package, AddOn, Booking } from './entities';
import type Stripe from 'stripe';

// ============================================================================
// Repository Ports
// ============================================================================

/**
 * Catalog Repository - Package and AddOn persistence
 */
export interface CatalogRepository {
  getAllPackages(tenantId: string): Promise<Package[]>;
  getAllPackagesWithAddOns(tenantId: string): Promise<Array<Package & { addOns: AddOn[] }>>;
  getPackageBySlug(tenantId: string, slug: string): Promise<Package | null>;
  getPackageById(tenantId: string, id: string): Promise<Package | null>;
  getAddOnsByPackageId(tenantId: string, packageId: string): Promise<AddOn[]>;
  createPackage(tenantId: string, data: CreatePackageInput): Promise<Package>;
  updatePackage(tenantId: string, id: string, data: UpdatePackageInput): Promise<Package>;
  deletePackage(tenantId: string, id: string): Promise<void>;
  createAddOn(tenantId: string, data: CreateAddOnInput): Promise<AddOn>;
  updateAddOn(tenantId: string, id: string, data: UpdateAddOnInput): Promise<AddOn>;
  deleteAddOn(tenantId: string, id: string): Promise<void>;
}

/**
 * Booking Repository - Booking persistence
 */
export interface BookingRepository {
  create(tenantId: string, booking: Booking): Promise<Booking>;
  findById(tenantId: string, id: string): Promise<Booking | null>;
  findAll(tenantId: string): Promise<Booking[]>;
  isDateBooked(tenantId: string, date: string): Promise<boolean>;
  getUnavailableDates(tenantId: string, startDate: Date, endDate: Date): Promise<Date[]>;
}

/**
 * Blackout Repository - Blackout date management
 */
export interface BlackoutRepository {
  isBlackoutDate(tenantId: string, date: string): Promise<boolean>;
  getAllBlackouts(tenantId: string): Promise<Array<{ date: string; reason?: string }>>;
  addBlackout(tenantId: string, date: string, reason?: string): Promise<void>;
}

/**
 * User Repository - User authentication and management
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
}

/**
 * Webhook Repository - Webhook event tracking and deduplication
 */
export interface WebhookRepository {
  recordWebhook(input: {
    tenantId: string;
    eventId: string;
    eventType: string;
    rawPayload: string;
  }): Promise<void>;
  markProcessed(tenantId: string, eventId: string): Promise<void>;
  markFailed(tenantId: string, eventId: string, errorMessage: string): Promise<void>;
  isDuplicate(tenantId: string, eventId: string): Promise<boolean>;
}

// ============================================================================
// Provider Ports
// ============================================================================

/**
 * Calendar Provider - External calendar integration
 */
export interface CalendarProvider {
  isDateAvailable(date: string): Promise<boolean>;
}

/**
 * Payment Provider - Payment processing integration
 */
export interface PaymentProvider {
  createCheckoutSession(input: {
    amountCents: number;
    email: string;
    metadata: Record<string, string>;
    applicationFeeAmount?: number; // Platform commission in cents
  }): Promise<CheckoutSession>;
  verifyWebhook(
    payload: string,
    signature: string
  ): Promise<Stripe.Event>;
}

/**
 * Email Provider - Email notifications
 */
export interface EmailProvider {
  sendEmail(input: { to: string; subject: string; html: string }): Promise<void>;
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * User entity with authentication details
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin';
}

/**
 * JWT token payload for authentication
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin';
}

/**
 * Checkout session response from payment provider
 */
export interface CheckoutSession {
  url: string;
  sessionId: string;
}

/**
 * Availability check result
 */
export interface AvailabilityCheck {
  date: string;
  available: boolean;
  reason?: 'blackout' | 'booked' | 'calendar';
}

// ============================================================================
// Input DTOs
// ============================================================================

/**
 * Input for creating a new package
 */
export interface CreatePackageInput {
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  photoUrl?: string;
}

/**
 * Input for updating an existing package
 */
export interface UpdatePackageInput {
  slug?: string;
  title?: string;
  description?: string;
  priceCents?: number;
  photoUrl?: string;
}

/**
 * Input for creating a new add-on
 */
export interface CreateAddOnInput {
  packageId: string;
  title: string;
  priceCents: number;
  photoUrl?: string;
}

/**
 * Input for updating an existing add-on
 */
export interface UpdateAddOnInput {
  packageId?: string;
  title?: string;
  priceCents?: number;
  photoUrl?: string;
}
