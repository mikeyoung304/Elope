/**
 * Availability domain port
 */

export type AvailabilityReason = 'booked' | 'blackout' | 'calendar';

export interface AvailabilityCheck {
  date: string;
  available: boolean;
  reason?: AvailabilityReason;
}

export interface CalendarProvider {
  isDateAvailable(date: string): Promise<boolean>;
}

export interface BlackoutRepository {
  isBlackoutDate(date: string): Promise<boolean>;
  getAllBlackouts(): Promise<Array<{ date: string; reason?: string }>>;
  addBlackout(date: string, reason?: string): Promise<void>;
}

export interface BookingRepository {
  isDateBooked(date: string): Promise<boolean>;
}
