/**
 * Mock Prisma Client for unit tests
 * Provides vitest mock functions for Prisma operations
 */

import { vi } from 'vitest';

/**
 * Creates a mock PrismaClient with all common operations
 */
export function createMockPrismaClient() {
  return {
    tenant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    package: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    addOn: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

/**
 * Type helper for mock Prisma client
 */
export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;
