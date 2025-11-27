---
status: pending
priority: p3
issue_id: "019"
tags: [code-review, simplification, yagni, storefront]
dependencies: ["016"]
---

# Consider Merging Duplicate Page Components (YAGNI)

## Problem Statement

PR #6 creates separate page components for segment-based and root tier selection that are 85-90% identical. Following DHH/Rails "convention over configuration" and YAGNI principles, these could potentially be merged.

**Why this matters:** More files = more maintenance burden. The duplication adds ~100 lines that could be eliminated.

## Findings

### SegmentTiers vs RootTiers
**Files:**
- `client/src/pages/SegmentTiers.tsx` (75 lines)
- `client/src/pages/RootTiers.tsx` (91 lines)

**Differences:**
- Data source: `useSegmentWithPackages(slug)` vs `usePackages()`
- Filter: segment packages vs `!p.segmentId`
- Back link: exists for segment, none for root

**Identical code:**
- Loading skeleton rendering
- Error state handling
- TierSelector props pattern

### SegmentTierDetail vs RootTierDetail
**Files:** Both in `client/src/pages/TierDetailPage.tsx` (146 lines total)

**Differences:**
- Data source hooks
- Package filtering (4 lines)

**Identical code:**
- Param validation
- Loading/error handling
- TierDetail rendering

### Simplification Potential
- **Before:** 7 files, 961 lines
- **After:** 5 files, ~620 lines (35% reduction)

## Proposed Solutions

### Option A: Keep Separate (Current State)
**Effort:** None | **Risk:** None

Keep current implementation for clarity.

**Pros:**
- Each route has dedicated component
- Easy to understand individual flows
- No risk of breaking changes

**Cons:**
- Duplicate code to maintain
- Larger bundle size

### Option B: Merge Pages with Route Params
**Effort:** Medium | **Risk:** Medium

Create unified components that handle both cases:

```typescript
// Unified Tiers.tsx
function Tiers() {
  const { slug } = useParams();
  const isSegment = Boolean(slug);

  const { data, isLoading, error } = isSegment
    ? useSegmentWithPackages(slug!)
    : usePackages();

  const packages = isSegment
    ? data?.packages
    : data?.filter(p => !p.segmentId);

  return <TierSelector packages={packages} segmentSlug={slug} />;
}
```

**Pros:**
- 35% code reduction
- Single source of truth
- Fewer files to maintain

**Cons:**
- Conditional hook calls need careful handling
- Slightly more complex component logic
- Risk of regressions in existing flows

### Option C: Create Shared Content Component
**Effort:** Small | **Risk:** Low

Extract shared loading/error states to TierSelector, keep thin page wrappers.

**Pros:**
- Reduces duplication without risky refactor
- Pages remain simple route handlers

**Cons:**
- Still have multiple files

## Recommended Action

**No immediate action required.** Current implementation works and is acceptable.

Consider **Option B** in a future cleanup sprint if code duplication becomes problematic.

## Technical Details

This is a **nice-to-have** refactoring opportunity, not a requirement. The current implementation is functional and maintainable.

**If pursuing Option B:**
- Update `client/src/router.tsx` to use unified components
- Ensure all tests still pass
- Verify both URL patterns work correctly

## Acceptance Criteria

If implementing:
- [ ] Unified component handles both segment and root cases
- [ ] `/tiers` route works correctly
- [ ] `/s/:slug` route works correctly
- [ ] `/tiers/:tier` route works correctly
- [ ] `/s/:slug/:tier` route works correctly
- [ ] No visual regressions

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Identified during PR #6 simplicity review |

## Resources

- PR #6: https://github.com/mikeyoung304/MAIS/pull/6
- DHH Rails doctrine: https://rubyonrails.org/doctrine
