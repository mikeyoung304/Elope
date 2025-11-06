/**
 * Booking domain service
 */

import type { BookingRepository, PaymentProvider } from '../lib/ports';
import type { Booking, CreateBookingInput } from '../lib/entities';
import type { CatalogRepository } from '../lib/ports';
import type { EventEmitter } from '../lib/core/events';
import { NotFoundError } from '../lib/core/errors';

export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly _eventEmitter: EventEmitter,
    private readonly paymentProvider: PaymentProvider
  ) {}

  /**
   * Creates a Stripe checkout session for a wedding package booking
   *
   * Validates package existence, calculates total cost including add-ons,
   * and creates a Stripe checkout session with metadata for later processing.
   *
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
   * const checkout = await bookingService.createCheckout({
   *   packageId: 'intimate-ceremony',
   *   eventDate: '2025-06-15',
   *   email: 'couple@example.com',
   *   coupleName: 'Jane & John',
   *   addOnIds: ['addon_photography', 'addon_flowers']
   * });
   * // Returns: { checkoutUrl: 'https://checkout.stripe.com/...' }
   * ```
   */
  async createCheckout(input: CreateBookingInput): Promise<{ checkoutUrl: string }> {
    // Validate package exists
    const pkg = await this.catalogRepo.getPackageBySlug(input.packageId);
    if (!pkg) {
      throw new NotFoundError(`Package ${input.packageId} not found`);
    }

    // Calculate total
    let totalCents = pkg.priceCents;
    if (input.addOnIds && input.addOnIds.length > 0) {
      const addOns = await this.catalogRepo.getAddOnsByPackageId(pkg.id);
      const selectedAddOns = addOns.filter((a) => input.addOnIds?.includes(a.id));
      totalCents += selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0);
    }

    // Create Stripe checkout session
    const session = await this.paymentProvider.createCheckoutSession({
      amountCents: totalCents,
      email: input.email,
      metadata: {
        packageId: pkg.id,
        eventDate: input.eventDate,
        email: input.email,
        coupleName: input.coupleName,
        addOnIds: JSON.stringify(input.addOnIds || []),
      },
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Retrieves all bookings from the database
   *
   * Returns bookings ordered by creation date (most recent first).
   *
   * @returns Array of all bookings
   *
   * @example
   * ```typescript
   * const bookings = await bookingService.getAllBookings();
   * // Returns: [{ id: 'booking_123', status: 'PAID', ... }, ...]
   * ```
   */
  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepo.findAll();
  }

  /**
   * Retrieves a specific booking by ID
   *
   * @param id - Booking identifier
   *
   * @returns The requested booking
   *
   * @throws {NotFoundError} If booking doesn't exist
   *
   * @example
   * ```typescript
   * const booking = await bookingService.getBookingById('booking_123');
   * // Returns: { id: 'booking_123', status: 'PAID', ... }
   * ```
   */
  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundError(`Booking ${id} not found`);
    }
    return booking;
  }

  /**
   * Retrieves all unavailable booking dates within a date range
   *
   * This method performs a batch query to fetch all booked dates in a given range,
   * which is much more efficient than checking each date individually.
   * Only returns dates with CONFIRMED or PENDING bookings (excludes CANCELED).
   *
   * @param startDate - Start of date range
   * @param endDate - End of date range
   *
   * @returns Array of date strings in YYYY-MM-DD format
   *
   * @example
   * ```typescript
   * const unavailable = await bookingService.getUnavailableDates(
   *   new Date('2025-06-01'),
   *   new Date('2025-06-30')
   * );
   * // Returns: ['2025-06-15', '2025-06-22', '2025-06-29']
   * ```
   */
  async getUnavailableDates(startDate: Date, endDate: Date): Promise<string[]> {
    const dates = await this.bookingRepo.getUnavailableDates(startDate, endDate);
    return dates.map(d => d.toISOString().split('T')[0]); // Return as YYYY-MM-DD strings
  }

  /**
   * Handles payment completion and creates a confirmed booking
   *
   * Called by Stripe webhook handler or development simulator after successful payment.
   * Creates a PAID booking, enriches event data with package/add-on details, and emits
   * BookingPaid event for downstream processing (email notifications, calendar sync, etc.).
   *
   * Uses race condition protection via the booking repository's SERIALIZABLE transaction
   * and pessimistic locking to prevent double-booking scenarios.
   *
   * @param input - Payment completion data from Stripe
   * @param input.sessionId - Stripe checkout session ID
   * @param input.packageId - Package slug identifier
   * @param input.eventDate - Wedding date in YYYY-MM-DD format
   * @param input.email - Customer email address
   * @param input.coupleName - Names of the couple
   * @param input.addOnIds - Optional array of selected add-on IDs
   * @param input.totalCents - Total payment amount in cents
   *
   * @returns Created booking with PAID status
   *
   * @throws {NotFoundError} If package doesn't exist
   * @throws {BookingConflictError} If date is already booked (from repository)
   * @throws {BookingLockTimeoutError} If transaction lock cannot be acquired (from repository)
   *
   * @example
   * ```typescript
   * const booking = await bookingService.onPaymentCompleted({
   *   sessionId: 'cs_test_123',
   *   packageId: 'intimate-ceremony',
   *   eventDate: '2025-06-15',
   *   email: 'couple@example.com',
   *   coupleName: 'Jane & John',
   *   addOnIds: ['addon_photography'],
   *   totalCents: 150000
   * });
   * // Returns: { id: 'booking_123', status: 'PAID', ... }
   * ```
   */
  async onPaymentCompleted(input: {
    sessionId: string;
    packageId: string;
    eventDate: string;
    email: string;
    coupleName: string;
    addOnIds?: string[];
    totalCents: number;
  }): Promise<Booking> {
    // Fetch package details for event payload
    const pkg = await this.catalogRepo.getPackageBySlug(input.packageId);
    if (!pkg) {
      throw new NotFoundError(`Package ${input.packageId} not found`);
    }

    // Fetch add-on details
    const addOnTitles: string[] = [];
    if (input.addOnIds && input.addOnIds.length > 0) {
      const addOns = await this.catalogRepo.getAddOnsByPackageId(pkg.id);
      const selectedAddOns = addOns.filter((a) => input.addOnIds?.includes(a.id));
      addOnTitles.push(...selectedAddOns.map((a) => a.title));
    }

    // Create PAID booking
    const booking: Booking = {
      id: `booking_${Date.now()}`,
      packageId: input.packageId,
      coupleName: input.coupleName,
      email: input.email,
      eventDate: input.eventDate,
      addOnIds: input.addOnIds || [],
      totalCents: input.totalCents,
      status: 'PAID',
      createdAt: new Date().toISOString(),
    };

    // Persist booking (enforces unique-by-date)
    const created = await this.bookingRepo.create(booking);

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
