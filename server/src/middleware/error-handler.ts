/**
 * Centralized error handling middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/core/logger';
import { DomainError } from '../lib/core/errors';

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    error: 'NotFound',
  });
}

/**
 * Centralized error handler that maps domain errors to HTTP status codes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const reqLogger = res.locals.logger || logger;

  // Map domain errors to HTTP status codes
  if (err instanceof DomainError) {
    reqLogger.info(
      { err: { name: err.name, message: err.message, code: err.code } },
      'Domain error'
    );

    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  // Unknown errors - log full details but hide from client
  reqLogger.error({ err }, 'Unhandled error');

  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
}
