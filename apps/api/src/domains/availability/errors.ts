/**
 * Availability domain errors
 */

import { ValidationError } from '../../core/errors';

export class DateNotAvailableError extends ValidationError {
  constructor(date: string, reason?: string) {
    super(`Date ${date} is not available${reason ? `: ${reason}` : ''}`);
    this.name = 'DateNotAvailableError';
  }
}
