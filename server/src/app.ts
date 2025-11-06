/**
 * Express application setup
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { randomUUID } from 'crypto';
import swaggerUi from 'swagger-ui-express';
import type { Config } from './lib/core/config';
import { logger } from './lib/core/logger';
import { buildContainer } from './di';
import { createV1Router } from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { skipIfHealth, adminLimiter } from './middleware/rateLimiter';
import { openApiSpec } from './api-docs';

export function createApp(config: Config): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS - Multi-origin support for widget embedding
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        // Whitelist of allowed origins (development + production)
        const allowed = [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://mais.com',
          'https://widget.mais.com',
        ];

        // Allow whitelisted origins or any HTTPS origin in production (for widget embedding)
        if (allowed.includes(origin)) {
          callback(null, true);
        } else if (process.env.NODE_ENV === 'production' && origin.startsWith('https://')) {
          // Allow all HTTPS origins in production (widget embedding on customer sites)
          callback(null, true);
        } else if (process.env.NODE_ENV === 'development') {
          // Allow all origins in development
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      exposedHeaders: ['X-Tenant-Key'], // Allow clients to read this header
    })
  );

  // Rate limiting (skip health/ready endpoints, apply globally)
  app.use(skipIfHealth);

  // Stricter rate limiting for admin routes
  app.use('/v1/admin', adminLimiter);

  // Body parsing
  // IMPORTANT: Stripe webhook needs raw body for signature verification
  // Apply raw body parser to webhook endpoint BEFORE json() middleware
  app.use(
    '/v1/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    requestLogger
  );

  // Apply JSON parsing to all other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request ID + logging middleware (for non-webhook routes)
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Readiness check endpoint
  app.get('/ready', (_req, res): void => {
    const mode = config.ADAPTERS_PRESET;

    if (mode === 'mock') {
      res.json({ ok: true, mode: 'mock' });
      return;
    }

    // Real mode: verify required env vars are present
    const requiredKeys = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'POSTMARK_SERVER_TOKEN',
      'POSTMARK_FROM_EMAIL',
      'GOOGLE_CALENDAR_ID',
      'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64',
    ] as const;

    const missing: string[] = [];
    for (const key of requiredKeys) {
      if (!config[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      res.status(503).json({ ok: false, missing });
      return;
    }

    res.json({ ok: true, mode: 'real' });
  });

  // API Documentation endpoints
  // Serve OpenAPI spec as JSON
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });

  // Serve Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Elope API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  // Mount v1 router
  const container = buildContainer(config);
  createV1Router(container.controllers, container.services.identity, app);

  // Mount dev routes (mock mode only)
  if (config.ADAPTERS_PRESET === 'mock' && container.controllers.dev) {
    logger.info('🧪 Mounting dev simulator routes');

    // POST /v1/dev/simulate-checkout-completed
    app.post('/v1/dev/simulate-checkout-completed', async (req, res, next) => {
      try {
        const reqLogger = res.locals.logger || logger;
        reqLogger.info({ body: req.body }, 'simulate-checkout-completed requested');
        const result = await container.controllers.dev!.simulateCheckoutCompleted(req.body);
        reqLogger.info({ bookingId: result.bookingId }, 'simulate-checkout-completed completed');
        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    });

    // GET /v1/dev/debug-state
    app.get('/v1/dev/debug-state', async (_req, res, next) => {
      try {
        const state = await container.controllers.dev!.getDebugState();
        res.json(state);
      } catch (error) {
        next(error);
      }
    });

    // POST /v1/dev/reset
    app.post('/v1/dev/reset', async (_req, res, next) => {
      try {
        const reqLogger = res.locals.logger || logger;
        reqLogger.info('reset requested');
        await container.controllers.dev!.reset();
        reqLogger.info('reset completed');
        res.status(200).json({ ok: true });
      } catch (error) {
        next(error);
      }
    });
  }

  // 404 handler (must come after all routes)
  app.use(notFoundHandler);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}
