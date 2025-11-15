/**
 * Unit tests for TenantAuthService
 *
 * Tests tenant authentication and JWT token management including:
 * - Login with valid credentials
 * - Login error handling (invalid credentials, inactive accounts)
 * - JWT token generation and verification
 * - Token expiration and invalid token handling
 * - Password hashing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantAuthService } from '../../src/services/tenant-auth.service';
import { UnauthorizedError } from '../../src/lib/core/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('TenantAuthService', () => {
  let service: TenantAuthService;
  let tenantRepo: any;
  const jwtSecret = 'test-jwt-secret-key';

  beforeEach(() => {
    // Mock tenant repository
    tenantRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };

    service = new TenantAuthService(tenantRepo, jwtSecret);
  });

  describe('login', () => {
    it('authenticates tenant with valid credentials and returns JWT token', async () => {
      // Arrange
      const email = 'admin@vendor.com';
      const password = 'secure-password-123';
      const passwordHash = await bcrypt.hash(password, 10);

      tenantRepo.findByEmail.mockResolvedValue({
        id: 'tenant_123',
        slug: 'vendor-slug',
        email,
        passwordHash,
        isActive: true,
      });

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');

      // Verify JWT token payload
      const decoded = jwt.verify(result.token, jwtSecret) as any;
      expect(decoded.tenantId).toBe('tenant_123');
      expect(decoded.slug).toBe('vendor-slug');
      expect(decoded.email).toBe(email);
      expect(decoded.type).toBe('tenant');

      // Verify token has expiration
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('rejects login for non-existent tenant', async () => {
      // Arrange
      tenantRepo.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login('nonexistent@example.com', 'password')).rejects.toThrow(
        UnauthorizedError
      );

      await expect(service.login('nonexistent@example.com', 'password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('rejects login for tenant without password hash', async () => {
      // Arrange - tenant exists but no password configured
      tenantRepo.findByEmail.mockResolvedValue({
        id: 'tenant_no_password',
        slug: 'no-password-slug',
        email: 'admin@vendor.com',
        passwordHash: null, // No password set
        isActive: true,
      });

      // Act & Assert
      await expect(service.login('admin@vendor.com', 'password')).rejects.toThrow(
        UnauthorizedError
      );

      await expect(service.login('admin@vendor.com', 'password')).rejects.toThrow(
        'Tenant account not configured for login'
      );
    });

    it('rejects login with incorrect password', async () => {
      // Arrange
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';
      const passwordHash = await bcrypt.hash(correctPassword, 10);

      tenantRepo.findByEmail.mockResolvedValue({
        id: 'tenant_123',
        slug: 'vendor-slug',
        email: 'admin@vendor.com',
        passwordHash,
        isActive: true,
      });

      // Act & Assert
      await expect(service.login('admin@vendor.com', wrongPassword)).rejects.toThrow(
        UnauthorizedError
      );

      await expect(service.login('admin@vendor.com', wrongPassword)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('rejects login for inactive tenant', async () => {
      // Arrange
      const password = 'password-123';
      const passwordHash = await bcrypt.hash(password, 10);

      tenantRepo.findByEmail.mockResolvedValue({
        id: 'tenant_inactive',
        slug: 'inactive-slug',
        email: 'admin@inactive.com',
        passwordHash,
        isActive: false, // Tenant is inactive
      });

      // Act & Assert
      await expect(service.login('admin@inactive.com', password)).rejects.toThrow(
        UnauthorizedError
      );

      await expect(service.login('admin@inactive.com', password)).rejects.toThrow(
        'Tenant account is inactive'
      );
    });
  });

  describe('verifyToken', () => {
    it('verifies and decodes valid JWT token', () => {
      // Arrange
      const payload = {
        tenantId: 'tenant_123',
        slug: 'vendor-slug',
        email: 'admin@vendor.com',
        type: 'tenant' as const,
      };

      const token = jwt.sign(payload, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '7d',
      });

      // Act
      const result = service.verifyToken(token);

      // Assert
      expect(result.tenantId).toBe('tenant_123');
      expect(result.slug).toBe('vendor-slug');
      expect(result.email).toBe('admin@vendor.com');
      expect(result.type).toBe('tenant');
    });

    it('rejects invalid JWT token', () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act & Assert
      expect(() => service.verifyToken(invalidToken)).toThrow(UnauthorizedError);
      expect(() => service.verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('rejects expired JWT token', () => {
      // Arrange - create token that expired 1 hour ago
      const payload = {
        tenantId: 'tenant_123',
        slug: 'vendor-slug',
        email: 'admin@vendor.com',
        type: 'tenant' as const,
      };

      const expiredToken = jwt.sign(payload, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '-1h', // Expired 1 hour ago
      });

      // Act & Assert
      expect(() => service.verifyToken(expiredToken)).toThrow(UnauthorizedError);
      expect(() => service.verifyToken(expiredToken)).toThrow('Invalid or expired token');
    });

    it('rejects token with wrong type', () => {
      // Arrange - create token with wrong type
      const payload = {
        tenantId: 'tenant_123',
        slug: 'vendor-slug',
        email: 'admin@vendor.com',
        type: 'user' as const, // Wrong type - should be 'tenant'
      };

      const token = jwt.sign(payload, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '7d',
      });

      // Act & Assert
      expect(() => service.verifyToken(token)).toThrow(UnauthorizedError);
      expect(() => service.verifyToken(token)).toThrow('Invalid token type');
    });

    it('rejects token signed with different secret', () => {
      // Arrange - create token with different secret
      const payload = {
        tenantId: 'tenant_123',
        slug: 'vendor-slug',
        email: 'admin@vendor.com',
        type: 'tenant' as const,
      };

      const differentSecret = 'different-secret-key';
      const tokenWithWrongSecret = jwt.sign(payload, differentSecret, {
        algorithm: 'HS256',
        expiresIn: '7d',
      });

      // Act & Assert
      expect(() => service.verifyToken(tokenWithWrongSecret)).toThrow(UnauthorizedError);
      expect(() => service.verifyToken(tokenWithWrongSecret)).toThrow('Invalid or expired token');
    });
  });

  describe('hashPassword', () => {
    it('hashes password using bcrypt', async () => {
      // Arrange
      const plainPassword = 'my-secure-password-123';

      // Act
      const hashedPassword = await service.hashPassword(plainPassword);

      // Assert
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      // bcrypt hash format - can be $2a$ or $2b$ depending on bcryptjs version
      expect(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')).toBe(true);

      // Verify the hash can be used to verify the password
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('generates different hashes for same password (salt)', async () => {
      // Arrange
      const password = 'same-password';

      // Act
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      // Assert - hashes should be different due to salt
      expect(hash1).not.toBe(hash2);

      // But both should be valid for the same password
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });
});
