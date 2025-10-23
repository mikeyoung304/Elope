/**
 * Admin HTTP controller
 */

import type { IdentityService } from '../services/identity.service';
import type { BookingService } from '../services/booking.service';
import type { AdminLoginDto, BookingDto } from '@elope/contracts';

export class AdminController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly bookingService: BookingService
  ) {}

  async login(input: AdminLoginDto): Promise<{ token: string }> {
    return this.identityService.login(input.email, input.password);
  }

  async getBookings(): Promise<BookingDto[]> {
    const bookings = await this.bookingService.getAllBookings();
    return bookings.map((booking) => ({
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
    }));
  }
}
