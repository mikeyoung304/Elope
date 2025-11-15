/**
 * Booking domain service
 */

import type { BookingRepository, PaymentProvider } from '../lib/ports';
import type { Booking, CreateBookingInput } from '../lib/entities';
import type { CatalogRepository } from '../lib/ports';
import type { EventEmitter } from '../lib/core/events';
import { NotFoundError } from '../lib/core/errors';
import { CommissionService } from './commission.service';
import type { PrismaTenantRepository } from '../adapters/prisma/tenant.repository';
import { IdempotencyService } from './idempotency.service';

export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly _eventEmitter: EventEmitter,
    private readonly paymentProvider: PaymentProvider,
    private readonly commissionService: CommissionService,
    private readonly tenantRepo: PrismaTenantRepository,
    private readonly idempotencyService: IdempotencyService
  ) {}

  /**
   * Creates a Stripe checkout session for a wedding package booking
   *
   * MULTI-TENANT: Accepts tenantId for data isolation and commission calculation
   * Validates package existence, calculates total cost including add-ons,
   * calculates platform commission, and creates a Stripe checkout session
   * with metadata and application fee.
   *
   * @param tenantId - Tenant ID for data isolation
   * @param input - Booking creation data
   * @param input.packageId - Package slug identifier
   * @param input.eventDate - Wedding date in YYYY-MM-DD format
   * @param input.email - Customer email address
   * @param input.coupleName - Names of the couple
   * @param input.addOnIds - Optional array of add-on IDs to include
   *
   * @returns Object containing the Stripe checkout URL
   *
   * @throws {NotFoundError} If package doesn't exist
   *
   * @example
   * ```typescript
   * const checkout = await bookingService.createCheckout('tenant_123', {
   *   packageId: 'intimate-ceremony',
   *   eventDate: '2025-06-15',
   *   email: 'couple@example.com',
   *   coupleName: 'Jane & John',
   *   addOnIds: ['addon_photography', 'addon_flowers']
   * });
   * // Returns: { checkoutUrl: 'https://checkout.stripe.com/...' }
   * ```
   */
  async createCheckout(tenantId: string, input: CreateBookingInput): Promise<{ checkoutUrl: string }> {
    // Validate package exists for this tenant
    const pkg = await this.catalogRepo.getPackageBySlug(tenantId, input.packageId);
    if (!pkg) {
      throw new NotFoundError(`Package ${input.packageId} not found`);
    }

    // Fetch tenant to get Stripe account ID
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(`Tenant ${tenantId} not found`);
    }

    // Calculate total with commission
    const calculation = await this.commissionService.calculateBookingTotal(
      tenantId,
      pkg.priceCents,
      input.addOnIds || []
    );

    // Generate idempotency key for checkout session
    // This prevents duplicate checkout sessions if the request is retried
    const idempotencyKey = this.idempotencyService.generateCheckoutKey(
      tenantId,
      input.email,
      pkg.id,
      input.eventDate,
      Date.now()
    );

    // Check if this request has already been processed
    const cachedResponse = await this.idempotencyService.getStoredResponse(idempotencyKey);
    if (cachedResponse) {
      // Return cached checkout session URL
      return { checkoutUrl: cachedResponse.data.url };
    }

    // Store idempotency key before making Stripe call
    const isNew = await this.idempotencyService.checkAndStore(idempotencyKey);
    if (!isNew) {
      // Race condition: another request stored the key while we were checking
      // Wait briefly and try to get the cached response
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryResponse = await this.idempotencyService.getStoredResponse(idempotencyKey);
      if (retryResponse) {
        return { checkoutUrl: retryResponse.data.url };
      }
      // If still no response, proceed anyway (edge case)
    }

    // Prepare session metadata
    const metadata = {
      tenantId, // CRITICAL: Include tenantId in metadata
      packageId: pkg.id,
      eventDate: input.eventDate,
      email: input.email,
      coupleName: input.coupleName,
      addOnIds: JSON.stringify(input.addOnIds || []),
      commissionAmount: String(calculation.commissionAmount),
      commissionPercent: String(calculation.commissionPercent),
    };

    // Create Stripe checkout session with idempotency key
    // Use Stripe Connect if tenant has connected account, otherwise use standard checkout
    let session;

    if (tenant.stripeAccountId && tenant.stripeOnboarded) {
      // Stripe Connect checkout - payment goes to tenant's account
      session = await this.paymentProvider.createConnectCheckoutSession({
        amountCents: calculation.subtotal,
        email: input.email,
        metadata,
        stripeAccountId: tenant.stripeAccountId,
        applicationFeeAmount: calculation.commissionAmount,
        idempotencyKey,
      });
    } else {
      // Standard Stripe checkout - payment goes to platform account
      // This is backwards compatible for tenants without Stripe Connect
      session = await this.paymentProvider.createCheckoutSession({
        amountCents: calculation.subtotal,
        email: input.email,
        metadata,
        applicationFeeAmount: calculation.commissionAmount,
        idempotencyKey,
      });
    }

    // Cache the response for future duplicate requests
    await this.idempotencyService.updateResponse(idempotencyKey, {
      data: session,
      timestamp: new Date().toISOString(),
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Retrieves all bookings from the database for a tenant
   *
   * MULTI-TENANT: Filters bookings by tenantId for data isolation
   * Returns bookings ordered by creation date (most recent first).
   *
   * @param tenantId - Tenant ID for data isolation
   * @returns Array of all bookings for the tenant
   *
   * @example
   * ```typescript
   * const bookings = await bookingService.getAllBookings('tenant_123');
   * // Returns: [{ id: 'booking_123', status: 'PAID', ... }, ...]
   * ```
   */
  async getAllBookings(tenantId: string): Promise<Booking[]> {
    return this.bookingRepo.findAll(tenantId);
  }

  /**
   * Retrieves a specific booking by ID
   *
   * MULTI-TENANT: Validates booking belongs to specified tenant
   *
   * @param tenantId - Tenant ID for data isolation
   * @param id - Booking identifier
   *
   * @returns The requested booking
   *
   * @throws {NotFoundError} If booking doesn't exist
   *
   * @example
   * ```typescript
   * const booking = await bookingService.getBookingById('tenant_123', 'booking_123');
   * // Returns: { id: 'booking_123', status: 'PAID', ... }
   * ```
   */
  async getBookingById(tenantId: string, id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(tenantId, id);
    if (!booking) {
      throw new NotFoundError(`Booking ${id} not found`);
    }
    return booking;
  }

  /**
   * Retrieves all unavailable booking dates within a date range for a tenant
   *
   * MULTI-TENANT: Filters bookings by tenantId for data isolation
   * This method performs a batch query to fetch all booked dates in a given range,
   * which is much more efficient than checking each date individually.
   * Only returns dates with CONFIRMED or PENDING bookings (excludes CANCELED).
   *
   * @param tenantId - Tenant ID for data isolation
   * @param startDate - Start of date range
   * @param endDate - End of date range
   *
   * @returns Array of date strings in YYYY-MM-DD format
   *
   * @example
   * ```typescript
   * const unavailable = await bookingService.getUnavailableDates(
   *   'tenant_123',
   *   new Date('2025-06-01'),
   *   new Date('2025-06-30')
   * );
   * // Returns: ['2025-06-15', '2025-06-22', '2025-06-29']
   * ```
   */
  async getUnavailableDates(tenantId: string, startDate: Date, endDate: Date): Promise<string[]> {
    const dates = await this.bookingRepo.getUnavailableDates(tenantId, startDate, endDate);
    return dates.map(d => d.toISOString().split('T')[0]); // Return as YYYY-MM-DD strings
  }

  /**
   * Handles payment completion and creates a confirmed booking
   *
   * MULTI-TENANT: Accepts tenantId for data isolation and commission tracking
   * Called by Stripe webhook handler or development simulator after successful payment.
   * Creates a PAID booking with commission data, enriches event data with package/add-on
   * details, and emits BookingPaid event for downstream processing.
   *
   * Uses race condition protection via the booking repository's SERIALIZABLE transaction
   * and pessimistic locking to prevent double-booking scenarios.
   *
   * @param tenantId - Tenant ID for data isolation
   * @param input - Payment completion data from Stripe
   * @param input.sessionId - Stripe checkout session ID
   * @param input.packageId - Package slug identifier
   * @param input.eventDate - Wedding date in YYYY-MM-DD format
   * @param input.email - Customer email address
   * @param input.coupleName - Names of the couple
   * @param input.addOnIds - Optional array of selected add-on IDs
   * @param input.totalCents - Total payment amount in cents
   * @param input.commissionAmount - Platform commission in cents
   * @param input.commissionPercent - Commission percentage
   *
   * @returns Created booking with PAID status
   *
   * @throws {NotFoundError} If package doesn't exist
   * @throws {BookingConflictError} If date is already booked (from repository)
   * @throws {BookingLockTimeoutError} If transaction lock cannot be acquired (from repository)
   *
   * @example
   * ```typescript
   * const booking = await bookingService.onPaymentCompleted('tenant_123', {
   *   sessionId: 'cs_test_123',
   *   packageId: 'intimate-ceremony',
   *   eventDate: '2025-06-15',
   *   email: 'couple@example.com',
   *   coupleName: 'Jane & John',
   *   addOnIds: ['addon_photography'],
   *   totalCents: 150000,
   *   commissionAmount: 18000,
   *   commissionPercent: 12.0
   * });
   * // Returns: { id: 'booking_123', status: 'PAID', commissionAmount: 18000, ... }
   * ```
   */
  async onPaymentCompleted(tenantId: string, input: {
    sessionId: string;
    packageId: string;
    eventDate: string;
    email: string;
    coupleName: string;
    addOnIds?: string[];
    totalCents: number;
    commissionAmount?: number;
    commissionPercent?: number;
  }): Promise<Booking> {
    // Fetch package details for event payload
    const pkg = await this.catalogRepo.getPackageBySlug(tenantId, input.packageId);
    if (!pkg) {
      throw new NotFoundError(`Package ${input.packageId} not found`);
    }

    // Fetch add-on details
    const addOnTitles: string[] = [];
    if (input.addOnIds && input.addOnIds.length > 0) {
      const addOns = await this.catalogRepo.getAddOnsByPackageId(tenantId, pkg.id);
      const selectedAddOns = addOns.filter((a) => input.addOnIds?.includes(a.id));
      addOnTitles.push(...selectedAddOns.map((a) => a.title));
    }

    // Create PAID booking with commission data
    const booking: Booking = {
      id: `booking_${Date.now()}`,
      packageId: pkg.id, // Use actual package ID from fetched package (input.packageId is a slug)
      coupleName: input.coupleName,
      email: input.email,
      eventDate: input.eventDate,
      addOnIds: input.addOnIds || [],
      totalCents: input.totalCents,
      commissionAmount: input.commissionAmount,
      commissionPercent: input.commissionPercent,
      status: 'PAID',
      createdAt: new Date().toISOString(),
    };

    // Persist booking (enforces unique-by-date per tenant)
    const created = await this.bookingRepo.create(tenantId, booking);

    // Emit BookingPaid event for notifications with enriched data
    await this._eventEmitter.emit('BookingPaid', {
      bookingId: created.id,
      email: created.email,
      coupleName: created.coupleName,
      eventDate: created.eventDate,
      packageTitle: pkg.title,
      addOnTitles,
      totalCents: input.totalCents,
    });

    return created;
  }
}
