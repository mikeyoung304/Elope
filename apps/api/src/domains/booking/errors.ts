/**
 * Booking domain errors
 */

import { NotFoundError, ConflictError } from '../../core/errors';

export class BookingNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Booking ${id} not found`);
    this.name = 'BookingNotFoundError';
  }
}

export class BookingConflictError extends ConflictError {
  constructor(date: string) {
    super(`Date ${date} is already booked`);
    this.name = 'BookingConflictError';
  }
}
