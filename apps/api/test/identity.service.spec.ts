/**
 * Unit tests for IdentityService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { IdentityService } from '../src/domains/identity/service';
import { FakeUserRepository, buildUser } from './helpers/fakes';
import { UnauthorizedError } from '../src/core/errors';

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
});
