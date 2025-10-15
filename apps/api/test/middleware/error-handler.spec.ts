/**
 * Error handler middleware unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/http/middleware/error-handler';
import {
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  UnprocessableEntityError,
} from '../../src/core/errors';
import { BookingConflictError } from '../../src/domains/booking/errors';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    // Mock Express request/response
    req = {};

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      locals: {
        logger: {
          info: vi.fn(),
          error: vi.fn(),
        },
      },
    };

    next = vi.fn();
  });

  describe('Domain Error Mapping', () => {
    it('should map NotFoundError to 404', () => {
      const error = new NotFoundError('Resource not found');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'Resource not found',
      });
    });

    it('should map ValidationError to 400', () => {
      const error = new ValidationError('Invalid input');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
      });
    });

    it('should map UnauthorizedError to 401', () => {
      const error = new UnauthorizedError('Invalid token');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    });

    it('should map ForbiddenError to 403', () => {
      const error = new ForbiddenError('Access denied');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Access denied',
      });
    });

    it('should map ConflictError to 409', () => {
      const error = new ConflictError('Resource already exists');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'CONFLICT',
        message: 'Resource already exists',
      });
    });

    it('should map UnprocessableEntityError to 422', () => {
      const error = new UnprocessableEntityError('Invalid webhook signature');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: 'UNPROCESSABLE_ENTITY',
        message: 'Invalid webhook signature',
      });
    });

    it('should map custom DomainError to specified status code', () => {
      const error = new DomainError('Custom error', 'CUSTOM_ERROR', 418);

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({
        error: 'CUSTOM_ERROR',
        message: 'Custom error',
      });
    });
  });

  describe('Booking-specific Errors', () => {
    it('should map BookingConflictError to 409', () => {
      const error = new BookingConflictError('2025-12-25');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'CONFLICT',
        message: 'Date 2025-12-25 is already booked',
      });
    });
  });

  describe('Unknown Error Handling', () => {
    it('should map generic Error to 500', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
      });
    });

    it('should log unknown errors with full details', () => {
      const error = new Error('Database connection failed');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.locals!.logger.error).toHaveBeenCalledWith(
        { err: error },
        'Unhandled error'
      );
    });

    it('should hide unknown error details from client', () => {
      const error = new Error('Secret internal details');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
      });
      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Secret internal details',
        })
      );
    });
  });

  describe('Logging Behavior', () => {
    it('should log domain errors at info level', () => {
      const error = new ConflictError('Duplicate booking');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.locals!.logger.info).toHaveBeenCalledWith(
        {
          err: {
            name: 'ConflictError',
            message: 'Duplicate booking',
            code: 'CONFLICT',
          },
        },
        'Domain error'
      );
    });

    it('should log unknown errors at error level', () => {
      const error = new Error('Unexpected failure');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.locals!.logger.error).toHaveBeenCalledWith(
        { err: error },
        'Unhandled error'
      );
    });

    it('should use fallback logger if res.locals.logger is missing', () => {
      res.locals = {}; // No logger

      const error = new NotFoundError('Not found');

      // Should not throw
      expect(() => {
        errorHandler(error, req as Request, res as Response, next);
      }).not.toThrow();

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Response Format', () => {
    it('should always return JSON format', () => {
      const error = new ValidationError('Bad request');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should include error code and message in response', () => {
      const error = new ConflictError('Already exists');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          message: expect.any(String),
        })
      );
    });
  });
});
