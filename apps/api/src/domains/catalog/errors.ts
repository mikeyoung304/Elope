/**
 * Catalog domain errors
 */

import { NotFoundError } from '../../core/errors';

export class PackageNotFoundError extends NotFoundError {
  constructor(slug: string) {
    super(`Package "${slug}" not found`);
    this.name = 'PackageNotFoundError';
  }
}
