/**
 * Express application setup
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import type { Config } from './core/config';
import { logger } from './core/logger';
import { buildContainer } from './di';
import { createV1Router } from './http/v1/router';

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

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
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
        await container.controllers.dev!.simulateCheckoutCompleted(req.body);
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

  // Error handling
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      logger.error({ err }, 'Unhandled error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  );

  return app;
}
