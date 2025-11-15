/**
 * Unit tests for IdempotencyService
 *
 * Tests key generation, storage, race condition handling, and response caching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdempotencyService } from '../../src/services/idempotency.service';
import type { PrismaClient } from '../../src/generated/prisma';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let mockPrisma: any;

  beforeEach(() => {
    // Create a mock Prisma client
    mockPrisma = {
      idempotencyKey: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    service = new IdempotencyService(mockPrisma as unknown as PrismaClient);
  });

  describe('generateKey - Key Generation', () => {
    it('should create deterministic SHA-256 hash', () => {
      // Act
      const key = service.generateKey('checkout', 'tenant_123', 'session_abc');

      // Assert
      expect(key).toMatch(/^checkout_[a-f0-9]{32}$/); // prefix_hash format
      expect(key.length).toBe(41); // "checkout_" (9) + 32 hex chars
    });

    it('should produce same key for same inputs', () => {
      // Act
      const key1 = service.generateKey('checkout', 'tenant_123', 'session_abc');
      const key2 = service.generateKey('checkout', 'tenant_123', 'session_abc');

      // Assert
      expect(key1).toBe(key2);
    });

    it('should produce different keys for different inputs', () => {
      // Act
      const key1 = service.generateKey('checkout', 'tenant_123', 'session_abc');
      const key2 = service.generateKey('checkout', 'tenant_456', 'session_abc'); // Different tenant
      const key3 = service.generateKey('refund', 'tenant_123', 'session_abc'); // Different prefix

      // Assert
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('checkAndStore - Check and Store', () => {
    it('should store new key successfully', async () => {
      // Arrange
      const key = 'checkout_abc123';
      mockPrisma.idempotencyKey.create.mockResolvedValue({
        id: 'idem_1',
        key,
        response: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      // Act
      const isNew = await service.checkAndStore(key);

      // Assert
      expect(isNew).toBe(true);
      expect(mockPrisma.idempotencyKey.create).toHaveBeenCalledWith({
        data: {
          key,
          response: null,
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should return false for duplicate key', async () => {
      // Arrange - Simulate Prisma unique constraint error (P2002)
      const key = 'checkout_duplicate';
      const duplicateError = {
        code: 'P2002',
        meta: {
          target: ['key'],
        },
      };
      mockPrisma.idempotencyKey.create.mockRejectedValue(duplicateError);

      // Act
      const isNew = await service.checkAndStore(key);

      // Assert
      expect(isNew).toBe(false);
    });

    it('should handle race condition (P2002 error)', async () => {
      // Arrange - Two concurrent requests for same key
      const key = 'checkout_race';
      const raceConditionError = {
        code: 'P2002',
        meta: {
          target: ['key'],
        },
      };

      let firstCall = true;
      mockPrisma.idempotencyKey.create.mockImplementation(() => {
        if (firstCall) {
          firstCall = false;
          return Promise.resolve({
            id: 'idem_1',
            key,
            response: null,
            expiresAt: new Date(),
            createdAt: new Date(),
          });
        }
        return Promise.reject(raceConditionError);
      });

      // Act - Simulate two concurrent calls
      const [result1, result2] = await Promise.all([
        service.checkAndStore(key),
        service.checkAndStore(key),
      ]);

      // Assert - First call succeeds, second fails with P2002
      expect([result1, result2].sort()).toEqual([false, true]);
    });
  });

  describe('getStoredResponse - Response Caching', () => {
    it('should return cached response', async () => {
      // Arrange
      const key = 'checkout_cached';
      const cachedResponse = {
        data: { sessionId: 'cs_123', url: 'https://checkout.stripe.com/...' },
        timestamp: new Date().toISOString(),
      };

      mockPrisma.idempotencyKey.findUnique.mockResolvedValue({
        id: 'idem_1',
        key,
        response: JSON.stringify(cachedResponse),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in future
        createdAt: new Date(),
      });

      // Act
      const result = await service.getStoredResponse(key);

      // Assert
      expect(result).toEqual(cachedResponse);
      expect(mockPrisma.idempotencyKey.findUnique).toHaveBeenCalledWith({
        where: { key },
      });
    });

    it('should return null for expired key', async () => {
      // Arrange
      const key = 'checkout_expired';
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago

      mockPrisma.idempotencyKey.findUnique.mockResolvedValue({
        id: 'idem_1',
        key,
        response: JSON.stringify({ data: 'old' }),
        expiresAt: expiredDate,
        createdAt: new Date(),
      });

      mockPrisma.idempotencyKey.delete.mockResolvedValue({});

      // Act
      const result = await service.getStoredResponse(key);

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.idempotencyKey.delete).toHaveBeenCalledWith({
        where: { key },
      });
    });

    it('should update response for existing key', async () => {
      // Arrange
      const key = 'checkout_update';
      const response = {
        data: { sessionId: 'cs_456', url: 'https://...' },
        timestamp: new Date().toISOString(),
      };

      mockPrisma.idempotencyKey.update.mockResolvedValue({
        id: 'idem_1',
        key,
        response: JSON.stringify(response),
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      // Act
      await service.updateResponse(key, response);

      // Assert
      expect(mockPrisma.idempotencyKey.update).toHaveBeenCalledWith({
        where: { key },
        data: {
          response: JSON.stringify(response),
        },
      });
    });
  });

  describe('generateCheckoutKey - Specialized Keys', () => {
    it('should include timestamp rounding', () => {
      // Arrange
      const tenantId = 'tenant_123';
      const email = 'john@example.com';
      const packageId = 'pkg_basic';
      const eventDate = '2025-07-01';
      const timestamp1 = 1700000000000; // Specific timestamp
      const timestamp2 = 1700000005000; // 5 seconds later (within 10s window)

      // Act
      const key1 = service.generateCheckoutKey(
        tenantId,
        email,
        packageId,
        eventDate,
        timestamp1
      );
      const key2 = service.generateCheckoutKey(
        tenantId,
        email,
        packageId,
        eventDate,
        timestamp2
      );

      // Assert - Same key because timestamps round to same 10-second window
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^checkout_[a-f0-9]{32}$/);

      // Different timestamp (outside 10s window)
      const timestamp3 = 1700000015000; // 15 seconds later
      const key3 = service.generateCheckoutKey(
        tenantId,
        email,
        packageId,
        eventDate,
        timestamp3
      );

      // Should be different key
      expect(key3).not.toBe(key1);
    });
  });
});
