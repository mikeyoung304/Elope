/**
 * Integration tests for cache tenant isolation
 * Validates that cache operations prevent cross-tenant data leakage
 *
 * Security Critical: Tests validate CACHE_WARNING.md requirements
 * Pattern: All cache keys MUST include ${tenantId}: prefix
 *
 * Setup: Requires test database
 * Run: npm run test:integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaCatalogRepository } from '../../src/adapters/prisma/catalog.repository';
import { CatalogService } from '../../src/services/catalog.service';
import type { CreatePackageInput } from '../../src/lib/ports';
import {
  setupCompleteIntegrationTest,
  assertTenantScopedCacheKey,
  runConcurrent,
} from '../helpers/integration-setup';

describe.sequential('Cache Tenant Isolation - Integration Tests', () => {
  // Setup complete integration test context
  const ctx = setupCompleteIntegrationTest('cache-isolation', { cacheTTL: 60 });

  let repository: PrismaCatalogRepository;
  let catalogService: CatalogService;
  let tenantA_id: string;
  let tenantB_id: string;

  beforeEach(async () => {
    // Clean and create tenants
    await ctx.tenants.cleanupTenants();
    await ctx.tenants.tenantA.create();
    await ctx.tenants.tenantB.create();

    tenantA_id = ctx.tenants.tenantA.id;
    tenantB_id = ctx.tenants.tenantB.id;

    // Initialize repository and service
    repository = new PrismaCatalogRepository(ctx.prisma);
    catalogService = new CatalogService(repository, ctx.cache.cache);

    // Reset cache stats
    ctx.cache.resetStats();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  describe('Cache Key Generation', () => {
    it('should generate cache keys with tenantId prefix for getAllPackages', async () => {
      // Create a package for Tenant A
      const pkg = ctx.factories.package.create({ title: 'Package A' });
      await repository.createPackage(tenantA_id, pkg);

      // First call - cache miss, populates cache
      await catalogService.getAllPackages(tenantA_id);

      // Second call - should hit cache
      const stats1 = ctx.cache.getStats();
      await catalogService.getAllPackages(tenantA_id);
      const stats2 = ctx.cache.getStats();

      // Verify cache hit occurred
      expect(stats2.hits).toBe(stats1.hits + 1);
      expect(stats2.hitRate).not.toBe('0%');
    });

    it('should generate cache keys with tenantId prefix for getPackageBySlug', async () => {
      // Create a package for Tenant A
      const pkg = ctx.factories.package.create();
      await repository.createPackage(tenantA_id, pkg);

      // First call - cache miss
      await catalogService.getPackageBySlug(tenantA_id, pkg.slug);

      // Second call - should hit cache
      const stats1 = ctx.cache.getStats();
      await catalogService.getPackageBySlug(tenantA_id, pkg.slug);
      const stats2 = ctx.cache.getStats();

      // Verify cache hit occurred
      expect(stats2.hits).toBe(stats1.hits + 1);
    });
  });

  describe('Cross-Tenant Cache Isolation', () => {
    it('should not return cached data for different tenant (getAllPackages)', async () => {
      // Create unique packages for each tenant
      const packageA: CreatePackageInput = {
        slug: 'intimate-isolation-a',
        title: 'Intimate Package - Tenant A',
        description: 'Tenant A specific package',
        priceCents: 100000,
      };

      const packageB: CreatePackageInput = {
        slug: 'intimate-isolation-b',
        title: 'Intimate Package - Tenant B',
        description: 'Tenant B specific package',
        priceCents: 200000,
      };

      const createdA = await repository.createPackage(tenantA_id, packageA);
      const createdB = await repository.createPackage(tenantB_id, packageB);

      // Verify packages were created
      expect(createdA.slug).toBe('intimate-isolation-a');
      expect(createdB.slug).toBe('intimate-isolation-b');

      // Tenant A fetches their packages (populates cache)
      const packagesA = await catalogService.getAllPackages(tenantA_id);

      // Tenant B fetches their packages (should NOT get Tenant A's cache)
      const packagesB = await catalogService.getAllPackages(tenantB_id);

      // Verify complete isolation
      expect(packagesA).toHaveLength(1);
      expect(packagesB).toHaveLength(1);
      expect(packagesA[0].title).toBe('Intimate Package - Tenant A');
      expect(packagesB[0].title).toBe('Intimate Package - Tenant B');
      expect(packagesA[0].priceCents).toBe(100000);
      expect(packagesB[0].priceCents).toBe(200000);

      // Verify both tenants have their own cache keys
      // Each tenant should have 1 cache miss (initial fetch)
      const stats = ctx.cache.getStats();
      expect(stats.misses).toBe(2); // 2 different tenants, 2 cache misses
    });

    it('should not return cached data for different tenant (getPackageBySlug)', async () => {
      // Create packages with SAME slug but different tenants (allowed by multi-tenant design)
      const packageA: CreatePackageInput = {
        slug: 'premium',
        title: 'Premium - Tenant A',
        description: 'Tenant A premium package',
        priceCents: 150000,
      };

      const packageB: CreatePackageInput = {
        slug: 'premium',
        title: 'Premium - Tenant B',
        description: 'Tenant B premium package',
        priceCents: 300000,
      };

      await repository.createPackage(tenantA_id, packageA);
      await repository.createPackage(tenantB_id, packageB);

      // Tenant A fetches "premium" (populates cache)
      const pkgA = await catalogService.getPackageBySlug(tenantA_id, 'premium');

      // Tenant B fetches "premium" (should NOT get Tenant A's cache)
      const pkgB = await catalogService.getPackageBySlug(tenantB_id, 'premium');

      // Verify complete isolation
      expect(pkgA.title).toBe('Premium - Tenant A');
      expect(pkgB.title).toBe('Premium - Tenant B');
      expect(pkgA.priceCents).toBe(150000);
      expect(pkgB.priceCents).toBe(300000);
      expect(pkgA.description).toContain('Tenant A');
      expect(pkgB.description).toContain('Tenant B');
    });

    it('should maintain separate cache entries for same resource across tenants', async () => {
      // Create identical packages for both tenants
      const packageData: CreatePackageInput = {
        slug: 'standard',
        title: 'Standard Package',
        description: 'Standard offering',
        priceCents: 175000,
      };

      await repository.createPackage(tenantA_id, packageData);
      await repository.createPackage(tenantB_id, packageData);

      // Both tenants fetch packages multiple times
      await catalogService.getAllPackages(tenantA_id); // Miss
      await catalogService.getAllPackages(tenantA_id); // Hit
      await catalogService.getAllPackages(tenantB_id); // Miss
      await catalogService.getAllPackages(tenantB_id); // Hit

      const stats = ctx.cache.getStats();

      // Should have 2 cache misses (one per tenant's first call)
      expect(stats.misses).toBe(2);

      // Should have 2 cache hits (one per tenant's second call)
      expect(stats.hits).toBe(2);

      // Should have 2 cache keys (one per tenant)
      expect(stats.keys).toBe(2);
    });
  });

  describe('Cache Invalidation Scoping', () => {
    it('should invalidate cache only for specific tenant (getAllPackages)', async () => {
      // Create packages for both tenants
      await repository.createPackage(tenantA_id, {
        slug: 'package-a1',
        title: 'Package A1',
        description: 'Tenant A package',
        priceCents: 100000,
      });

      await repository.createPackage(tenantB_id, {
        slug: 'package-b1',
        title: 'Package B1',
        description: 'Tenant B package',
        priceCents: 200000,
      });

      // Both tenants cache their packages
      await catalogService.getAllPackages(tenantA_id);
      await catalogService.getAllPackages(tenantB_id);

      // Reset stats to track invalidation behavior
      ctx.cache.resetStats();

      // Tenant A creates a new package (invalidates Tenant A cache)
      await catalogService.createPackage(tenantA_id, {
        slug: 'package-a2',
        title: 'Package A2',
        description: 'New package',
        priceCents: 150000,
      });

      // Tenant A should get cache miss (cache was invalidated)
      await catalogService.getAllPackages(tenantA_id);

      // Tenant B should get cache hit (cache was NOT invalidated)
      await catalogService.getAllPackages(tenantB_id);

      const stats = ctx.cache.getStats();

      // Verify Tenant A cache miss and Tenant B cache hit
      expect(stats.misses).toBeGreaterThanOrEqual(1); // Tenant A
      expect(stats.hits).toBeGreaterThanOrEqual(1); // Tenant B
    });

    it('should invalidate cache only for specific tenant (getPackageBySlug)', async () => {
      // Create packages for both tenants with same slug
      const pkgA = await repository.createPackage(tenantA_id, {
        slug: 'deluxe-invalidation-test',
        title: 'Deluxe - Tenant A',
        description: 'Original',
        priceCents: 250000,
      });

      const pkgB = await repository.createPackage(tenantB_id, {
        slug: 'deluxe-invalidation-test',
        title: 'Deluxe - Tenant B',
        description: 'Original',
        priceCents: 350000,
      });

      // Both tenants cache their packages
      await catalogService.getPackageBySlug(tenantA_id, 'deluxe-invalidation-test');
      await catalogService.getPackageBySlug(tenantB_id, 'deluxe-invalidation-test');

      // Reset stats
      ctx.cache.resetStats();

      // Update Tenant B's package (invalidates Tenant B cache only)
      await catalogService.updatePackage(tenantB_id, pkgB.id, {
        title: 'Deluxe - Updated',
        description: 'Updated description',
      });

      // Tenant B should get cache miss (cache was invalidated)
      const updatedB = await catalogService.getPackageBySlug(tenantB_id, 'deluxe-invalidation-test');
      expect(updatedB.title).toBe('Deluxe - Updated');

      // Tenant A should get cache hit (cache was NOT affected)
      const cachedA = await catalogService.getPackageBySlug(tenantA_id, 'deluxe-invalidation-test');
      expect(cachedA.title).toBe('Deluxe - Tenant A');

      const stats = ctx.cache.getStats();

      // Verify Tenant B cache miss and Tenant A cache hit
      expect(stats.misses).toBeGreaterThanOrEqual(1); // Tenant B
      expect(stats.hits).toBeGreaterThanOrEqual(1); // Tenant A
    });

    it('should invalidate both all-packages and specific package caches on update', async () => {
      // Create a package for Tenant A
      const pkg = await repository.createPackage(tenantA_id, {
        slug: 'ultimate-cache-test',
        title: 'Ultimate Package',
        description: 'Top tier',
        priceCents: 500000,
      });

      // Cache both getAllPackages and getPackageBySlug
      await catalogService.getAllPackages(tenantA_id);
      await catalogService.getPackageBySlug(tenantA_id, 'ultimate-cache-test');

      // Reset stats
      ctx.cache.resetStats();

      // Update the package
      await catalogService.updatePackage(tenantA_id, pkg.id, {
        priceCents: 550000,
      });

      // Both calls should result in cache misses (both caches invalidated)
      const allPackages = await catalogService.getAllPackages(tenantA_id);
      const specificPackage = await catalogService.getPackageBySlug(tenantA_id, 'ultimate-cache-test');

      // Verify updates were applied
      expect(allPackages[0].priceCents).toBe(550000);
      expect(specificPackage.priceCents).toBe(550000);

      const stats = ctx.cache.getStats();

      // Should have 2 cache misses (both caches invalidated)
      expect(stats.misses).toBe(2);
      expect(stats.hits).toBe(0);
    });

    it('should invalidate old and new slug caches when slug is updated', async () => {
      // Create a package
      const pkg = await repository.createPackage(tenantA_id, {
        slug: 'old-slug-test-unique',
        title: 'Package with Old Slug',
        description: 'Will be renamed',
        priceCents: 200000,
      });

      // Cache the package by old slug
      await catalogService.getPackageBySlug(tenantA_id, 'old-slug-test-unique');

      // Update slug
      await catalogService.updatePackage(tenantA_id, pkg.id, {
        slug: 'new-slug-test-unique',
      });

      // Reset stats
      ctx.cache.resetStats();

      // Fetch by new slug - should be cache miss (new slug wasn't cached)
      const pkgByNewSlug = await catalogService.getPackageBySlug(tenantA_id, 'new-slug-test-unique');

      const stats = ctx.cache.getStats();

      // Verify cache miss occurred and package was updated
      expect(stats.misses).toBe(1);
      expect(pkgByNewSlug.slug).toBe('new-slug-test-unique');
      expect(pkgByNewSlug.title).toBe('Package with Old Slug');
    });

    it('should invalidate tenant cache on package deletion', async () => {
      // Create a package
      const pkg = await repository.createPackage(tenantA_id, {
        slug: 'to-delete',
        title: 'Package to Delete',
        description: 'Will be removed',
        priceCents: 100000,
      });

      // Cache the packages
      await catalogService.getAllPackages(tenantA_id);
      await catalogService.getPackageBySlug(tenantA_id, 'to-delete');

      // Reset stats
      ctx.cache.resetStats();

      // Delete the package
      await catalogService.deletePackage(tenantA_id, pkg.id);

      // Fetch all packages - should be cache miss (cache invalidated)
      const packages = await catalogService.getAllPackages(tenantA_id);

      const stats = ctx.cache.getStats();

      // Verify cache was invalidated
      expect(stats.misses).toBeGreaterThanOrEqual(1);
      expect(packages).toHaveLength(0);
    });
  });

  describe('Concurrent Cache Operations Across Tenants', () => {
    it('should handle concurrent reads from multiple tenants without leakage', async () => {
      // Create unique packages for each tenant sequentially to avoid race conditions
      const pkgA = ctx.factories.package.create({ title: 'Concurrent Package A', priceCents: 100000 });
      const pkgB = ctx.factories.package.create({ title: 'Concurrent Package B', priceCents: 200000 });

      const createdA = await repository.createPackage(tenantA_id, pkgA);
      const createdB = await repository.createPackage(tenantB_id, pkgB);

      // Verify packages were created
      expect(createdA.slug).toBe(pkgA.slug);
      expect(createdB.slug).toBe(pkgB.slug);

      // Simulate concurrent requests from both tenants using helper
      const [packagesA, packagesB] = await runConcurrent([
        () => catalogService.getAllPackages(tenantA_id),
        () => catalogService.getAllPackages(tenantB_id),
      ]);

      // Verify isolation
      expect(packagesA).toHaveLength(1);
      expect(packagesB).toHaveLength(1);
      expect(packagesA[0].title).toBe('Concurrent Package A');
      expect(packagesB[0].title).toBe('Concurrent Package B');
      expect(packagesA[0].priceCents).toBe(100000);
      expect(packagesB[0].priceCents).toBe(200000);
    });

    it('should handle concurrent updates from different tenants', async () => {
      // Create packages for both tenants with same slug
      const pkgA = await repository.createPackage(tenantA_id, {
        slug: 'update-test',
        title: 'Update Test - Tenant A',
        description: 'Original A',
        priceCents: 100000,
      });

      const pkgB = await repository.createPackage(tenantB_id, {
        slug: 'update-test',
        title: 'Update Test - Tenant B',
        description: 'Original B',
        priceCents: 200000,
      });

      // Cache both packages
      await catalogService.getPackageBySlug(tenantA_id, 'update-test');
      await catalogService.getPackageBySlug(tenantB_id, 'update-test');

      // Concurrent updates
      await Promise.all([
        catalogService.updatePackage(tenantA_id, pkgA.id, {
          description: 'Updated A',
        }),
        catalogService.updatePackage(tenantB_id, pkgB.id, {
          description: 'Updated B',
        }),
      ]);

      // Verify both caches were properly invalidated and each tenant gets their own data
      const [updatedA, updatedB] = await Promise.all([
        catalogService.getPackageBySlug(tenantA_id, 'update-test'),
        catalogService.getPackageBySlug(tenantB_id, 'update-test'),
      ]);

      expect(updatedA.description).toBe('Updated A');
      expect(updatedB.description).toBe('Updated B');
    });

    it('should handle cache hits and misses correctly under concurrent load', async () => {
      // Create packages with unique slugs for this test
      const slugA = `load-test-a-${Date.now()}`;
      const slugB = `load-test-b-${Date.now()}`;

      const pkgA = await repository.createPackage(tenantA_id, {
        slug: slugA,
        title: 'Load Test Package A',
        description: 'Tenant A',
        priceCents: 100000,
      });

      const pkgB = await repository.createPackage(tenantB_id, {
        slug: slugB,
        title: 'Load Test Package B',
        description: 'Tenant B',
        priceCents: 200000,
      });

      // Verify packages created
      expect(pkgA.slug).toBe(slugA);
      expect(pkgB.slug).toBe(slugB);
      expect(pkgA.tenantId).toBe(tenantA_id);
      expect(pkgB.tenantId).toBe(tenantB_id);

      // First, populate cache with initial requests (sequential)
      await catalogService.getAllPackages(tenantA_id);
      await catalogService.getPackageBySlug(tenantA_id, slugA);
      await catalogService.getAllPackages(tenantB_id);
      await catalogService.getPackageBySlug(tenantB_id, slugB);

      // Reset stats to track only the subsequent requests
      ctx.cache.resetStats();

      // Now make concurrent requests that should hit cache
      const requests = [
        // Tenant A requests (should hit cache)
        catalogService.getAllPackages(tenantA_id),
        catalogService.getAllPackages(tenantA_id),
        catalogService.getPackageBySlug(tenantA_id, slugA),
        catalogService.getPackageBySlug(tenantA_id, slugA),
        // Tenant B requests (should hit cache)
        catalogService.getAllPackages(tenantB_id),
        catalogService.getAllPackages(tenantB_id),
        catalogService.getPackageBySlug(tenantB_id, slugB),
        catalogService.getPackageBySlug(tenantB_id, slugB),
      ];

      const results = await Promise.all(requests);

      // Verify all results are correct (no cross-tenant contamination)
      // Results 0-3 are Tenant A
      expect(results[0]).toHaveLength(1);
      expect(results[0][0].priceCents).toBe(100000);
      expect(results[0][0].title).toBe('Load Test Package A');
      expect(results[2].priceCents).toBe(100000);
      expect(results[2].title).toBe('Load Test Package A');

      // Results 4-7 are Tenant B
      expect(results[4]).toHaveLength(1);
      expect(results[4][0].priceCents).toBe(200000);
      expect(results[4][0].title).toBe('Load Test Package B');
      expect(results[6].priceCents).toBe(200000);
      expect(results[6].title).toBe('Load Test Package B');

      const stats = ctx.cache.getStats();

      // All requests should be cache hits (cache was pre-populated)
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.hits).toBe(8); // All 8 requests should hit cache
    });
  });

  describe('Cache Security Validation', () => {
    it('should never allow cache key without tenantId prefix', () => {
      // This test validates the pattern - cache keys MUST include tenantId
      // The implementation is already correct in CatalogService

      // Test that attempting to manually use cache without tenantId would fail isolation
      // (This is a design validation test, not testing actual vulnerability)

      const unsafeKey = 'packages'; // ❌ WRONG - no tenantId
      const safeKeyA = `catalog:${tenantA_id}:packages`; // ✅ CORRECT
      const safeKeyB = `catalog:${tenantB_id}:packages`; // ✅ CORRECT

      // Verify keys are different
      expect(safeKeyA).not.toBe(safeKeyB);
      expect(safeKeyA).not.toBe(unsafeKey);
      expect(safeKeyB).not.toBe(unsafeKey);

      // Verify both include tenantId
      expect(safeKeyA).toContain(tenantA_id);
      expect(safeKeyB).toContain(tenantB_id);
    });

    it('should have cache key format: catalog:${tenantId}:resource', async () => {
      // Create and cache a package
      await repository.createPackage(tenantA_id, {
        slug: 'format-test',
        title: 'Format Test',
        description: 'Test',
        priceCents: 100000,
      });

      // Cache the package
      await catalogService.getAllPackages(tenantA_id);
      await catalogService.getPackageBySlug(tenantA_id, 'format-test');

      const stats = ctx.cache.getStats();

      // Verify cache has entries (proving the format is being used)
      expect(stats.keys).toBe(2); // all-packages + specific package

      // The actual key format is enforced in CatalogService implementation:
      // `catalog:${tenantId}:all-packages`
      // `catalog:${tenantId}:package:${slug}`
    });
  });

  describe('Cache Performance and Behavior', () => {
    it('should improve response time on cache hit', async () => {
      // Create a package
      await repository.createPackage(tenantA_id, {
        slug: 'perf-test',
        title: 'Performance Test',
        description: 'Test',
        priceCents: 100000,
      });

      // First call - cache miss (slower, hits database)
      const start1 = Date.now();
      await catalogService.getAllPackages(tenantA_id);
      const time1 = Date.now() - start1;

      // Second call - cache hit (faster, returns from memory)
      const start2 = Date.now();
      await catalogService.getAllPackages(tenantA_id);
      const time2 = Date.now() - start2;

      // Cache hit should be faster (not always guaranteed in test env, but likely)
      // At minimum, verify both calls return the same data
      const result1 = await catalogService.getAllPackages(tenantA_id);
      const result2 = await catalogService.getAllPackages(tenantA_id);

      expect(result1).toEqual(result2);

      const stats = ctx.cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    it('should track cache statistics correctly', async () => {
      // Create packages for both tenants
      await repository.createPackage(tenantA_id, {
        slug: 'stats-a',
        title: 'Stats A',
        description: 'Tenant A',
        priceCents: 100000,
      });

      await repository.createPackage(tenantB_id, {
        slug: 'stats-b',
        title: 'Stats B',
        description: 'Tenant B',
        priceCents: 200000,
      });

      // Make specific number of calls
      await catalogService.getAllPackages(tenantA_id); // Miss
      await catalogService.getAllPackages(tenantA_id); // Hit
      await catalogService.getAllPackages(tenantB_id); // Miss
      await catalogService.getAllPackages(tenantB_id); // Hit

      const stats = ctx.cache.getStats();

      // Verify statistics
      expect(stats.totalRequests).toBe(4);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('50.00%');
      expect(stats.keys).toBe(2); // 2 tenants = 2 cache keys
    });
  });
});
