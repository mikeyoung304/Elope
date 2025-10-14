/**
 * Dependency injection container
 */

import type { Config } from './core/config';
import { InProcessEventEmitter } from './core/events';
import { CatalogService } from './domains/catalog/service';
import { AvailabilityService } from './domains/availability/service';
import { BookingService } from './domains/booking/service';
import { IdentityService } from './domains/identity/service';
import { PackagesController } from './http/v1/packages.http';
import { AvailabilityController } from './http/v1/availability.http';
import { BookingsController } from './http/v1/bookings.http';
import { WebhooksController } from './http/v1/webhooks.http';
import { AdminController } from './http/v1/admin.http';
import { BlackoutsController } from './http/v1/blackouts.http';

export interface Container {
  controllers: {
    packages: PackagesController;
    availability: AvailabilityController;
    bookings: BookingsController;
    webhooks: WebhooksController;
    admin: AdminController;
    blackouts: BlackoutsController;
  };
}

export function buildContainer(config: Config): Container {
  const eventEmitter = new InProcessEventEmitter();

  if (config.ADAPTERS_PRESET === 'mock') {
    // TODO: Implement mock adapters in next step
    throw new Error('Mock adapters not yet implemented - will be added in next step');
  }

  // Real adapters mode
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL required for real adapters mode');
  }
  if (!config.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY required for real adapters mode');
  }

  // TODO: Implement real adapters
  throw new Error('Real adapters not yet implemented');
}
