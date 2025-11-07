/**
 * Tenant authentication middleware
 * Verifies tenant JWT tokens and attaches tenant context to res.locals
 */

import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../lib/core/errors';
import type { TenantAuthService } from '../services/tenant-auth.service';
import type { TenantTokenPayload } from '../lib/ports';

/**
 * Creates tenant auth middleware that verifies JWT tokens
 * This is separate from platform admin auth and API key auth
 */
export function createTenantAuthMiddleware(tenantAuthService: TenantAuthService) {
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
      const payload: TenantTokenPayload = tenantAuthService.verifyToken(token);

      // Attach tenant context to res.locals for use in controllers
      res.locals.tenantAuth = payload;

      reqLogger?.info(
        { tenantId: payload.tenantId, slug: payload.slug, email: payload.email },
        'Tenant authenticated'
      );

      next();
    } catch (error) {
      // Pass authentication errors to error handler
      next(error);
    }
  };
}
