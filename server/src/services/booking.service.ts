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

  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepo.findAll();
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new NotFoundError(`Booking ${id} not found`);
    }
    return booking;
  }

  /**
   * Handle payment completion (called by webhook or dev simulator)
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
