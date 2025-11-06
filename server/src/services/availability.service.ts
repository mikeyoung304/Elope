/**
 * Availability domain service
 */

import type {
  CalendarProvider,
  BlackoutRepository,
  BookingRepository,
  AvailabilityCheck,
} from '../lib/ports';

export class AvailabilityService {
  constructor(
    private readonly calendarProvider: CalendarProvider,
    private readonly blackoutRepo: BlackoutRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  /**
   * Checks if a wedding date is available for booking
   *
   * Performs multi-source availability check:
   * 1. Blackout dates (administrative blocks)
   * 2. Existing bookings
   * 3. Google Calendar availability
   *
   * Returns first blocking reason found (short-circuit evaluation).
   *
   * @param date - Date string in YYYY-MM-DD format
   *
   * @returns Availability check result with reason if unavailable
   *
   * @example
   * ```typescript
   * const check = await availabilityService.checkAvailability('2025-06-15');
   * if (!check.available) {
   *   console.log(`Unavailable: ${check.reason}`); // 'blackout', 'booked', or 'calendar'
   * }
   * ```
   */
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

  /**
   * Retrieves all unavailable booking dates within a date range
   *
   * Performs batch query to fetch all booked dates efficiently (60 API calls → 1).
   * Used by DatePicker component to disable unavailable dates.
   *
   * @param startDate - Start of date range
   * @param endDate - End of date range
   *
   * @returns Array of date strings in YYYY-MM-DD format
   *
   * @example
   * ```typescript
   * const unavailable = await availabilityService.getUnavailableDates(
   *   new Date('2025-06-01'),
   *   new Date('2025-06-30')
   * );
   * // Returns: ['2025-06-15', '2025-06-22', '2025-06-29']
   * ```
   */
  async getUnavailableDates(startDate: Date, endDate: Date): Promise<string[]> {
    // Batch fetch all booked dates in the range (single DB query)
    const bookedDates = await this.bookingRepo.getUnavailableDates(startDate, endDate);
    return bookedDates.map(d => d.toISOString().split('T')[0]); // Return as YYYY-MM-DD strings
  }
}
