/**
 * Integration tests for [RepositoryName]Repository
 *
 * TODO: Replace [RepositoryName] with your actual repository name
 * TODO: Update description to match your repository's purpose
 *
 * Note: These are integration tests that test the fake repository implementation.
 * Real Prisma repository tests would run against a test database.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Fake[RepositoryName]Repository, build[Entity] } from '../helpers/fakes';
import { [DomainError] } from '../../src/lib/errors';

/**
 * TODO: Update these imports:
 * - Replace [RepositoryName]Repository with your repository class
 * - Replace [Entity] with your entity builder function
 * - Replace [DomainError] with relevant error types (e.g., BookingConflictError)
 */

describe('[RepositoryName]Repository', () => {
  let repository: Fake[RepositoryName]Repository;

  /**
   * Setup: Reset repository before each test
   *
   * Pattern: Ensure clean state for each test to prevent interference
   */
  beforeEach(() => {
    repository = new Fake[RepositoryName]Repository();
  });

  // ============================================================================
  // CREATE OPERATIONS
  // ============================================================================

  describe('create', () => {
    /**
     * Happy path: Successfully create entity
     *
     * Pattern: Test basic CRUD operation
     */
    it('creates an entity successfully', async () => {
      // Arrange
      const entity = build[Entity]({ id: 'entity_1', field: 'value' });

      // Act
      const result = await repository.create('test-tenant', entity);

      // Assert: Verify created entity
      expect(result.id).toBe('entity_1');
      expect(result.field).toBe('value');
    });

    /**
     * Data integrity: Verify entity is stored
     *
     * Pattern: Test that create operation persists data
     */
    it('stores entity in repository after creation', async () => {
      // Arrange
      const entity = build[Entity]({ id: 'entity_1' });

      // Act
      await repository.create('test-tenant', entity);

      // Assert: Verify entity can be retrieved
      const found = await repository.findById('test-tenant', 'entity_1');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('entity_1');
    });

    /**
     * Constraint: Prevent duplicates
     *
     * Pattern: Test uniqueness constraints
     * TODO: Adjust based on your repository's unique constraints
     */
    it('throws error when creating duplicate entity', async () => {
      // Arrange: Create first entity
      const entity1 = build[Entity]({ id: 'entity_1', uniqueField: 'unique-value' });
      await repository.create('test-tenant', entity1);

      // Act & Assert: Try to create duplicate
      const entity2 = build[Entity]({ id: 'entity_2', uniqueField: 'unique-value' });
      await expect(
        repository.create('test-tenant', entity2)
      ).rejects.toThrow([DomainError]);

      await expect(
        repository.create('test-tenant', entity2)
      ).rejects.toThrow('already exists');
    });

    /**
     * Multi-tenancy: Verify tenant isolation
     *
     * Pattern: Ensure data is scoped to tenant
     */
    it('creates entities for different tenants independently', async () => {
      // Arrange & Act: Create entities for different tenants
      const tenant1Entity = build[Entity]({ id: 'entity_tenant_1' });
      const tenant2Entity = build[Entity]({ id: 'entity_tenant_2' });

      await repository.create('tenant-1', tenant1Entity);
      await repository.create('tenant-2', tenant2Entity);

      // Assert: Each tenant can access only their data
      const tenant1Data = await repository.findAll('tenant-1');
      const tenant2Data = await repository.findAll('tenant-2');

      // TODO: Adjust based on how your repository handles tenant isolation
      expect(tenant1Data.some(e => e.id === 'entity_tenant_1')).toBe(true);
      expect(tenant1Data.some(e => e.id === 'entity_tenant_2')).toBe(false);
      expect(tenant2Data.some(e => e.id === 'entity_tenant_2')).toBe(true);
      expect(tenant2Data.some(e => e.id === 'entity_tenant_1')).toBe(false);
    });
  });

  // ============================================================================
  // READ OPERATIONS
  // ============================================================================

  describe('findById', () => {
    /**
     * Happy path: Find existing entity
     */
    it('returns entity when found', async () => {
      // Arrange
      const entity = build[Entity]({ id: 'find_me', field: 'test-value' });
      await repository.create('test-tenant', entity);

      // Act
      const result = await repository.findById('test-tenant', 'find_me');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe('find_me');
      expect(result?.field).toBe('test-value');
    });

    /**
     * Not found case: Return null for missing entity
     *
     * Pattern: Test null return for not found (vs throwing error)
     */
    it('returns null when entity not found', async () => {
      // Act
      const result = await repository.findById('test-tenant', 'nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    /**
     * Multi-tenancy: Verify tenant isolation in reads
     */
    it('returns null when entity exists but for different tenant', async () => {
      // Arrange: Create entity for tenant-1
      const entity = build[Entity]({ id: 'entity_1' });
      await repository.create('tenant-1', entity);

      // Act: Try to find with tenant-2
      const result = await repository.findById('tenant-2', 'entity_1');

      // Assert: Should not find entity from different tenant
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    /**
     * Happy path: Return all entities
     */
    it('returns all entities for tenant', async () => {
      // Arrange
      const entity1 = build[Entity]({ id: 'entity_1' });
      const entity2 = build[Entity]({ id: 'entity_2' });
      await repository.create('test-tenant', entity1);
      await repository.create('test-tenant', entity2);

      // Act
      const result = await repository.findAll('test-tenant');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some(e => e.id === 'entity_1')).toBe(true);
      expect(result.some(e => e.id === 'entity_2')).toBe(true);
    });

    /**
     * Empty result: Return empty array when no data
     */
    it('returns empty array when no entities exist', async () => {
      // Act
      const result = await repository.findAll('test-tenant');

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    /**
     * Multi-tenancy: Only return tenant's data
     */
    it('only returns entities for specified tenant', async () => {
      // Arrange
      await repository.create('tenant-1', build[Entity]({ id: 'entity_1' }));
      await repository.create('tenant-2', build[Entity]({ id: 'entity_2' }));

      // Act
      const tenant1Results = await repository.findAll('tenant-1');

      // Assert
      expect(tenant1Results.some(e => e.id === 'entity_1')).toBe(true);
      expect(tenant1Results.some(e => e.id === 'entity_2')).toBe(false);
    });
  });

  /**
   * TODO: Add custom query methods
   *
   * Example patterns for common queries:
   * - findByField(tenantId, field, value)
   * - findByDateRange(tenantId, startDate, endDate)
   * - findByStatus(tenantId, status)
   * - search(tenantId, searchTerm)
   */
  describe('findBy[CustomField]', () => {
    it('finds entities by custom field', async () => {
      // Arrange
      const entity1 = build[Entity]({ id: 'entity_1', customField: 'value-a' });
      const entity2 = build[Entity]({ id: 'entity_2', customField: 'value-b' });
      await repository.create('test-tenant', entity1);
      await repository.create('test-tenant', entity2);

      // Act
      const result = await repository.findBy[CustomField]('test-tenant', 'value-a');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('entity_1');
    });
  });

  // ============================================================================
  // UPDATE OPERATIONS
  // ============================================================================

  describe('update', () => {
    /**
     * Happy path: Update existing entity
     */
    it('updates entity successfully', async () => {
      // Arrange
      const entity = build[Entity]({ id: 'entity_1', field: 'old-value' });
      await repository.create('test-tenant', entity);

      // Act
      const updated = await repository.update('test-tenant', 'entity_1', {
        field: 'new-value'
      });

      // Assert
      expect(updated.id).toBe('entity_1');
      expect(updated.field).toBe('new-value');
    });

    /**
     * Data persistence: Verify update is stored
     */
    it('persists updates to repository', async () => {
      // Arrange
      const entity = build[Entity]({ id: 'entity_1', field: 'old-value' });
      await repository.create('test-tenant', entity);

      // Act
      await repository.update('test-tenant', 'entity_1', { field: 'new-value' });

      // Assert: Retrieve and verify
      const found = await repository.findById('test-tenant', 'entity_1');
      expect(found?.field).toBe('new-value');
    });

    /**
     * Error case: Update non-existent entity
     */
    it('throws error when updating non-existent entity', async () => {
      // Act & Assert
      await expect(
        repository.update('test-tenant', 'nonexistent', { field: 'value' })
      ).rejects.toThrow('not found');
    });

    /**
     * Partial updates: Only update provided fields
     */
    it('updates only specified fields', async () => {
      // Arrange
      const entity = build[Entity]({
        id: 'entity_1',
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      });
      await repository.create('test-tenant', entity);

      // Act: Update only field2
      await repository.update('test-tenant', 'entity_1', { field2: 'new-value2' });

      // Assert: Other fields unchanged
      const result = await repository.findById('test-tenant', 'entity_1');
      expect(result?.field1).toBe('value1'); // Unchanged
      expect(result?.field2).toBe('new-value2'); // Changed
      expect(result?.field3).toBe('value3'); // Unchanged
    });
  });

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  describe('delete', () => {
    /**
     * Happy path: Delete existing entity
     */
    it('deletes entity successfully', async () => {
      // Arrange
      const entity = build[Entity]({ id: 'entity_1' });
      await repository.create('test-tenant', entity);

      // Act
      await repository.delete('test-tenant', 'entity_1');

      // Assert: Entity no longer exists
      const found = await repository.findById('test-tenant', 'entity_1');
      expect(found).toBeNull();
    });

    /**
     * Error case: Delete non-existent entity
     */
    it('throws error when deleting non-existent entity', async () => {
      // Act & Assert
      await expect(
        repository.delete('test-tenant', 'nonexistent')
      ).rejects.toThrow('not found');
    });

    /**
     * Data integrity: Verify delete removes from findAll
     */
    it('removes entity from findAll results after deletion', async () => {
      // Arrange
      const entity1 = build[Entity]({ id: 'entity_1' });
      const entity2 = build[Entity]({ id: 'entity_2' });
      await repository.create('test-tenant', entity1);
      await repository.create('test-tenant', entity2);

      // Act: Delete one entity
      await repository.delete('test-tenant', 'entity_1');

      // Assert: Only entity_2 remains
      const all = await repository.findAll('test-tenant');
      expect(all).toHaveLength(1);
      expect(all[0]?.id).toBe('entity_2');
    });
  });

  // ============================================================================
  // CONCURRENCY & RACE CONDITIONS
  // ============================================================================

  /**
   * TODO: Add concurrency tests if your repository handles concurrent operations
   *
   * Common patterns:
   * - Optimistic locking
   * - Pessimistic locking
   * - Transaction isolation
   * - Race condition prevention
   */
  describe('concurrency', () => {
    /**
     * Pattern: Test concurrent creates
     *
     * Use Promise.allSettled to test parallel operations
     */
    it('handles concurrent creates correctly', async () => {
      // Arrange: Two entities to create concurrently
      const entity1 = build[Entity]({ id: 'concurrent_1', uniqueField: 'same-value' });
      const entity2 = build[Entity]({ id: 'concurrent_2', uniqueField: 'same-value' });

      // Act: Attempt concurrent creation
      const results = await Promise.allSettled([
        repository.create('test-tenant', entity1),
        repository.create('test-tenant', entity2),
      ]);

      // Assert: Only one should succeed (if uniqueField constraint exists)
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      // TODO: Adjust based on your constraint expectations
      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
    });

    /**
     * Pattern: Test concurrent updates
     */
    it('handles concurrent updates correctly', async () => {
      // Arrange: Create entity
      const entity = build[Entity]({ id: 'entity_1', counter: 0 });
      await repository.create('test-tenant', entity);

      // Act: Multiple concurrent updates
      await Promise.all([
        repository.update('test-tenant', 'entity_1', { counter: 1 }),
        repository.update('test-tenant', 'entity_1', { counter: 2 }),
        repository.update('test-tenant', 'entity_1', { counter: 3 }),
      ]);

      // Assert: Last write wins (or verify your concurrency strategy)
      const result = await repository.findById('test-tenant', 'entity_1');
      expect(result?.counter).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SPECIALIZED QUERY TESTS
  // ============================================================================

  /**
   * TODO: Add tests for specialized queries
   *
   * Examples:
   * - Date range queries
   * - Status filtering
   * - Pagination
   * - Sorting
   * - Full-text search
   * - Aggregations
   */

  describe('[Custom Query Method]', () => {
    /**
     * Example: Date range query
     */
    it('queries entities within date range', async () => {
      // Arrange: Create entities with different dates
      const entity1 = build[Entity]({ id: 'entity_1', date: '2025-01-15' });
      const entity2 = build[Entity]({ id: 'entity_2', date: '2025-02-15' });
      const entity3 = build[Entity]({ id: 'entity_3', date: '2025-03-15' });
      await repository.create('test-tenant', entity1);
      await repository.create('test-tenant', entity2);
      await repository.create('test-tenant', entity3);

      // Act: Query for February range
      const result = await repository.findByDateRange(
        'test-tenant',
        new Date('2025-02-01'),
        new Date('2025-02-28')
      );

      // Assert: Only February entity returned
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('entity_2');
    });
  });

  // ============================================================================
  // DATA CONSISTENCY TESTS
  // ============================================================================

  describe('data consistency', () => {
    /**
     * Pattern: Verify data integrity after operations
     */
    it('maintains data consistency across operations', async () => {
      // Arrange & Act: Perform multiple operations
      const entity = build[Entity]({ id: 'entity_1', field: 'initial' });
      const created = await repository.create('test-tenant', entity);
      const updated = await repository.update('test-tenant', created.id, { field: 'updated' });
      const found = await repository.findById('test-tenant', created.id);

      // Assert: All operations see consistent data
      expect(created.id).toBe(updated.id);
      expect(updated.id).toBe(found?.id);
      expect(found?.field).toBe('updated');
    });

    /**
     * Pattern: Test isolation between operations
     */
    it('isolates operations across tenants', async () => {
      // Arrange: Create same entity ID for different tenants
      const entity1 = build[Entity]({ id: 'same_id', field: 'tenant-1-value' });
      const entity2 = build[Entity]({ id: 'same_id', field: 'tenant-2-value' });

      // Act: Create for different tenants
      await repository.create('tenant-1', entity1);
      await repository.create('tenant-2', entity2);

      // Assert: Each tenant has their own data
      const found1 = await repository.findById('tenant-1', 'same_id');
      const found2 = await repository.findById('tenant-2', 'same_id');

      expect(found1?.field).toBe('tenant-1-value');
      expect(found2?.field).toBe('tenant-2-value');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    /**
     * Edge case: Empty string handling
     */
    it('handles empty string fields correctly', async () => {
      // Arrange
      const entity = build[Entity]({ id: 'entity_1', field: '' });

      // Act
      const created = await repository.create('test-tenant', entity);

      // Assert: Empty string is preserved
      expect(created.field).toBe('');
    });

    /**
     * Edge case: Special characters
     */
    it('handles special characters in fields', async () => {
      // Arrange
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
      const entity = build[Entity]({ id: 'entity_1', field: specialChars });

      // Act
      await repository.create('test-tenant', entity);
      const found = await repository.findById('test-tenant', 'entity_1');

      // Assert: Special characters preserved
      expect(found?.field).toBe(specialChars);
    });

    /**
     * Edge case: Large data sets
     */
    it('handles large number of entities', async () => {
      // Arrange: Create many entities
      const count = 100;
      for (let i = 0; i < count; i++) {
        await repository.create('test-tenant', build[Entity]({ id: `entity_${i}` }));
      }

      // Act
      const all = await repository.findAll('test-tenant');

      // Assert
      expect(all.length).toBe(count);
    });
  });

  // ============================================================================
  // TEST HELPER METHODS
  // ============================================================================

  /**
   * TODO: Add tests for repository-specific helper methods
   *
   * Examples:
   * - clear()
   * - count()
   * - exists()
   * - batch operations
   */

  describe('helper methods', () => {
    it('clears all data when clear() is called', async () => {
      // Arrange: Create entities
      await repository.create('test-tenant', build[Entity]({ id: 'entity_1' }));
      await repository.create('test-tenant', build[Entity]({ id: 'entity_2' }));

      // Act
      repository.clear();

      // Assert: All data removed
      const all = await repository.findAll('test-tenant');
      expect(all).toHaveLength(0);
    });
  });
});

/**
 * ==============================================================================
 * TESTING PATTERNS REFERENCE
 * ==============================================================================
 *
 * 1. Repository Pattern Testing:
 *    - Test CRUD operations thoroughly
 *    - Verify data persistence
 *    - Test query methods
 *    - Validate constraints
 *
 * 2. Concurrency Testing:
 *    - Use Promise.allSettled for concurrent operations
 *    - Test race conditions
 *    - Verify locking mechanisms
 *    - Test transaction isolation
 *
 * 3. Multi-Tenancy:
 *    - Always test tenant isolation
 *    - Verify data cannot leak between tenants
 *    - Test same IDs across different tenants
 *
 * 4. Data Consistency:
 *    - Test that writes are readable
 *    - Verify updates are reflected
 *    - Test delete removes data completely
 *    - Verify cascading operations
 *
 * 5. Edge Cases:
 *    - Empty data sets
 *    - Large data sets
 *    - Special characters
 *    - Boundary values
 *    - Null/undefined handling
 *
 * ==============================================================================
 * CUSTOMIZATION CHECKLIST
 * ==============================================================================
 *
 * [ ] Replace all [RepositoryName] placeholders
 * [ ] Replace all [Entity] placeholders
 * [ ] Replace [DomainError] with your error types
 * [ ] Update imports to match your files
 * [ ] Add custom query method tests
 * [ ] Add concurrency tests if applicable
 * [ ] Add constraint tests specific to your entity
 * [ ] Test specialized repository features
 * [ ] Verify all tests pass
 * [ ] Remove this checklist section
 *
 * ==============================================================================
 */
