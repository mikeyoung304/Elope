---
status: pending
priority: p3
issue_id: "042"
tags: [code-review, security, cors]
dependencies: []
---

# CORS Configuration Too Permissive in Production

## Problem Statement

Production allows ANY HTTPS origin for widget embedding, which is overly permissive.

**Why this matters:** Any website can make requests to your API, potential for abuse.

## Findings

**Location:** `server/src/app.ts:104-110`

```typescript
if (process.env.NODE_ENV === 'production' && origin.startsWith('https://')) {
  callback(null, true);  // Allows ANY HTTPS origin
}
```

## Proposed Solutions

Change to whitelist-only:
```typescript
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',');
if (ALLOWED_ORIGINS.includes(origin)) {
  callback(null, true);
}
```

## Acceptance Criteria

- [ ] CORS_ORIGINS environment variable
- [ ] Only whitelisted origins allowed
- [ ] Widget embedding still works for registered domains

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during DevOps review |
