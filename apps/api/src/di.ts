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
import { PrismaClient } from './generated/prisma';
import {
  PrismaCatalogRepository,
  PrismaBookingRepository,
  PrismaBlackoutRepository,
  PrismaUserRepository,
} from './adapters/prisma';
import { StripePaymentAdapter } from './adapters/stripe.adapter';
import { PostmarkMailAdapter } from './adapters/postmark.adapter';
import { GoogleCalendarAdapter } from './adapters/gcal.adapter';
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
      webhooks: new WebhooksController(adapters.paymentProvider, bookingService),
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
  logger.info('🚀 Using REAL adapters with Prisma + PostgreSQL + Stripe');

  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL required for real adapters mode');
  }

  // Initialize Prisma Client
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  // Build real repository adapters
  const catalogRepo = new PrismaCatalogRepository(prisma);
  const bookingRepo = new PrismaBookingRepository(prisma);
  const blackoutRepo = new PrismaBlackoutRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);

  // Build Stripe payment adapter
  if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET required for real adapters mode');
  }

  const paymentProvider = new StripePaymentAdapter({
    secretKey: config.STRIPE_SECRET_KEY,
    webhookSecret: config.STRIPE_WEBHOOK_SECRET,
    successUrl: config.STRIPE_SUCCESS_URL || 'http://localhost:5173/success',
    cancelUrl: config.STRIPE_CANCEL_URL || 'http://localhost:5173',
  });

  // Build Postmark mail adapter (with file-sink fallback when no token)
  const mailProvider = new PostmarkMailAdapter({
    serverToken: config.POSTMARK_SERVER_TOKEN,
    fromEmail: config.POSTMARK_FROM_EMAIL || 'bookings@example.com',
  });

  // Build Google Calendar adapter (or fallback to mock if creds missing)
  let calendarProvider;
  if (config.GOOGLE_CALENDAR_ID && config.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    logger.info('📅 Using Google Calendar adapter');
    calendarProvider = new GoogleCalendarAdapter({
      calendarId: config.GOOGLE_CALENDAR_ID,
      serviceAccountJsonBase64: config.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
    });
  } else {
    logger.warn('⚠️  Google Calendar credentials not configured; using mock calendar (all dates available)');
    const mockAdapters = buildMockAdapters();
    calendarProvider = mockAdapters.calendarProvider;
  }

  // Build domain services
  const catalogService = new CatalogService(catalogRepo);
  const availabilityService = new AvailabilityService(
    calendarProvider,
    blackoutRepo,
    bookingRepo
  );
  const bookingService = new BookingService(bookingRepo, catalogRepo, eventEmitter);
  const identityService = new IdentityService(userRepo, config.JWT_SECRET);

  // Subscribe to BookingPaid events to send confirmation emails
  eventEmitter.subscribe<{
    bookingId: string;
    email: string;
    coupleName: string;
    eventDate: string;
    packageTitle: string;
    addOnTitles: string[];
    totalCents: number;
  }>('BookingPaid', async (payload) => {
    try {
      await mailProvider.sendBookingConfirm(payload.email, {
        eventDate: payload.eventDate,
        packageTitle: payload.packageTitle,
        totalCents: payload.totalCents,
        addOnTitles: payload.addOnTitles,
      });
    } catch (err) {
      logger.error({ err, bookingId: payload.bookingId }, 'Failed to send booking confirmation email');
    }
  });

  // Build controllers
  const controllers = {
    packages: new PackagesController(catalogService),
    availability: new AvailabilityController(availabilityService),
    bookings: new BookingsController(bookingService),
    webhooks: new WebhooksController(paymentProvider, bookingService),
    admin: new AdminController(identityService, bookingService),
    blackouts: new BlackoutsController(blackoutRepo),
    adminPackages: new AdminPackagesController(catalogService),
    // No dev controller in real mode
  };

  const services = {
    identity: identityService,
  };

  return { controllers, services };
}
