/**
 * Availability domain service
 */

import type {
  CalendarProvider,
  BlackoutRepository,
  BookingRepository,
  AvailabilityCheck,
} from './port';

export class AvailabilityService {
  constructor(
    private readonly calendarProvider: CalendarProvider,
    private readonly blackoutRepo: BlackoutRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  async checkAvailability(date: string): Promise<AvailabilityCheck> {
    // Check blackout dates first
    const isBlackout = await this.blackoutRepo.isBlackoutDate(date);
    if (isBlackout) {
      return { date, available: false, reason: 'blackout' };
    }

    // Check if already booked
    const isBooked = await this.bookingRepo.isDateBooked(date);
    if (isBooked) {
      return { date, available: false, reason: 'booked' };
    }

    // Check calendar availability
    const isCalendarAvailable = await this.calendarProvider.isDateAvailable(date);
    if (!isCalendarAvailable) {
      return { date, available: false, reason: 'calendar' };
    }

    return { date, available: true };
  }
}
