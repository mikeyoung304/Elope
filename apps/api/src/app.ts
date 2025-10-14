/**
 * Express application setup
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import type { Config } from './core/config';
import { logger } from './core/logger';

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
  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  // TODO: Mount v1 router once mock adapters are implemented
  // const container = buildContainer(config);
  // const v1Router = createV1Router(container.controllers);
  // app.use(v1Router);

  app.get('/', (req, res) => {
    res.json({
      message: 'Elope API',
      version: '1.0.0',
      note: 'V1 routes will be mounted once mock adapters are implemented',
    });
  });

  // Error handling
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      logger.error({ err }, 'Unhandled error');
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  );

  return app;
}
