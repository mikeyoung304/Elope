/**
 * Dependency injection container
 */

import type { Config } from './lib/core/config';
import { InProcessEventEmitter } from './lib/core/events';
import { CacheService } from './lib/cache';
import { CatalogService } from './services/catalog.service';
import { AvailabilityService } from './services/availability.service';
import { BookingService } from './services/booking.service';
import { IdentityService } from './services/identity.service';
import { PackagesController } from './routes/packages.routes';
import { AvailabilityController } from './routes/availability.routes';
import { BookingsController } from './routes/bookings.routes';
import { WebhooksController } from './routes/webhooks.routes';
import { AdminController } from './routes/admin.routes';
import { BlackoutsController } from './routes/blackouts.routes';
import { AdminPackagesController } from './routes/admin-packages.routes';
import { DevController } from './routes/dev.routes';
import { buildMockAdapters } from './adapters/mock';
import { PrismaClient } from './generated/prisma';
import {
  PrismaCatalogRepository,
  PrismaBookingRepository,
  PrismaBlackoutRepository,
  PrismaUserRepository,
  PrismaWebhookRepository,
} from './adapters/prisma';
import { StripePaymentAdapter } from './adapters/stripe.adapter';
import { PostmarkMailAdapter } from './adapters/postmark.adapter';
import { GoogleCalendarAdapter } from './adapters/gcal.adapter';
import { logger } from './lib/core/logger';

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

  // Initialize cache service (15 minute default TTL)
  const cacheService = new CacheService(900);
  logger.info('✅ Cache service initialized with 900s TTL');

  if (config.ADAPTERS_PRESET === 'mock') {
    logger.info('🧪 Using MOCK adapters');

    // Build mock adapters
    const adapters = buildMockAdapters();

    // Build domain services with caching
    const catalogService = new CatalogService(adapters.catalogRepo, cacheService);
    const availabilityService = new AvailabilityService(
      adapters.calendarProvider,
      adapters.blackoutRepo,
      adapters.bookingRepo
    );
    const bookingService = new BookingService(
      adapters.bookingRepo,
      adapters.catalogRepo,
      eventEmitter,
      adapters.paymentProvider
    );
    const identityService = new IdentityService(adapters.userRepo, config.JWT_SECRET);

    // Build controllers
    const controllers = {
      packages: new PackagesController(catalogService),
      availability: new AvailabilityController(availabilityService),
      bookings: new BookingsController(bookingService),
      webhooks: new WebhooksController(adapters.paymentProvider, bookingService, adapters.webhookRepo),
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
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['query', 'error', 'warn'],
    // Connection pool handled by Prisma/Supabase automatically
    // Recommended for serverless: 1-5 connections per instance
    // Prisma default: (num_physical_cpus * 2) + effective_spindle_count
  });

  // Add slow query monitoring
  if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query' as never, ((e: { duration: number; query: string }) => {
      if (e.duration > 1000) {
        logger.warn({ duration: e.duration, query: e.query }, 'Slow query detected (>1s)');
      }
    }) as never);
  }

  // Build real repository adapters
  const catalogRepo = new PrismaCatalogRepository(prisma);
  const bookingRepo = new PrismaBookingRepository(prisma);
  const blackoutRepo = new PrismaBlackoutRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  const webhookRepo = new PrismaWebhookRepository(prisma);

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

  // Build domain services with caching
  const catalogService = new CatalogService(catalogRepo, cacheService);
  const availabilityService = new AvailabilityService(
    calendarProvider,
    blackoutRepo,
    bookingRepo
  );
  const bookingService = new BookingService(bookingRepo, catalogRepo, eventEmitter, paymentProvider);
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
    webhooks: new WebhooksController(paymentProvider, bookingService, webhookRepo),
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
