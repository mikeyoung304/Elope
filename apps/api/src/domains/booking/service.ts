/**
 * Booking domain service
 */

import type { BookingRepository } from './port';
import type { Booking, CreateBookingInput } from './entities';
import type { CatalogRepository } from '../catalog/port';
import type { EventEmitter } from '../../core/events';
import { NotFoundError } from '../../core/errors';

export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly _eventEmitter: EventEmitter
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

    // TODO: Create Stripe checkout session
    // For now, return a placeholder URL
    const checkoutUrl = `https://checkout.stripe.com/placeholder`;

    return { checkoutUrl };
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
}
