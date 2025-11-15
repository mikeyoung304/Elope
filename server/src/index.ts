/**
 * API server entry point
 */

import { loadConfig } from './lib/core/config';
import { logger } from './lib/core/logger';
import { initSentry } from './lib/errors/sentry';
import { createApp } from './app';

async function main(): Promise<void> {
  try {
    const config = loadConfig();
    logger.info('Configuration loaded');

    // Initialize Sentry error tracking (optional - gracefully degrades if no DSN)
    initSentry();

    const app = createApp(config);

    const server = app.listen(config.API_PORT, () => {
      logger.info(`🚀 API listening on :${config.API_PORT}`);
      logger.info(`📝 ADAPTERS_PRESET: ${config.ADAPTERS_PRESET}`);
      logger.info(`🔒 CORS_ORIGIN: ${config.CORS_ORIGIN}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

main();
