/**
 * Booking domain entities
 */

export type BookingStatus = 'PAID' | 'REFUNDED' | 'CANCELED';

export interface Booking {
  id: string;
  packageId: string;
  coupleName: string;
  email: string;
  phone?: string;
  eventDate: string;
  addOnIds: string[];
  totalCents: number;
  status: BookingStatus;
  createdAt: string;
}

export interface CreateBookingInput {
  packageId: string;
  coupleName: string;
  email: string;
  eventDate: string;
  addOnIds?: string[];
}
