---
status: pending
priority: p2
issue_id: "035"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Multiple `any` Type Usage Without Justification

## Problem Statement

Widespread use of `any` type in route handlers and middleware violates strict TypeScript requirement from CLAUDE.md.

**Why this matters:** Type safety bypass enables runtime errors to slip through, defeating purpose of TypeScript.

## Findings

### Code Evidence

**Location:** `server/src/routes/index.ts`
- Line 79: `async ({ req }: { req: any })`
- Line 85: `{ req: any; params: { slug: string } }`
- Line 174: `body: any` in platform tenant creation

**Location:** `server/src/middleware/tenant.ts`, `server/src/app.ts`
- Multiple `as any` casts

**Location:** `server/src/routes/tenant-admin.routes.ts:102`
- `req.file as any`

## Proposed Solutions

### Option A: Replace with Proper Types (Recommended)
**Effort:** Medium | **Risk:** Low

```typescript
// Instead of { req: any }
interface TenantRequest extends Request {
  tenantId: string;
  tenant?: Tenant;
}

async ({ req }: { req: TenantRequest })
```

## Acceptance Criteria

- [ ] No `any` types in route handlers
- [ ] Custom request types defined
- [ ] Multer file types properly imported
- [ ] TypeScript strict mode passes

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during code quality review |
