---
status: pending
priority: p3
issue_id: "084"
tags: [quality, code-review, dry, maintainability]
dependencies: []
---

# P3: Code Duplication in Tenant/Package Creation

## Problem Statement

E2E and demo seeds have nearly identical code for creating tenants, packages, and add-ons. This violates DRY principle.

**Why it matters:**
- Bug fixes must be applied in multiple places
- Inconsistent behavior if one is updated without the other
- Harder to maintain

## Findings

**Tenant creation appears in both e2e.ts and demo.ts:**
```typescript
// Nearly identical structure, different data
const tenant = await prisma.tenant.upsert({
  where: { slug: ... },
  update: { apiKeyPublic: ..., primaryColor: ..., ... },
  create: { slug: ..., name: ..., commissionPercent: 5.0, ... },
});
```

## Proposed Solutions

### Solution A: Extract shared utilities
**Pros:** DRY, easier to maintain
**Cons:** Additional abstraction
**Effort:** Medium (2 hours)
**Risk:** Low

Create `prisma/seeds/utils.ts`:
```typescript
export async function createOrUpdateTenant(prisma, options: TenantSeedOptions)
export async function createOrUpdatePackage(prisma, options: PackageSeedOptions)
```

## Recommended Action

<!-- To be filled during triage -->

## Acceptance Criteria

- [ ] Shared utility functions for tenant/package creation
- [ ] E2E and demo seeds use shared utilities
- [ ] Branding defaults in single location

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-11-29 | Created from code review | Extract shared patterns to utilities |

## Resources

- **Code Review:** Seed system refactoring review
