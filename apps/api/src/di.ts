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
import { AdminPackagesController } from './http/v1/admin-packages.http';
import { DevController } from './http/v1/dev.http';
import { buildMockAdapters } from './adapters/mock';
import { logger } from './core/logger';

export interface Container {
  controllers: {
    packages: PackagesController;
    availability: AvailabilityController;
    bookings: BookingsController;
    webhooks: WebhooksController;
    admin: AdminController;
    blackouts: BlackoutsController;
    adminPackages: AdminPackagesController;
    dev?: DevController;
  };
  services: {
    identity: IdentityService;
  };
}

export function buildContainer(config: Config): Container {
  const eventEmitter = new InProcessEventEmitter();

  if (config.ADAPTERS_PRESET === 'mock') {
    logger.info('🧪 Using MOCK adapters');

    // Build mock adapters
    const adapters = buildMockAdapters();

    // Build domain services
    const catalogService = new CatalogService(adapters.catalogRepo);
    const availabilityService = new AvailabilityService(
      adapters.calendarProvider,
      adapters.blackoutRepo,
      adapters.bookingRepo
    );
    const bookingService = new BookingService(
      adapters.bookingRepo,
      adapters.catalogRepo,
      eventEmitter
    );
    const identityService = new IdentityService(adapters.userRepo, config.JWT_SECRET);

    // Build controllers
    const controllers = {
      packages: new PackagesController(catalogService),
      availability: new AvailabilityController(availabilityService),
      bookings: new BookingsController(bookingService),
      webhooks: new WebhooksController(),
      admin: new AdminController(identityService, bookingService),
      blackouts: new BlackoutsController(adapters.blackoutRepo),
      adminPackages: new AdminPackagesController(catalogService),
      dev: new DevController(bookingService, adapters.catalogRepo),
    };

    const services = {
      identity: identityService,
    };

    return { controllers, services };
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
