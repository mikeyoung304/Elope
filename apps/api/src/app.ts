/**
 * Express application setup
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { randomUUID } from 'crypto';
import type { Config } from './core/config';
import { logger } from './core/logger';
import { buildContainer } from './di';
import { createV1Router } from './http/v1/router';
import { errorHandler, notFoundHandler } from './http/middleware/error-handler';
import { requestLogger } from './http/middleware/request-logger';

export function createApp(config: Config): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request ID + logging middleware
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

  // Mount v1 router
  const container = buildContainer(config);
  createV1Router(container.controllers, app);

  // Mount dev routes (mock mode only)
  if (config.ADAPTERS_PRESET === 'mock' && container.controllers.dev) {
    logger.info('🧪 Mounting dev simulator routes');

    // POST /v1/dev/simulate-checkout-completed
    app.post('/v1/dev/simulate-checkout-completed', async (req, res, next) => {
      try {
        const reqLogger = res.locals.logger || logger;
        reqLogger.info({ body: req.body }, 'simulate-checkout-completed requested');
        await container.controllers.dev!.simulateCheckoutCompleted(req.body);
        reqLogger.info('simulate-checkout-completed completed');
        res.status(204).send();
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
  }

  // 404 handler (must come after all routes)
  app.use(notFoundHandler);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}
