/**
 * Identity domain errors
 */

import { UnauthorizedError } from '../../core/errors';

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
