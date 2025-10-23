/**
 * Domain-specific errors
 */

import { UnauthorizedError, ConflictError } from '../lib/core/errors';

// ============================================================================
// Identity Errors
// ============================================================================

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('Invalid or expired token');
    this.name = 'InvalidTokenError';
  }
}

// ============================================================================
// Booking Errors
// ============================================================================

export class BookingConflictError extends ConflictError {
  constructor(date: string) {
    super(`Date ${date} is already booked`);
    this.name = 'BookingConflictError';
  }
}
