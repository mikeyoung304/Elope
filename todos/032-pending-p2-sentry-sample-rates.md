---
status: pending
priority: p2
issue_id: "032"
tags: [code-review, devops, monitoring, sentry]
dependencies: []
---

# Sentry Sample Rates Too Low - Missing 90% of Traces

## Problem Statement

Sentry tracing and profiling sample rates default to 0.1 (10%), meaning 90% of traces are never captured. This creates blind spots in production monitoring.

**Why this matters:** Cannot debug performance issues or track error patterns without adequate sampling.

## Findings

### Code Evidence

**Location:** `server/src/lib/errors/sentry.ts:42-43`

```typescript
tracesSampleRate: config?.tracesSampleRate || 0.1,      // 10%
profilesSampleRate: config?.profilesSampleRate || 0.1,   // 10%
```

### Additional Issues

- `beforeSend` only filters `isOperational` errors
- 404s and 429s go to Sentry, creating noise
- Health check failures may spam Sentry

## Proposed Solutions

### Option A: Increase Rates and Add Filtering (Recommended)
**Effort:** Small | **Risk:** Low

```typescript
tracesSampleRate: config?.tracesSampleRate || 0.5,  // 50%
profilesSampleRate: config?.profilesSampleRate || 0.1,

beforeSend(event, hint) {
  if (event.request?.url?.includes('/health')) return null;
  if (event.statusCode === 404) return null;
  if (event.statusCode === 429) return null;
  // ... existing filtering
}
```

## Acceptance Criteria

- [ ] Trace sample rate increased to 50%
- [ ] Health check requests filtered out
- [ ] 404/429 responses not sent to Sentry
- [ ] Environment variable override works

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during DevOps analysis |
