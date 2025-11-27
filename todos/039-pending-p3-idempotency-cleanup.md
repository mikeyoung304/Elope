---
status: pending
priority: p3
issue_id: "039"
tags: [code-review, database, maintenance]
dependencies: []
---

# IdempotencyKey Cleanup Never Called

## Problem Statement

`cleanupExpired()` method exists but is never scheduled. Expired idempotency keys accumulate indefinitely.

**Why this matters:** After 90 days, table could grow to millions of rows, slowing queries.

## Findings

**Location:** `server/src/services/idempotency.service.ts:235-246`

Method exists but never invoked from scheduler or startup.

## Proposed Solutions

Schedule periodic cleanup (daily cron or startup task):
```typescript
setInterval(() => idempotencyService.cleanupExpired(), 24 * 60 * 60 * 1000);
```

## Acceptance Criteria

- [ ] Cleanup runs daily
- [ ] Logs number of deleted keys
- [ ] No performance impact on regular operations

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during data integrity review |
