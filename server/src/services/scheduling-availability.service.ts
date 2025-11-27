/**
 * Scheduling Availability Service
 *
 * Generates available time slots for time-based scheduling (Acuity-like booking).
 * Handles timezone conversion, rule-based slot generation, and conflict detection.
 */

import type { BookingRepository } from '../lib/ports';

// ============================================================================
// Repository Interfaces (to be added to ports.ts)
// ============================================================================

/**
 * Service entity - represents a bookable service/appointment type
 */
export interface SchedulingService {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  timezone: string; // IANA timezone (e.g., "America/New_York")
  active: boolean;
  segmentId?: string;
}

/**
 * Availability rule entity - defines when services are available
 */
export interface AvailabilityRule {
  id: string;
  tenantId: string;
  serviceId: string | null; // null = applies to all services
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "09:00" (in tenant timezone)
  endTime: string; // "17:00" (in tenant timezone)
  effectiveFrom: Date;
  effectiveTo: Date | null; // null = indefinite
}

/**
 * Booking entity extended for time-slot bookings
 */
export interface TimeSlotBooking {
  id: string;
  tenantId: string;
  serviceId: string;
  customerId: string;
  date: Date; // Date portion only
  startTime: Date; // Full UTC timestamp
  endTime: Date; // Full UTC timestamp
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'FULFILLED';
}

/**
 * Service Repository interface
 */
export interface ServiceRepository {
  findById(tenantId: string, serviceId: string): Promise<SchedulingService | null>;
  findBySlug(tenantId: string, slug: string): Promise<SchedulingService | null>;
  findAll(tenantId: string, options?: { active?: boolean }): Promise<SchedulingService[]>;
}

/**
 * Availability Rule Repository interface
 */
export interface AvailabilityRuleRepository {
  findByService(tenantId: string, serviceId: string, date: Date): Promise<AvailabilityRule[]>;
  findEffectiveRules(tenantId: string, serviceId: string | null, date: Date): Promise<AvailabilityRule[]>;
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Time slot with availability status
 */
export interface TimeSlot {
  startTime: Date; // UTC timestamp
  endTime: Date; // UTC timestamp
  available: boolean;
}

/**
 * Parameters for getting available slots
 */
export interface GetAvailableSlotsParams {
  tenantId: string;
  serviceId: string;
  date: Date; // The date to check (can be in any timezone, will use service timezone)
}

// ============================================================================
// Scheduling Availability Service
// ============================================================================

export class SchedulingAvailabilityService {
  constructor(
    private readonly serviceRepo: ServiceRepository,
    private readonly availabilityRuleRepo: AvailabilityRuleRepository,
    private readonly bookingRepo: BookingRepository
  ) {}

  /**
   * Get available time slots for a service on a specific date
   *
   * MULTI-TENANT: Scoped to tenantId for data isolation
   *
   * Algorithm:
   * 1. Fetch service details (duration, buffer, timezone)
   * 2. Get effective availability rules for the date and service
   * 3. Generate all possible slots based on rules
   * 4. Fetch existing bookings for that date
   * 5. Mark slots as unavailable if they conflict with bookings
   *
   * @param params - Service, tenant, and date parameters
   * @returns Array of time slots with availability status
   *
   * @example
   * ```typescript
   * const slots = await service.getAvailableSlots({
   *   tenantId: 'tenant_123',
   *   serviceId: 'service_abc',
   *   date: new Date('2025-06-15')
   * });
   * // Returns: [
   * //   { startTime: Date('2025-06-15T14:00:00Z'), endTime: Date('2025-06-15T14:30:00Z'), available: true },
   * //   { startTime: Date('2025-06-15T14:30:00Z'), endTime: Date('2025-06-15T15:00:00Z'), available: false },
   * //   ...
   * // ]
   * ```
   */
  async getAvailableSlots(params: GetAvailableSlotsParams): Promise<TimeSlot[]> {
    const { tenantId, serviceId, date } = params;

    // 1. Get service details
    const service = await this.serviceRepo.findById(tenantId, serviceId);
    if (!service) {
      return []; // Service not found, no slots available
    }

    if (!service.active) {
      return []; // Inactive service, no slots available
    }

    // 2. Get effective availability rules for this service and date
    const rules = await this.availabilityRuleRepo.findEffectiveRules(
      tenantId,
      serviceId,
      date
    );

    if (rules.length === 0) {
      return []; // No availability rules, no slots available
    }

    // 3. Generate all possible slots from rules
    const allSlots = this.generateSlotsFromRules(
      rules,
      date,
      service.durationMinutes,
      service.bufferMinutes,
      service.timezone
    );

    if (allSlots.length === 0) {
      return []; // No slots generated (date doesn't match any rules)
    }

    // 4. Get existing bookings for this date
    // We need to get all TIMESLOT bookings for this tenant on this date
    // Note: BookingRepository needs a method for this, using placeholder here
    const existingBookings = await this.getTimeslotBookings(tenantId, date);

    // 5. Filter out conflicting slots
    const availableSlots = this.filterConflictingSlots(allSlots, existingBookings);

    return availableSlots;
  }

  /**
   * Generate time slots from availability rules
   *
   * Converts rule times (in tenant timezone) to UTC slots.
   * Creates slots at regular intervals based on service duration.
   * Ensures slots don't extend past rule end time.
   *
   * @param rules - Effective availability rules
   * @param date - Target date (timezone-agnostic)
   * @param durationMinutes - Service duration
   * @param bufferMinutes - Buffer time after service
   * @param timezone - Tenant timezone (IANA format)
   * @returns Array of time slots in UTC
   *
   * @private
   */
  private generateSlotsFromRules(
    rules: AvailabilityRule[],
    date: Date,
    durationMinutes: number,
    bufferMinutes: number,
    timezone: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

    // Filter rules that apply to this day of week
    const applicableRules = rules.filter(rule => rule.dayOfWeek === dayOfWeek);

    for (const rule of applicableRules) {
      // Parse rule times (in tenant timezone)
      const [startHour, startMinute] = rule.startTime.split(':').map(Number);
      const [endHour, endMinute] = rule.endTime.split(':').map(Number);

      // Create Date objects for rule start/end in tenant timezone
      // We'll use the date parameter and manually set hours/minutes
      // Then convert to UTC for storage
      const ruleStart = this.createDateInTimezone(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        startHour,
        startMinute,
        timezone
      );

      const ruleEnd = this.createDateInTimezone(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        endHour,
        endMinute,
        timezone
      );

      // Generate slots at regular intervals
      let currentSlotStart = new Date(ruleStart);
      const slotDuration = durationMinutes + bufferMinutes; // Total time per slot

      while (currentSlotStart < ruleEnd) {
        // Calculate slot end time (just the service duration, not including buffer)
        const slotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60 * 1000);

        // Only add slot if it fits completely within the rule window
        if (slotEnd <= ruleEnd) {
          slots.push({
            startTime: new Date(currentSlotStart),
            endTime: slotEnd,
            available: true, // Default to available, will be filtered later
          });
        }

        // Move to next slot (service duration + buffer)
        currentSlotStart = new Date(currentSlotStart.getTime() + slotDuration * 60 * 1000);
      }
    }

    // Sort slots by start time
    slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return slots;
  }

  /**
   * Filter out slots that conflict with existing bookings
   *
   * A slot conflicts if:
   * - It overlaps with an existing booking's time range
   * - The existing booking is not CANCELED
   *
   * @param slots - Generated slots
   * @param existingBookings - Existing bookings for the date
   * @returns Slots with availability updated based on conflicts
   *
   * @private
   */
  private filterConflictingSlots(
    slots: TimeSlot[],
    existingBookings: TimeSlotBooking[]
  ): TimeSlot[] {
    // Filter to only confirmed/pending bookings (exclude canceled)
    const activeBookings = existingBookings.filter(
      booking => booking.status === 'CONFIRMED' || booking.status === 'PENDING'
    );

    return slots.map(slot => {
      // Check if this slot conflicts with any booking
      const hasConflict = activeBookings.some(booking => {
        // Slots conflict if they overlap in time
        // Overlap occurs if: slot.start < booking.end AND slot.end > booking.start
        return (
          slot.startTime < booking.endTime &&
          slot.endTime > booking.startTime
        );
      });

      return {
        ...slot,
        available: !hasConflict,
      };
    });
  }

  /**
   * Create a Date object in a specific timezone
   *
   * This is a simplified timezone handler. For production, consider using a library
   * like date-fns-tz or Luxon for more robust timezone handling.
   *
   * @param year - Year
   * @param month - Month (0-11)
   * @param day - Day of month
   * @param hour - Hour (0-23)
   * @param minute - Minute (0-59)
   * @param timezone - IANA timezone string
   * @returns Date object in UTC representing the local time in the specified timezone
   *
   * @private
   */
  private createDateInTimezone(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timezone: string
  ): Date {
    // Create ISO string in the format: YYYY-MM-DDTHH:MM
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

    // Use Intl.DateTimeFormat to handle timezone conversion
    // This is a workaround until we add a proper timezone library
    try {
      // Parse the date string as if it's in the specified timezone
      // Then convert to UTC
      const localDate = new Date(dateStr);

      // Get the timezone offset for the target timezone
      // We'll use a trick: format the date in the target timezone and parse it back
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Create a date at the same wall-clock time in UTC
      const utcDate = new Date(Date.UTC(year, month, day, hour, minute, 0));

      // Get the formatted string in the target timezone
      const parts = formatter.formatToParts(utcDate);
      const tzYear = parseInt(parts.find(p => p.type === 'year')!.value);
      const tzMonth = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
      const tzDay = parseInt(parts.find(p => p.type === 'day')!.value);
      const tzHour = parseInt(parts.find(p => p.type === 'hour')!.value);
      const tzMinute = parseInt(parts.find(p => p.type === 'minute')!.value);

      // Calculate the offset in milliseconds
      const offset = utcDate.getTime() - new Date(tzYear, tzMonth, tzDay, tzHour, tzMinute, 0).getTime();

      // Apply the offset to our target date
      return new Date(Date.UTC(year, month, day, hour, minute, 0) - offset);
    } catch (error) {
      // Fallback: treat as UTC if timezone conversion fails
      return new Date(Date.UTC(year, month, day, hour, minute, 0));
    }
  }

  /**
   * Get all TIMESLOT bookings for a specific date
   *
   * MULTI-TENANT: Filtered by tenantId
   *
   * Note: This is a placeholder. The BookingRepository needs to be extended
   * to support querying TIMESLOT bookings by date range.
   *
   * @param tenantId - Tenant ID
   * @param date - Target date
   * @returns Array of time-slot bookings
   *
   * @private
   */
  private async getTimeslotBookings(
    tenantId: string,
    date: Date
  ): Promise<TimeSlotBooking[]> {
    // For now, return empty array
    // This method should be implemented when the Booking repository is extended
    // to support TIMESLOT booking queries

    // TODO: Extend BookingRepository with:
    // findTimeslotBookings(tenantId: string, date: Date): Promise<TimeSlotBooking[]>

    // Example implementation would be:
    // return this.bookingRepo.findTimeslotBookings(tenantId, date);

    return [];
  }

  /**
   * Check if a specific time slot is available
   *
   * Convenience method to check a single slot without generating all slots.
   *
   * @param tenantId - Tenant ID
   * @param serviceId - Service ID
   * @param startTime - Slot start time (UTC)
   * @param endTime - Slot end time (UTC)
   * @returns True if slot is available
   *
   * @example
   * ```typescript
   * const isAvailable = await service.isSlotAvailable(
   *   'tenant_123',
   *   'service_abc',
   *   new Date('2025-06-15T14:00:00Z'),
   *   new Date('2025-06-15T14:30:00Z')
   * );
   * ```
   */
  async isSlotAvailable(
    tenantId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    // Get the date portion
    const date = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());

    // Get existing bookings for this date
    const existingBookings = await this.getTimeslotBookings(tenantId, date);

    // Filter to active bookings
    const activeBookings = existingBookings.filter(
      booking => booking.status === 'CONFIRMED' || booking.status === 'PENDING'
    );

    // Check for conflicts
    const hasConflict = activeBookings.some(booking => {
      return (
        startTime < booking.endTime &&
        endTime > booking.startTime
      );
    });

    return !hasConflict;
  }

  /**
   * Get next available slot for a service
   *
   * Finds the earliest available time slot starting from the given date.
   * Useful for "book next available" functionality.
   *
   * @param tenantId - Tenant ID
   * @param serviceId - Service ID
   * @param fromDate - Search from this date (inclusive)
   * @param maxDaysAhead - Maximum days to search (default: 30)
   * @returns Next available slot or null if none found
   *
   * @example
   * ```typescript
   * const nextSlot = await service.getNextAvailableSlot(
   *   'tenant_123',
   *   'service_abc',
   *   new Date(),
   *   30
   * );
   * if (nextSlot) {
   *   console.log(`Next available: ${nextSlot.startTime}`);
   * }
   * ```
   */
  async getNextAvailableSlot(
    tenantId: string,
    serviceId: string,
    fromDate: Date,
    maxDaysAhead: number = 30
  ): Promise<TimeSlot | null> {
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < maxDaysAhead; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);

      const slots = await this.getAvailableSlots({
        tenantId,
        serviceId,
        date: checkDate,
      });

      // Find first available slot
      const availableSlot = slots.find(slot => slot.available);
      if (availableSlot) {
        return availableSlot;
      }
    }

    return null; // No available slots in the search window
  }
}
