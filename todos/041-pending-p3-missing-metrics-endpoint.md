---
status: pending
priority: p3
issue_id: "041"
tags: [code-review, devops, monitoring]
dependencies: []
---

# No Metrics/Observability Endpoint

## Problem Statement

No `/metrics` endpoint for monitoring systems (Prometheus, Datadog). Cannot monitor query performance or application health metrics.

**Why this matters:** Blind spots on performance, cannot alert on degradation.

## Findings

- Prisma supports `prisma.$metrics()` but not exposed
- No application-level timing metrics
- No request latency distribution

## Proposed Solutions

- Add `/metrics` endpoint (Prometheus format)
- Export Prisma query metrics
- Add CPU/memory/request count monitoring

## Acceptance Criteria

- [ ] `/metrics` endpoint returns Prometheus format
- [ ] Database query counts and timing exposed
- [ ] Request latency histogram available

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during DevOps review |
