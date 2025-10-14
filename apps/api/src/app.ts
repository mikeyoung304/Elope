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
