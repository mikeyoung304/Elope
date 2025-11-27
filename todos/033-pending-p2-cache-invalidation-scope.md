---
status: pending
priority: p2
issue_id: "033"
tags: [code-review, performance, caching]
dependencies: []
---

# Cache Invalidation Scope Too Broad - Thundering Herd

## Problem Statement

When a single add-on is updated, `invalidateCatalogCache()` invalidates ALL catalog cache for the tenant. This creates a thundering herd where the next request rebuilds the entire catalog.

**Why this matters:** After any package/add-on change, first user pays cost of full catalog rebuild. High latency spikes after admin updates.

## Findings

### Code Evidence

**Location:** `server/src/services/catalog.service.ts:460-472`

```typescript
private invalidateCatalogCache(tenantId: string): void {
  invalidateCacheKeys(this.cache, getCatalogInvalidationKeys(tenantId));
  // Invalidates: all-packages, all segments, all segment-specific caches
}
```

### Impact

- Single package edit invalidates entire catalog
- Thundering herd on next request
- Multi-tenant system: bulk changes affect all tenants

## Proposed Solutions

### Option A: Granular Cache Invalidation (Recommended)
**Effort:** Medium | **Risk:** Low

```typescript
private invalidatePackageCache(tenantId: string, slug: string, segmentId?: string): void {
  const keys = [
    `catalog:${tenantId}:package:${slug}`,
    `catalog:${tenantId}:all-packages`,
  ];
  if (segmentId) {
    keys.push(`catalog:${tenantId}:segment:${segmentId}`);
  }
  invalidateCacheKeys(this.cache, keys);
}
```

## Acceptance Criteria

- [ ] Package edit only invalidates affected cache keys
- [ ] Segment cache only invalidated if segmentId changes
- [ ] No thundering herd after single package update
- [ ] Cache hit rate improved

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during performance analysis |
