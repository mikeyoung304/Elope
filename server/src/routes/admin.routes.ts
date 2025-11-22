/**
 * Admin HTTP controller
 */

import type { IdentityService } from '../services/identity.service';
import type { BookingService } from '../services/booking.service';
import type { AdminLoginDto, BookingDto } from '@macon/contracts';

// Default tenant for admin operations (legacy single-tenant mode)
const DEFAULT_TENANT = 'tenant_default_legacy';

export class AdminController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly bookingService: BookingService
  ) {}

  async login(input: AdminLoginDto): Promise<{ token: string }> {
    return this.identityService.login(input.email, input.password);
  }

  async getBookings(): Promise<BookingDto[]> {
    const bookings = await this.bookingService.getAllBookings(DEFAULT_TENANT);
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
