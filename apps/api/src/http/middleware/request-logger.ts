/**
 * Request logging middleware with requestId
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../../core/logger';

/**
 * Adds a unique requestId to each request and creates a child logger
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = randomUUID();
  const reqLogger = logger.child({ requestId });

  // Store logger in res.locals for use in route handlers
  res.locals.logger = reqLogger;
  res.locals.requestId = requestId;

  // Log request start
  reqLogger.info(
    {
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
    },
    'Request started'
  );

  // Capture response finish time
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    reqLogger.info(
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });

  next();
}
