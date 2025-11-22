/**
 * Tenant Authentication Service
 * Handles tenant admin login and JWT token generation
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { PrismaTenantRepository } from '../adapters/prisma/tenant.repository';
import type { TenantTokenPayload } from '../lib/ports';
import { UnauthorizedError } from '../lib/errors';

export class TenantAuthService {
  constructor(
    private readonly tenantRepo: PrismaTenantRepository,
    private readonly jwtSecret: string
  ) {}

  /**
   * Authenticate tenant admin and generate JWT token
   *
   * @param email - Tenant admin email
   * @param password - Tenant admin password
   * @returns JWT token for tenant authentication
   * @throws UnauthorizedError if credentials are invalid
   */
  async login(email: string, password: string): Promise<{ token: string }> {
    // Find tenant by email
    const tenant = await this.tenantRepo.findByEmail(email);
    if (!tenant) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if tenant has password set
    if (!tenant.passwordHash) {
      throw new UnauthorizedError('Tenant account not configured for login');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, tenant.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if tenant is active
    if (!tenant.isActive) {
      throw new UnauthorizedError('Tenant account is inactive');
    }

    // Generate JWT token with tenant context
    const payload: TenantTokenPayload = {
      tenantId: tenant.id,
      slug: tenant.slug,
      email: tenant.email!,
      type: 'tenant',
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256', // Explicit algorithm prevents confusion attacks
      expiresIn: '7d', // Token expiration (7 days)
    });

    return { token };
  }

  /**
   * Verify and decode tenant JWT token
   *
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws UnauthorizedError if token is invalid or expired
   */
  verifyToken(token: string): TenantTokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'], // Only allow HS256, reject others
      }) as TenantTokenPayload;

      // Verify this is a tenant token
      if (payload.type !== 'tenant') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Hash password for tenant registration/update
   *
   * @param password - Plain text password
   * @returns Bcrypt hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
