/**
 * Pino logger with request ID support
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
    },
  },
});

export type Logger = typeof logger;

export function createRequestLogger(requestId: string): Logger {
  return logger.child({ requestId });
}
