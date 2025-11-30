/**
 * Booking domain service
 */

import type { BookingRepository, PaymentProvider, ServiceRepository } from '../lib/ports';
import type { Booking, CreateBookingInput } from '../lib/entities';
import type { CatalogRepository } from '../lib/ports';
import type { EventEmitter } from '../lib/core/events';
import { NotFoundError } from '../lib/errors';
import { CommissionService } from './commission.service';
import type { PrismaTenantRepository } from '../adapters/prisma/tenant.repository';
import { IdempotencyService } from './idempotency.service';
import type { SchedulingAvailabilityService } from './scheduling-availability.service';

// ============================================================================
// Input DTOs for Appointment Scheduling
// ============================================================================

/**
 * Input for creating an appointment checkout session
 */
export interface CreateAppointmentInput {
  serviceId: string;
  startTime: Date;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientTimezone?: string;
  notes?: string;
}

/**
 * Input for handling appointment payment completion
 */
export interface AppointmentPaymentCompletedInput {
  sessionId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientTimezone?: string;
  notes?: string;
  totalCents: number;
}

/**
 * Filters for querying appointments
 */
export interface GetAppointmentsFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'FULFILLED';
  serviceId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly _eventEmitter: EventEmitter,
    private readonly paymentProvider: PaymentProvider,
    private readonly commissionService: CommissionService,
    private readonly tenantRepo: PrismaTenantRepository,
    private readonly idempotencyService: IdempotencyService,
    private readonly schedulingAvailabilityService?: SchedulingAvailabilityService,
    private readonly serviceRepo?: ServiceRepository
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
      const data = cachedResponse.data as { url: string };
      return { checkoutUrl: data.url };
    }

    // Store idempotency key before making Stripe call
    const isNew = await this.idempotencyService.checkAndStore(idempotencyKey);
    if (!isNew) {
      // Race condition: another request stored the key while we were checking
      // Wait briefly and try to get the cached response
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryResponse = await this.idempotencyService.getStoredResponse(idempotencyKey);
      if (retryResponse) {
        const retryData = retryResponse.data as { url: string };
        return { checkoutUrl: retryData.url };
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
   * CRITICAL FIX (P2 #037): Booking and Payment records are now created atomically
   * within a single Prisma transaction to prevent financial reconciliation issues.
   * If either operation fails, both are rolled back to maintain data integrity.
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

    // P2 #037 FIX: Create booking AND payment record atomically
    // Pass payment data to repository for atomic transaction
    const created = await this.bookingRepo.create(tenantId, booking, {
      amount: input.totalCents,
      processor: 'stripe',
      processorId: input.sessionId,
    });

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

  // ============================================================================
  // Appointment Scheduling Methods
  // ============================================================================

  /**
   * Creates a Stripe checkout session for a time-slot appointment booking
   *
   * MULTI-TENANT: Accepts tenantId for data isolation
   * Validates service existence, checks slot availability, and creates a Stripe
   * checkout session with TIMESLOT booking metadata.
   *
   * @param tenantId - Tenant ID for data isolation
   * @param input - Appointment creation data
   * @param input.serviceId - Service ID to book
   * @param input.startTime - Appointment start time (UTC)
   * @param input.clientName - Client's name
   * @param input.clientEmail - Client's email address
   * @param input.clientPhone - Optional client phone number
   * @param input.clientTimezone - Optional client timezone (e.g., "America/New_York")
   * @param input.notes - Optional booking notes
   *
   * @returns Object containing the Stripe checkout URL
   *
   * @throws {NotFoundError} If service doesn't exist
   * @throws {Error} If scheduling dependencies are not available
   * @throws {Error} If time slot is not available
   *
   * @example
   * ```typescript
   * const checkout = await bookingService.createAppointmentCheckout('tenant_123', {
   *   serviceId: 'service_abc',
   *   startTime: new Date('2025-06-15T14:00:00Z'),
   *   clientName: 'John Doe',
   *   clientEmail: 'john@example.com',
   *   clientPhone: '555-1234',
   *   clientTimezone: 'America/New_York',
   *   notes: 'First consultation'
   * });
   * // Returns: { checkoutUrl: 'https://checkout.stripe.com/...' }
   * ```
   */
  async createAppointmentCheckout(
    tenantId: string,
    input: CreateAppointmentInput
  ): Promise<{ checkoutUrl: string }> {
    // Verify scheduling dependencies are available
    if (!this.serviceRepo || !this.schedulingAvailabilityService) {
      throw new Error('Scheduling services are not available. Ensure ServiceRepository and SchedulingAvailabilityService are injected.');
    }

    // 1. Fetch service and validate it exists and belongs to this tenant
    const service = await this.serviceRepo.getById(tenantId, input.serviceId);
    if (!service) {
      throw new NotFoundError(`Service ${input.serviceId} not found`);
    }

    // 2. Calculate endTime based on service duration
    const endTime = new Date(input.startTime.getTime() + service.durationMinutes * 60 * 1000);

    // 3. Verify slot is available
    const isAvailable = await this.schedulingAvailabilityService.isSlotAvailable(
      tenantId,
      input.serviceId,
      input.startTime,
      endTime
    );

    if (!isAvailable) {
      throw new Error(`Time slot starting at ${input.startTime.toISOString()} is not available`);
    }

    // 4. Fetch tenant to get Stripe account ID
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(`Tenant ${tenantId} not found`);
    }

    // 5. Generate idempotency key for checkout session
    const idempotencyKey = this.idempotencyService.generateCheckoutKey(
      tenantId,
      input.clientEmail,
      input.serviceId,
      input.startTime.toISOString(),
      Date.now()
    );

    // 6. Check if this request has already been processed
    const cachedResponse = await this.idempotencyService.getStoredResponse(idempotencyKey);
    if (cachedResponse) {
      const data = cachedResponse.data as { url: string };
      return { checkoutUrl: data.url };
    }

    // 7. Store idempotency key before making Stripe call
    const isNew = await this.idempotencyService.checkAndStore(idempotencyKey);
    if (!isNew) {
      // Race condition: another request stored the key while we were checking
      await new Promise(resolve => setTimeout(resolve, 100));
      const retryResponse = await this.idempotencyService.getStoredResponse(idempotencyKey);
      if (retryResponse) {
        const retryData = retryResponse.data as { url: string };
        return { checkoutUrl: retryData.url };
      }
    }

    // 8. Prepare session metadata for TIMESLOT booking
    const metadata = {
      tenantId, // CRITICAL: Include tenantId in metadata
      bookingType: 'TIMESLOT',
      serviceId: input.serviceId,
      startTime: input.startTime.toISOString(),
      endTime: endTime.toISOString(),
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone || '',
      clientTimezone: input.clientTimezone || '',
      notes: input.notes || '',
    };

    // 9. Create Stripe checkout session
    let session;

    if (tenant.stripeAccountId && tenant.stripeOnboarded) {
      // Stripe Connect checkout - payment goes to tenant's account
      session = await this.paymentProvider.createConnectCheckoutSession({
        amountCents: service.priceCents,
        email: input.clientEmail,
        metadata,
        stripeAccountId: tenant.stripeAccountId,
        applicationFeeAmount: 0, // No commission for appointments (can be configured later)
        idempotencyKey,
      });
    } else {
      // Standard Stripe checkout - payment goes to platform account
      session = await this.paymentProvider.createCheckoutSession({
        amountCents: service.priceCents,
        email: input.clientEmail,
        metadata,
        applicationFeeAmount: 0, // No commission for appointments
        idempotencyKey,
      });
    }

    // 10. Cache the response for future duplicate requests
    await this.idempotencyService.updateResponse(idempotencyKey, {
      data: session,
      timestamp: new Date().toISOString(),
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Handles payment completion for appointment bookings and creates a confirmed booking
   *
   * MULTI-TENANT: Accepts tenantId for data isolation
   * Called by Stripe webhook handler after successful payment for TIMESLOT bookings.
   * Creates a booking record with TIMESLOT type and emits AppointmentBooked event.
   *
   * Uses pessimistic locking to prevent double-booking scenarios.
   *
   * @param tenantId - Tenant ID for data isolation
   * @param input - Payment completion data from Stripe
   * @param input.sessionId - Stripe checkout session ID
   * @param input.serviceId - Service ID
   * @param input.startTime - Appointment start time (UTC)
   * @param input.endTime - Appointment end time (UTC)
   * @param input.clientName - Client's name
   * @param input.clientEmail - Client's email address
   * @param input.clientPhone - Optional client phone number
   * @param input.clientTimezone - Optional client timezone
   * @param input.notes - Optional booking notes
   * @param input.totalCents - Total payment amount in cents
   *
   * @returns Created booking with CONFIRMED status
   *
   * @throws {NotFoundError} If service doesn't exist
   * @throws {Error} If scheduling dependencies are not available
   *
   * @example
   * ```typescript
   * const booking = await bookingService.onAppointmentPaymentCompleted('tenant_123', {
   *   sessionId: 'cs_test_123',
   *   serviceId: 'service_abc',
   *   startTime: new Date('2025-06-15T14:00:00Z'),
   *   endTime: new Date('2025-06-15T14:30:00Z'),
   *   clientName: 'John Doe',
   *   clientEmail: 'john@example.com',
   *   clientPhone: '555-1234',
   *   clientTimezone: 'America/New_York',
   *   notes: 'First consultation',
   *   totalCents: 10000
   * });
   * ```
   */
  async onAppointmentPaymentCompleted(
    tenantId: string,
    input: AppointmentPaymentCompletedInput
  ): Promise<any> {
    // Verify scheduling dependencies are available
    if (!this.serviceRepo) {
      throw new Error('ServiceRepository is not available. Ensure it is injected.');
    }

    // 1. Fetch service details for event payload
    const service = await this.serviceRepo.getById(tenantId, input.serviceId);
    if (!service) {
      throw new NotFoundError(`Service ${input.serviceId} not found`);
    }

    // 2. Create booking record with TIMESLOT type
    // Note: This will use the BookingRepository which should support TIMESLOT bookings
    // The booking will be created with pessimistic locking to prevent double-booking
    const booking = {
      id: `booking_${Date.now()}`,
      tenantId,
      serviceId: input.serviceId,
      customerId: `customer_${Date.now()}`, // TODO: Integrate with Customer management
      packageId: '', // Not applicable for TIMESLOT bookings
      venueId: null,
      date: new Date(input.startTime.getFullYear(), input.startTime.getMonth(), input.startTime.getDate()),
      startTime: input.startTime,
      endTime: input.endTime,
      bookingType: 'TIMESLOT',
      clientTimezone: input.clientTimezone || null,
      status: 'CONFIRMED',
      totalPrice: input.totalCents,
      notes: input.notes || null,
      commissionAmount: 0, // No commission for appointments (can be configured later)
      commissionPercent: 0,
      stripePaymentIntentId: input.sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 3. Persist booking
    // Note: The BookingRepository.create method should handle the Prisma schema mapping
    const created = await this.bookingRepo.create(tenantId, booking as any);

    // 4. Emit AppointmentBooked event for notifications
    await this._eventEmitter.emit('AppointmentBooked', {
      bookingId: created.id,
      tenantId,
      serviceId: input.serviceId,
      serviceName: service.name,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      startTime: input.startTime.toISOString(),
      endTime: input.endTime.toISOString(),
      totalCents: input.totalCents,
      notes: input.notes,
    });

    return created;
  }

  /**
   * Retrieves all appointment bookings with optional filters
   *
   * MULTI-TENANT: Filters by tenantId for data isolation
   * Returns only TIMESLOT bookings (excludes legacy DATE bookings).
   * Results are ordered by startTime ascending.
   *
   * @param tenantId - Tenant ID for data isolation
   * @param filters - Optional filters
   * @param filters.status - Filter by booking status
   * @param filters.serviceId - Filter by service ID
   * @param filters.startDate - Filter by start date (inclusive)
   * @param filters.endDate - Filter by end date (inclusive)
   *
   * @returns Array of appointment bookings
   *
   * @example
   * ```typescript
   * // Get all confirmed appointments
   * const appointments = await bookingService.getAppointments('tenant_123', {
   *   status: 'CONFIRMED'
   * });
   *
   * // Get appointments for a specific service in a date range
   * const serviceAppointments = await bookingService.getAppointments('tenant_123', {
   *   serviceId: 'service_abc',
   *   startDate: new Date('2025-06-01'),
   *   endDate: new Date('2025-06-30')
   * });
   * ```
   */
  async getAppointments(
    tenantId: string,
    filters?: GetAppointmentsFilters
  ): Promise<any[]> {
    // Get all bookings for this tenant
    const allBookings = await this.bookingRepo.findAll(tenantId);

    // Filter to only TIMESLOT bookings
    let appointments = allBookings.filter((booking: any) => booking.bookingType === 'TIMESLOT');

    // Apply optional filters
    if (filters?.status) {
      appointments = appointments.filter((booking: any) => booking.status === filters.status);
    }

    if (filters?.serviceId) {
      appointments = appointments.filter((booking: any) => booking.serviceId === filters.serviceId);
    }

    if (filters?.startDate) {
      appointments = appointments.filter((booking: any) =>
        booking.startTime && new Date(booking.startTime) >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      appointments = appointments.filter((booking: any) =>
        booking.startTime && new Date(booking.startTime) <= filters.endDate!
      );
    }

    // Sort by startTime ascending
    appointments.sort((a: any, b: any) => {
      if (!a.startTime || !b.startTime) return 0;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return appointments;
  }
}
