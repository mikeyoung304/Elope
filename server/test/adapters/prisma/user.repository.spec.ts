/**
 * Unit tests for PrismaUserRepository
 * Tests user repository adapter with mocked Prisma client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaUserRepository } from '../../../src/adapters/prisma/user.repository';
import { createMockPrismaClient, type MockPrismaClient } from '../../mocks/prisma.mock';
import { buildUser, sampleAdminUser, platformAdminUser, regularUser } from '../../fixtures/users';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    // Cast to any to bypass type checking for mock
    repository = new PrismaUserRepository(mockPrisma as any);
    vi.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('returns user when exists and is ADMIN', async () => {
      // Arrange
      const user = buildUser({
        email: 'admin@example.com',
        role: 'ADMIN' as any,
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      // Act
      const result = await repository.findByEmail('admin@example.com');

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe('admin@example.com');
      // NOTE: The implementation casts the role but doesn't transform it
      // so it remains uppercase 'ADMIN' from the database
      expect(result?.role).toBe('ADMIN');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('returns null when user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('returns null when user exists but is not ADMIN', async () => {
      // Arrange - user with USER role
      const user = buildUser({
        email: 'user@example.com',
        role: 'USER' as any,
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      // Act
      const result = await repository.findByEmail('user@example.com');

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('returns null for TENANT_ADMIN role', async () => {
      // Arrange - user with TENANT_ADMIN role
      const user = buildUser({
        email: 'tenant@example.com',
        role: 'TENANT_ADMIN' as any,
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      // Act
      const result = await repository.findByEmail('tenant@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('maps user fields correctly to port interface', async () => {
      // Arrange
      const dbUser = buildUser({
        id: 'user_123',
        email: 'admin@test.com',
        passwordHash: '$2a$10$TESTHASHABCDEF123456789012',
        role: 'ADMIN' as any,
      });
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);

      // Act
      const result = await repository.findByEmail('admin@test.com');

      // Assert
      // NOTE: The implementation casts the role but doesn't transform it
      // so it remains uppercase 'ADMIN' from the database
      expect(result).toEqual({
        id: 'user_123',
        email: 'admin@test.com',
        passwordHash: '$2a$10$TESTHASHABCDEF123456789012',
        role: 'ADMIN',
      });
    });
  });

  // NOTE: The following tests are for methods that will be implemented in the future
  // They are included as part of the test suite structure but will be skipped until
  // the repository methods are added.

  describe.skip('create', () => {
    it('creates new user', async () => {
      // TODO: Implement when PrismaUserRepository.create() is added
      // Arrange
      const newUser = buildUser({
        email: 'newadmin@example.com',
        role: 'ADMIN' as any,
      });
      mockPrisma.user.create.mockResolvedValue(newUser);

      // Act
      const result = await (repository as any).create({
        email: 'newadmin@example.com',
        passwordHash: '$2a$10$NEWHASH',
        role: 'ADMIN',
      });

      // Assert
      expect(result.email).toBe('newadmin@example.com');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'newadmin@example.com',
          role: 'ADMIN',
        }),
      });
    });
  });

  describe.skip('update', () => {
    it('updates user role', async () => {
      // TODO: Implement when PrismaUserRepository.update() is added
      // Arrange
      const updatedUser = buildUser({
        id: 'user_123',
        role: 'PLATFORM_ADMIN' as any,
      });
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await (repository as any).update('user_123', {
        role: 'PLATFORM_ADMIN',
      });

      // Assert
      expect(result.role).toBe('PLATFORM_ADMIN');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { role: 'PLATFORM_ADMIN' },
      });
    });
  });

  describe.skip('delete', () => {
    it('soft deletes user', async () => {
      // TODO: Implement when PrismaUserRepository.delete() is added
      // Note: If implementing soft delete, this would update a deletedAt field
      // If hard delete, this would use prisma.user.delete()

      // Arrange
      const deletedUser = buildUser({
        id: 'user_123',
        // Add deletedAt field when schema supports it
      });
      mockPrisma.user.delete.mockResolvedValue(deletedUser);

      // Act
      await (repository as any).delete('user_123');

      // Assert
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user_123' },
      });
    });
  });
});
