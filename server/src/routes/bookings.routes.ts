/**
 * Bookings HTTP controller
 */

import type { BookingService } from '../services/booking.service';
import type { CreateCheckoutDto, BookingDto } from '@elope/contracts';
import { NotFoundError } from '../lib/core/errors';

export class BookingsController {
  constructor(private readonly bookingService: BookingService) {}

  async createCheckout(input: CreateCheckoutDto): Promise<{ checkoutUrl: string }> {
    return this.bookingService.createCheckout({
      packageId: input.packageId,
      coupleName: input.coupleName,
      email: input.email,
      eventDate: input.eventDate,
      addOnIds: input.addOnIds,
    });
  }

  async getBookingById(id: string): Promise<BookingDto> {
    const booking = await this.bookingService.getBookingById(id);
    if (!booking) {
      throw new NotFoundError(`Booking ${id} not found`);
    }

    // Map domain entity to DTO
    return {
      id: booking.id,
      packageId: booking.packageId,
      coupleName: booking.coupleName,
      email: booking.email,
      phone: booking.phone,
      eventDate: booking.eventDate,
      addOnIds: booking.addOnIds,
      totalCents: booking.totalCents,
      status: booking.status,
      createdAt: booking.createdAt,
    };
  }
}
