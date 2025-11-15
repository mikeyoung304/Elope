/**
 * Enhanced error handling utilities
 * Extends the existing error infrastructure with additional convenience classes
 */

import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../core/errors';
import { logger } from '../core/logger';

// ============================================================================
// Extended Error Classes (additional convenience classes)
// ============================================================================

/**
 * Base application error (alias for DomainError for consistency)
 */
export class AppError extends DomainError {
  constructor(
    statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    const code = `ERROR_${statusCode}`;
    super(message, code, statusCode);
    this.name = 'AppError';
  }
}

/**
 * Generic validation error (400)
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

// ============================================================================
// Error Response Formatting
// ============================================================================

export interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  code?: string;
  requestId?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Formats an error into a standardized API response
 */
export function formatErrorResponse(
  error: Error,
  requestId?: string
): ErrorResponse {
  if (error instanceof DomainError) {
    return {
      status: 'error',
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      requestId,
    };
  }

  // Unknown errors - hide details in production
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    status: 'error',
    statusCode: 500,
    message: isDev ? error.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId,
  };
}

// ============================================================================
// Express Error Middleware (enhanced version)
// ============================================================================

/**
 * Enhanced error middleware with request ID support
 * This extends the existing error handler with additional features
 */
export function enhancedErrorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const reqLogger = res.locals.logger || logger;
  const requestId = res.locals.requestId;

  // Log error
  if (err instanceof DomainError) {
    reqLogger.info(
      { err: { name: err.name, message: err.message, code: err.code } },
      'Domain error'
    );
  } else {
    reqLogger.error({ err }, 'Unhandled error');
  }

  // Format response
  const response = formatErrorResponse(err, requestId);

  // Send response
  res.status(response.statusCode).json(response);
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Wraps an async route handler to catch errors and pass to next()
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Checks if an error is operational (safe to expose to client)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  if (error instanceof DomainError) {
    return true; // All domain errors are operational
  }
  return false;
}
