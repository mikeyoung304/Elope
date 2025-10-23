/**
 * Authentication middleware for admin routes
 * Verifies JWT tokens and attaches admin user to res.locals
 */

import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../lib/core/errors';
import type { IdentityService } from '../services/identity.service';
import type { TokenPayload } from '../lib/ports';

/**
 * Creates auth middleware that verifies JWT tokens
 */
export function createAuthMiddleware(identityService: IdentityService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const reqLogger = res.locals.logger;

    try {
      // Extract Authorization header
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new UnauthorizedError('Missing Authorization header');
      }

      // Verify Bearer token format
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError('Invalid Authorization header format. Expected: Bearer <token>');
      }

      const token = parts[1];
      if (!token) {
        throw new UnauthorizedError('Missing token');
      }

      // Verify token and extract payload
      const payload: TokenPayload = identityService.verifyToken(token);

      // Attach admin user to res.locals for use in controllers
      res.locals.admin = payload;

      reqLogger?.info({ userId: payload.userId, email: payload.email }, 'Admin authenticated');

      next();
    } catch (error) {
      // Pass authentication errors to error handler
      next(error);
    }
  };
}
