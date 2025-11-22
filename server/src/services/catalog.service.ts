/**
 * Catalog domain service
 */

import type {
  CatalogRepository,
  CreatePackageInput,
  UpdatePackageInput,
  CreateAddOnInput,
  UpdateAddOnInput,
} from '../lib/ports';
import type { Package, AddOn } from '../lib/entities';
import { NotFoundError, ValidationError } from '../lib/errors';
import type { CacheService } from '../lib/cache';
import { validatePrice, validateRequiredFields } from '../lib/validation';
import type { AuditService } from './audit.service';

export interface PackageWithAddOns extends Package {
  addOns: AddOn[];
}

/**
 * Optional audit context for tracking who made changes
 * TODO: Replace with proper auth context from middleware in Sprint 3
 */
export interface AuditContext {
  userId?: string;
  email: string;
  role: 'PLATFORM_ADMIN' | 'TENANT_ADMIN';
}

export class CatalogService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly cache?: CacheService,
    private readonly auditService?: AuditService
  ) {}

  /**
   * Retrieves all wedding packages with their add-ons for a tenant
   *
   * MULTI-TENANT: Filters packages by tenantId for data isolation
   * Uses optimized single-query method to avoid N+1 problem (91% query reduction).
   * Implements application-level caching with 15-minute TTL for performance.
   * Cache keys include tenantId to prevent cross-tenant cache leaks.
   * Critical for catalog page performance.
   *
   * @param tenantId - Tenant ID for data isolation
   * @returns Array of packages with nested add-ons
   *
   * @example
   * ```typescript
   * const packages = await catalogService.getAllPackages('tenant_123');
   * // Returns: [{ id: 'pkg1', title: 'Intimate', addOns: [...] }, ...]
   * ```
   */
  async getAllPackages(tenantId: string): Promise<PackageWithAddOns[]> {
    // CRITICAL: Cache key includes tenantId to prevent cross-tenant data leaks
    const cacheKey = `catalog:${tenantId}:all-packages`;

    // Try cache first
    const cached = this.cache?.get<PackageWithAddOns[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from repository with tenant isolation
    const packages = await this.repository.getAllPackagesWithAddOns(tenantId);

    // Cache for 15 minutes (900 seconds)
    this.cache?.set(cacheKey, packages, 900);

    return packages;
  }

  /**
   * Retrieves a single package by slug with its add-ons for a tenant
   *
   * MULTI-TENANT: Scoped to tenantId to prevent cross-tenant access
   * Uses application-level caching with 15-minute TTL.
   * Used for package detail pages and checkout flow.
   *
   * @param tenantId - Tenant ID for data isolation
   * @param slug - Package URL slug (e.g., "intimate-ceremony")
   *
   * @returns Package with nested add-ons array
   *
   * @throws {NotFoundError} If package doesn't exist for this tenant
   *
   * @example
   * ```typescript
   * const pkg = await catalogService.getPackageBySlug('tenant_123', 'intimate-ceremony');
   * console.log(`${pkg.title}: $${pkg.priceCents / 100}`);
   * ```
   */
  async getPackageBySlug(tenantId: string, slug: string): Promise<PackageWithAddOns> {
    // CRITICAL: Cache key includes tenantId
    const cacheKey = `catalog:${tenantId}:package:${slug}`;

    // Try cache first
    const cached = this.cache?.get<PackageWithAddOns>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from repository with tenant isolation
    const pkg = await this.repository.getPackageBySlug(tenantId, slug);
    if (!pkg) {
      throw new NotFoundError(`Package with slug "${slug}" not found`);
    }
    const addOns = await this.repository.getAddOnsByPackageId(tenantId, pkg.id);
    const result = { ...pkg, addOns };

    // Cache for 15 minutes
    this.cache?.set(cacheKey, result, 900);

    return result;
  }

  /**
   * Retrieves a single package by ID for a tenant
   *
   * MULTI-TENANT: Scoped to tenantId to prevent cross-tenant access
   * Used for tenant admin operations (photo upload, editing).
   * Returns package without add-ons for performance.
   *
   * @param tenantId - Tenant ID for data isolation
   * @param id - Package ID
   *
   * @returns Package or null if not found for this tenant
   *
   * @example
   * ```typescript
   * const pkg = await catalogService.getPackageById('tenant_123', 'pkg_abc');
   * if (!pkg) throw new Error('Not found');
   * console.log(`Found: ${pkg.title}`);
   * ```
   */
  async getPackageById(tenantId: string, id: string): Promise<Package | null> {
    return this.repository.getPackageById(tenantId, id);
  }

  // Package CRUD operations
  // NOTE: These methods will need tenantId parameter and repository updates
  // after multi-tenant migration is applied

  async createPackage(
    tenantId: string,
    data: CreatePackageInput,
    auditCtx?: AuditContext
  ): Promise<Package> {
    // Validate required fields
    validateRequiredFields(data, ['slug', 'title', 'description'], 'Package');
    validatePrice(data.priceCents, 'priceCents');

    // Check slug uniqueness within tenant
    const existing = await this.repository.getPackageBySlug(tenantId, data.slug);
    if (existing) {
      throw new ValidationError(`Package with slug "${data.slug}" already exists`);
    }

    const result = await this.repository.createPackage(tenantId, data);

    // Audit log (Sprint 2.1 - legacy CRUD tracking during migration)
    if (this.auditService && auditCtx) {
      await this.auditService.trackLegacyChange({
        tenantId,
        changeType: 'package_crud',
        operation: 'create',
        entityType: 'Package',
        entityId: result.id,
        userId: auditCtx.userId,
        email: auditCtx.email,
        role: auditCtx.role,
        beforeSnapshot: null, // No previous state for creates
        afterSnapshot: result,
      });
    }

    // Invalidate catalog cache for this tenant
    this.invalidateCatalogCache(tenantId);

    return result;
  }

  async updatePackage(
    tenantId: string,
    id: string,
    data: UpdatePackageInput,
    auditCtx?: AuditContext
  ): Promise<Package> {
    // Check if package exists
    const existing = await this.repository.getPackageById(tenantId, id);
    if (!existing) {
      throw new NotFoundError(`Package with id "${id}" not found`);
    }

    // Validate price if provided
    if (data.priceCents !== undefined) {
      validatePrice(data.priceCents, 'priceCents');
    }

    // Check slug uniqueness if slug is being updated
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await this.repository.getPackageBySlug(tenantId, data.slug);
      if (slugTaken) {
        throw new ValidationError(`Package with slug "${data.slug}" already exists`);
      }
    }

    const result = await this.repository.updatePackage(tenantId, id, data);

    // Audit log (Sprint 2.1 - legacy CRUD tracking during migration)
    if (this.auditService && auditCtx) {
      await this.auditService.trackLegacyChange({
        tenantId,
        changeType: 'package_crud',
        operation: 'update',
        entityType: 'Package',
        entityId: result.id,
        userId: auditCtx.userId,
        email: auditCtx.email,
        role: auditCtx.role,
        beforeSnapshot: existing,
        afterSnapshot: result,
      });
    }

    // Invalidate catalog cache (both old and potentially new slug)
    this.invalidateCatalogCache(tenantId);
    this.invalidatePackageCache(tenantId, existing.slug);
    if (data.slug && data.slug !== existing.slug) {
      this.invalidatePackageCache(tenantId, data.slug);
    }

    return result;
  }

  async deletePackage(
    tenantId: string,
    id: string,
    auditCtx?: AuditContext
  ): Promise<void> {
    // Check if package exists
    const existing = await this.repository.getPackageById(tenantId, id);
    if (!existing) {
      throw new NotFoundError(`Package with id "${id}" not found`);
    }

    await this.repository.deletePackage(tenantId, id);

    // Audit log (Sprint 2.1 - legacy CRUD tracking during migration)
    if (this.auditService && auditCtx) {
      await this.auditService.trackLegacyChange({
        tenantId,
        changeType: 'package_crud',
        operation: 'delete',
        entityType: 'Package',
        entityId: id,
        userId: auditCtx.userId,
        email: auditCtx.email,
        role: auditCtx.role,
        beforeSnapshot: existing,
        afterSnapshot: null, // Entity no longer exists
      });
    }

    // Invalidate catalog cache
    this.invalidateCatalogCache(tenantId);
    this.invalidatePackageCache(tenantId, existing.slug);
  }

  // AddOn CRUD operations

  async createAddOn(tenantId: string, data: CreateAddOnInput): Promise<AddOn> {
    // Validate required fields
    validateRequiredFields(data, ['packageId', 'title'], 'AddOn');
    validatePrice(data.priceCents, 'priceCents');

    // Verify package exists
    const pkg = await this.repository.getPackageById(tenantId, data.packageId);
    if (!pkg) {
      throw new NotFoundError(`Package with id "${data.packageId}" not found`);
    }

    const result = await this.repository.createAddOn(tenantId, data);

    // Invalidate catalog cache (affects package details)
    this.invalidateCatalogCache(tenantId);
    this.invalidatePackageCache(tenantId, pkg.slug);

    return result;
  }

  async updateAddOn(tenantId: string, id: string, data: UpdateAddOnInput): Promise<AddOn> {
    // Check if add-on exists
    // Note: We need a way to get add-on by ID, but since the port doesn't have it,
    // we'll let the repository handle the NotFound case

    // Validate price if provided
    if (data.priceCents !== undefined) {
      validatePrice(data.priceCents, 'priceCents');
    }

    // Verify package exists if packageId is being updated
    if (data.packageId) {
      const pkg = await this.repository.getPackageById(tenantId, data.packageId);
      if (!pkg) {
        throw new NotFoundError(`Package with id "${data.packageId}" not found`);
      }
    }

    const result = await this.repository.updateAddOn(tenantId, id, data);

    // Invalidate catalog cache
    this.invalidateCatalogCache(tenantId);

    return result;
  }

  async deleteAddOn(tenantId: string, id: string): Promise<void> {
    // Repository will throw NotFoundError if add-on doesn't exist
    await this.repository.deleteAddOn(tenantId, id);

    // Invalidate catalog cache
    this.invalidateCatalogCache(tenantId);
  }

  // ============================================================================
  // SEGMENT-SCOPED CATALOG METHODS (Phase A - Segment Implementation)
  // ============================================================================

  /**
   * Get packages for a specific segment
   *
   * MULTI-TENANT: Scoped by tenantId and segmentId
   * Used for segment landing pages
   * Implements application-level caching with 15-minute TTL
   * Packages ordered by groupingOrder for proper display (e.g., Solo/Couple/Group)
   *
   * @param tenantId - Tenant ID for data isolation
   * @param segmentId - Segment ID to filter packages
   * @returns Array of packages ordered by groupingOrder then createdAt
   *
   * @example
   * ```typescript
   * const packages = await catalogService.getPackagesBySegment('tenant_123', 'wellness-retreat-id');
   * // Returns: [{ id: 'pkg1', title: 'Weekend Detox', grouping: 'Solo', ... }, ...]
   * ```
   */
  async getPackagesBySegment(tenantId: string, segmentId: string): Promise<Package[]> {
    // CRITICAL: Cache key includes tenantId AND segmentId
    const cacheKey = `catalog:${tenantId}:segment:${segmentId}:packages`;

    // Try cache first
    const cached = this.cache?.get<Package[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from repository
    const packages = await this.repository.getPackagesBySegment(tenantId, segmentId);

    // Cache for 15 minutes (900 seconds)
    this.cache?.set(cacheKey, packages, 900);

    return packages;
  }

  /**
   * Get packages with add-ons for a specific segment
   *
   * MULTI-TENANT: Scoped by tenantId and segmentId
   * Returns packages with both segment-specific and global add-ons
   * Used for segment landing pages to display complete offering
   *
   * @param tenantId - Tenant ID for data isolation
   * @param segmentId - Segment ID to filter packages
   * @returns Array of packages with add-ons, ordered by grouping
   *
   * @example
   * ```typescript
   * const packages = await catalogService.getPackagesBySegmentWithAddOns('tenant_123', 'wellness-retreat-id');
   * // Returns: [
   * //   { id: 'pkg1', title: 'Weekend Detox', addOns: [
   * //     { title: 'Farm-Fresh Meals' },      // Global add-on (segmentId = null)
   * //     { title: 'Yoga Session' }            // Wellness-specific add-on
   * //   ]},
   * //   ...
   * // ]
   * ```
   */
  async getPackagesBySegmentWithAddOns(
    tenantId: string,
    segmentId: string
  ): Promise<PackageWithAddOns[]> {
    // CRITICAL: Cache key includes tenantId AND segmentId
    const cacheKey = `catalog:${tenantId}:segment:${segmentId}:packages-with-addons`;

    // Try cache first
    const cached = this.cache?.get<PackageWithAddOns[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from repository
    const packages = await this.repository.getPackagesBySegmentWithAddOns(tenantId, segmentId);

    // Cache for 15 minutes (900 seconds)
    this.cache?.set(cacheKey, packages, 900);

    return packages;
  }

  /**
   * Get add-ons available for a segment
   *
   * Returns both:
   * - Add-ons scoped to this specific segment (segmentId = specified)
   * - Global add-ons available to all segments (segmentId = null)
   *
   * Used for segment landing pages and package detail pages within a segment
   *
   * @param tenantId - Tenant ID for data isolation
   * @param segmentId - Segment ID to filter add-ons
   * @returns Array of add-ons ordered by createdAt
   *
   * @example
   * ```typescript
   * const addOns = await catalogService.getAddOnsForSegment('tenant_123', 'wellness-retreat-id');
   * // Returns: [
   * //   { title: 'Farm-Fresh Meals', priceCents: 15000 },  // Global
   * //   { title: 'Yoga Session', priceCents: 7500 }        // Wellness-specific
   * // ]
   * ```
   */
  async getAddOnsForSegment(tenantId: string, segmentId: string): Promise<AddOn[]> {
    // CRITICAL: Cache key includes tenantId AND segmentId
    const cacheKey = `catalog:${tenantId}:segment:${segmentId}:addons`;

    // Try cache first
    const cached = this.cache?.get<AddOn[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from repository
    const addOns = await this.repository.getAddOnsForSegment(tenantId, segmentId);

    // Cache for 15 minutes (900 seconds)
    this.cache?.set(cacheKey, addOns, 900);

    return addOns;
  }

  /**
   * Invalidate all catalog-related cache entries for a tenant
   * MULTI-TENANT: Only invalidates cache for the specified tenant
   *
   * NOTE: This does NOT invalidate segment-scoped caches. Use
   * invalidateSegmentCatalogCache() for segment-specific invalidation.
   *
   * @param tenantId - Tenant whose cache should be invalidated
   */
  private invalidateCatalogCache(tenantId: string): void {
    this.cache?.del(`catalog:${tenantId}:all-packages`);
    // Note: We invalidate all-packages but individual package caches are
    // invalidated on a case-by-case basis when we know the slug
  }

  /**
   * Invalidate specific package cache entry
   *
   * @param tenantId - Tenant ID
   * @param slug - Package slug
   */
  private invalidatePackageCache(tenantId: string, slug: string): void {
    this.cache?.del(`catalog:${tenantId}:package:${slug}`);
  }

  /**
   * Invalidate segment-scoped catalog cache entries
   *
   * Called when packages or add-ons are updated/deleted within a segment
   * Invalidates all segment-related caches for proper cache consistency
   *
   * @param tenantId - Tenant ID
   * @param segmentId - Segment ID whose cache should be invalidated
   *
   * @private
   */
  private invalidateSegmentCatalogCache(tenantId: string, segmentId: string): void {
    if (!this.cache) return;

    // Invalidate all segment-scoped caches
    this.cache.del(`catalog:${tenantId}:segment:${segmentId}:packages`);
    this.cache.del(`catalog:${tenantId}:segment:${segmentId}:packages-with-addons`);
    this.cache.del(`catalog:${tenantId}:segment:${segmentId}:addons`);
  }
}
