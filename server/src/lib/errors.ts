/**
 * Domain-specific errors
 */

import {
  UnauthorizedError,
  ConflictError,
  UnprocessableEntityError,
  DomainError,
} from '../lib/core/errors';

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

export class BookingLockTimeoutError extends ConflictError {
  constructor(date: string) {
    super(`Could not acquire lock on booking date (timeout): ${date}`);
    this.name = 'BookingLockTimeoutError';
  }
}

// ============================================================================
// Webhook Errors
// ============================================================================

export class WebhookValidationError extends UnprocessableEntityError {
  constructor(message: string) {
    super(`Webhook validation failed: ${message}`);
    this.name = 'WebhookValidationError';
  }
}

export class WebhookProcessingError extends DomainError {
  constructor(message: string) {
    super(`Webhook processing failed: ${message}`, 'WEBHOOK_PROCESSING_ERROR', 500);
    this.name = 'WebhookProcessingError';
  }
}
