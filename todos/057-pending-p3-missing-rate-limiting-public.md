---
status: pending
priority: p3
issue_id: "057"
tags: [code-review, scheduling, security, rate-limiting]
dependencies: []
---

# Missing Rate Limiting on Public Scheduling Endpoints

## Problem Statement

Public scheduling endpoints have no rate limiting. An attacker could enumerate all dates/services or DoS the availability service.

## Findings

**Location:** `server/src/routes/public-scheduling.routes.ts`

Current state:
- `GET /v1/public/services` - No rate limit
- `GET /v1/public/availability/slots` - No rate limit (expensive query!)

## Proposed Solutions

Add rate limiting middleware:

```typescript
import rateLimit from 'express-rate-limit';

const schedulingLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute per tenant
  keyGenerator: (req) => req.tenantId || req.ip,
});

app.use('/v1/public/scheduling', schedulingLimiter);
```

## Acceptance Criteria

- [ ] Rate limit: 100 requests/minute per tenant
- [ ] 429 response when limit exceeded
- [ ] Consider lower limit for /availability/slots (expensive)

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during Security Sentinel review |
