/**
 * Tenant Authentication Routes
 * Handles tenant admin login endpoints
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import type { TenantAuthService } from '../services/tenant-auth.service';

/**
 * Tenant login DTO
 */
export interface TenantLoginDto {
  email: string;
  password: string;
}

/**
 * Controller for tenant authentication operations
 */
export class TenantAuthController {
  constructor(private readonly tenantAuthService: TenantAuthService) {}

  /**
   * Tenant admin login
   * Authenticates tenant and returns JWT token
   *
   * @param input - Login credentials (email, password)
   * @returns JWT token for tenant authentication
   */
  async login(input: TenantLoginDto): Promise<{ token: string }> {
    return this.tenantAuthService.login(input.email, input.password);
  }

  /**
   * Get current tenant info from token
   * Useful for verifying token and getting tenant context
   *
   * @param tenantId - Tenant ID from JWT token (res.locals.tenantAuth)
   * @param slug - Tenant slug from JWT token
   * @param email - Tenant email from JWT token
   * @returns Tenant information
   */
  async getCurrentTenant(tenantId: string, slug: string, email: string): Promise<{
    tenantId: string;
    slug: string;
    email: string;
  }> {
    return { tenantId, slug, email };
  }
}

/**
 * Create tenant authentication routes
 * Exports a router factory that requires TenantAuthService
 */
export function createTenantAuthRoutes(tenantAuthService: TenantAuthService): Router {
  const router = Router();
  const controller = new TenantAuthController(tenantAuthService);

  /**
   * POST /login
   * Authenticate tenant and receive JWT token (public endpoint)
   */
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await controller.login({ email, password });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /me
   * Get current tenant info (requires authentication)
   * Note: Authentication is handled by checking res.locals.tenantAuth
   * The parent router should apply tenantAuthMiddleware to protect this route
   */
  router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantAuth = (res.locals as any).tenantAuth;

      if (!tenantAuth) {
        res.status(401).json({ error: 'Unauthorized: No tenant authentication' });
        return;
      }

      const result = await controller.getCurrentTenant(
        tenantAuth.tenantId,
        tenantAuth.slug,
        tenantAuth.email
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
