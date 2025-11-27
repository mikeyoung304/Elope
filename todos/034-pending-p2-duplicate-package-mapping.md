---
status: pending
priority: p2
issue_id: "034"
tags: [code-review, code-quality, dry]
dependencies: []
---

# Duplicate Package-to-DTO Mapping Logic

## Problem Statement

`getPackages()` and `getPackageBySlug()` have identical 22-line mapping code that should be extracted to a helper function.

**Why this matters:** Violates DRY principle; changes must be made in two places, risk of divergence.

## Findings

### Code Evidence

**Location:** `server/src/routes/packages.routes.ts:11-37` and `:40-66`

Both functions contain identical mapping:
```typescript
return packages.map((pkg) => ({
  id: pkg.id, slug: pkg.slug, title: pkg.title, ...
  photos: (pkg.photos ?? []).map((photo, idx) => ({ ... })),
  addOns: pkg.addOns.map((addOn): AddOnDto => ({ ... })),
}));
```

## Proposed Solutions

### Option A: Extract Helper Function (Recommended)
**Effort:** Small | **Risk:** Low

```typescript
function mapPackageToDto(pkg: Package): PackageDto {
  return {
    id: pkg.id,
    slug: pkg.slug,
    // ... all mapping logic
  };
}

// Usage
return packages.map(mapPackageToDto);
```

## Acceptance Criteria

- [ ] Single `mapPackageToDto` function
- [ ] Both routes use shared mapper
- [ ] No duplicate mapping code
- [ ] TypeScript types preserved

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during code quality review |
