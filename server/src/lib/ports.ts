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
  getAllPackages(): Promise<Package[]>;
  getPackageBySlug(slug: string): Promise<Package | null>;
  getPackageById(id: string): Promise<Package | null>;
  getAddOnsByPackageId(packageId: string): Promise<AddOn[]>;
  createPackage(data: CreatePackageInput): Promise<Package>;
  updatePackage(id: string, data: UpdatePackageInput): Promise<Package>;
  deletePackage(id: string): Promise<void>;
  createAddOn(data: CreateAddOnInput): Promise<AddOn>;
  updateAddOn(id: string, data: UpdateAddOnInput): Promise<AddOn>;
  deleteAddOn(id: string): Promise<void>;
}

/**
 * Booking Repository - Booking persistence
 */
export interface BookingRepository {
  create(booking: Booking): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findAll(): Promise<Booking[]>;
  isDateBooked(date: string): Promise<boolean>;
}

/**
 * Blackout Repository - Blackout date management
 */
export interface BlackoutRepository {
  isBlackoutDate(date: string): Promise<boolean>;
  getAllBlackouts(): Promise<Array<{ date: string; reason?: string }>>;
  addBlackout(date: string, reason?: string): Promise<void>;
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
    eventId: string;
    eventType: string;
    rawPayload: string;
  }): Promise<void>;
  markProcessed(eventId: string): Promise<void>;
  markFailed(eventId: string, errorMessage: string): Promise<void>;
  isDuplicate(eventId: string): Promise<boolean>;
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
