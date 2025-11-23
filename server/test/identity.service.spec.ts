/**
 * Unit tests for IdentityService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { IdentityService } from '../src/services/identity.service';
import { FakeUserRepository, buildUser } from './helpers/fakes';
import { UnauthorizedError } from '../src/lib/errors';

describe('IdentityService', () => {
  let service: IdentityService;
  let userRepo: FakeUserRepository;
  const jwtSecret = 'test-secret-key';

  beforeEach(() => {
    userRepo = new FakeUserRepository();
    service = new IdentityService(userRepo, jwtSecret);
  });

  describe('login', () => {
    it('returns token on successful login with correct password', async () => {
      // Arrange: create a user with a known password
      const password = 'correct-password';
      const passwordHash = await bcrypt.hash(password, 10);
      userRepo.addUser(
        buildUser({
          email: 'admin@example.com',
          passwordHash,
        })
      );

      // Act
      const result = await service.login('admin@example.com', password);

      // Assert
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
    });

    it('throws UnauthorizedError on wrong password', async () => {
      // Arrange
      const password = 'correct-password';
      const passwordHash = await bcrypt.hash(password, 10);
      userRepo.addUser(
        buildUser({
          email: 'admin@example.com',
          passwordHash,
        })
      );

      // Act & Assert
      await expect(service.login('admin@example.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('throws UnauthorizedError if user does not exist', async () => {
      // Act & Assert
      await expect(service.login('nonexistent@example.com', 'password')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('returned token contains user information', async () => {
      // Arrange
      const password = 'test-password';
      const passwordHash = await bcrypt.hash(password, 10);
      userRepo.addUser(
        buildUser({
          id: 'user_123',
          email: 'admin@example.com',
          passwordHash,
          role: 'admin',
        })
      );

      // Act
      const result = await service.login('admin@example.com', password);

      // Assert: verify token by decoding it
      const payload = service.verifyToken(result.token);
      expect(payload.userId).toBe('user_123');
      expect(payload.email).toBe('admin@example.com');
      expect(payload.role).toBe('admin');
    });
  });

  describe('verifyToken', () => {
    it('returns payload for valid token', async () => {
      // Arrange: create a valid token
      const password = 'test-password';
      const passwordHash = await bcrypt.hash(password, 10);
      userRepo.addUser(
        buildUser({
          id: 'user_123',
          email: 'admin@example.com',
          passwordHash,
        })
      );
      const { token } = await service.login('admin@example.com', password);

      // Act
      const payload = service.verifyToken(token);

      // Assert
      expect(payload.userId).toBe('user_123');
      expect(payload.email).toBe('admin@example.com');
    });

    it('throws UnauthorizedError for invalid token', () => {
      // Act & Assert
      expect(() => service.verifyToken('invalid-token')).toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for token with wrong secret', async () => {
      // Arrange: create token with different secret
      const otherService = new IdentityService(userRepo, 'different-secret');
      const password = 'test-password';
      const passwordHash = await bcrypt.hash(password, 10);
      userRepo.addUser(buildUser({ email: 'admin@example.com', passwordHash }));
      const { token } = await otherService.login('admin@example.com', password);

      // Act & Assert: verify with original service (different secret)
      expect(() => service.verifyToken(token)).toThrow(UnauthorizedError);
    });
  });

  describe('createToken', () => {
    it('creates valid JWT token with correct payload', () => {
      // Arrange
      const payload = {
        userId: 'user_123',
        email: 'admin@example.com',
        role: 'PLATFORM_ADMIN' as const,
      };

      // Act
      const token = service.createToken(payload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify token payload
      const decoded = service.verifyToken(token);
      expect(decoded.userId).toBe('user_123');
      expect(decoded.email).toBe('admin@example.com');
    });

    it('creates token without impersonation data', () => {
      // Arrange
      const payload = {
        userId: 'user_456',
        email: 'another@example.com',
        role: 'PLATFORM_ADMIN' as const,
      };

      // Act
      const token = service.createToken(payload);
      const decoded = service.verifyToken(token) as any;

      // Assert: should NOT have impersonating field
      expect(decoded.impersonating).toBeUndefined();
    });

    it('token expires after configured duration', () => {
      // Arrange
      const payload = {
        userId: 'user_123',
        email: 'admin@example.com',
        role: 'PLATFORM_ADMIN' as const,
      };

      // Act
      const token = service.createToken(payload);
      const decoded = service.verifyToken(token) as any;

      // Assert: should have exp claim (7 days from now)
      expect(decoded.exp).toBeDefined();
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 5); // 5 second tolerance
    });
  });

  describe('createImpersonationToken', () => {
    it('creates valid JWT token with impersonation data', () => {
      // Arrange
      const payload = {
        userId: 'admin_123',
        email: 'admin@example.com',
        role: 'PLATFORM_ADMIN' as const,
        impersonating: {
          tenantId: 'tenant_456',
          tenantSlug: 'acme-corp',
          tenantEmail: 'tenant@acme.com',
          startedAt: new Date().toISOString(),
        },
      };

      // Act
      const token = service.createImpersonationToken(payload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify token payload
      const decoded = service.verifyToken(token) as any;
      expect(decoded.userId).toBe('admin_123');
      expect(decoded.email).toBe('admin@example.com');
      expect(decoded.impersonating).toBeDefined();
      expect(decoded.impersonating.tenantId).toBe('tenant_456');
      expect(decoded.impersonating.tenantSlug).toBe('acme-corp');
      expect(decoded.impersonating.tenantEmail).toBe('tenant@acme.com');
      expect(decoded.impersonating.startedAt).toBeDefined();
    });

    it('preserves all impersonation metadata', () => {
      // Arrange
      const startTime = new Date('2025-01-01T00:00:00Z').toISOString();
      const payload = {
        userId: 'admin_789',
        email: 'superadmin@example.com',
        role: 'PLATFORM_ADMIN' as const,
        impersonating: {
          tenantId: 'tenant_xyz',
          tenantSlug: 'test-tenant',
          tenantEmail: 'test@tenant.com',
          startedAt: startTime,
        },
      };

      // Act
      const token = service.createImpersonationToken(payload);
      const decoded = service.verifyToken(token) as any;

      // Assert: all impersonation fields preserved
      expect(decoded.impersonating.tenantId).toBe('tenant_xyz');
      expect(decoded.impersonating.tenantSlug).toBe('test-tenant');
      expect(decoded.impersonating.tenantEmail).toBe('test@tenant.com');
      expect(decoded.impersonating.startedAt).toBe(startTime);
    });

    it('token can be verified with verifyToken method', () => {
      // Arrange
      const payload = {
        userId: 'admin_999',
        email: 'admin@platform.com',
        role: 'PLATFORM_ADMIN' as const,
        impersonating: {
          tenantId: 'tenant_abc',
          tenantSlug: 'client-corp',
          tenantEmail: 'client@corp.com',
          startedAt: new Date().toISOString(),
        },
      };

      // Act
      const token = service.createImpersonationToken(payload);

      // Assert: should not throw
      expect(() => service.verifyToken(token)).not.toThrow();
    });

    it('impersonation token expires after configured duration', () => {
      // Arrange
      const payload = {
        userId: 'admin_111',
        email: 'admin@example.com',
        role: 'PLATFORM_ADMIN' as const,
        impersonating: {
          tenantId: 'tenant_222',
          tenantSlug: 'tenant-slug',
          tenantEmail: 'tenant@example.com',
          startedAt: new Date().toISOString(),
        },
      };

      // Act
      const token = service.createImpersonationToken(payload);
      const decoded = service.verifyToken(token) as any;

      // Assert: should have exp claim
      expect(decoded.exp).toBeDefined();
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60;
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 5); // 5 second tolerance
    });
  });
});
