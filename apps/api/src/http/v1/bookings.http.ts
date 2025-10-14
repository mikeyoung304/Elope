/**
 * Bookings HTTP controller
 */

import type { BookingService } from '../../domains/booking/service';
import type { CreateCheckoutDto } from '@elope/contracts';

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
}
