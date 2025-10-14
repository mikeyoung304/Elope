/**
 * Booking domain port
 */

import type { Booking, CreateBookingInput } from './entities';

export interface BookingRepository {
  create(booking: Booking): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findAll(): Promise<Booking[]>;
  isDateBooked(date: string): Promise<boolean>;
}
