---
status: pending
priority: p3
issue_id: "060"
tags: [code-review, scheduling, performance, caching]
dependencies: ["053"]
---

# Add Caching for Service and Availability Rules

## Problem Statement

Service and availability rule data rarely changes but is queried repeatedly during slot generation. Adding caching would significantly reduce database load.

## Findings

**Current:** Every `getAvailableSlots()` call queries:
- Service by ID (same service, multiple calls)
- Availability rules (same rules per service)

**Opportunity:** Cache with 1-hour TTL would reduce queries by ~90%.

## Proposed Solutions

```typescript
const cacheKey = `rules:${tenantId}:${serviceId}`;
const rules = await cache.getOrFetch(cacheKey, () =>
  this.availabilityRuleRepo.getEffectiveRules(tenantId, date, serviceId),
  { ttl: 3600 }  // 1 hour
);
```

## Acceptance Criteria

- [ ] Service data cached with 1-hour TTL
- [ ] Availability rules cached with 1-hour TTL
- [ ] Cache invalidated on rule/service update
- [ ] Cache key includes tenantId for isolation

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during Performance Oracle review |
