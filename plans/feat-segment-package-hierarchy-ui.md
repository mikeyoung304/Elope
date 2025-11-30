# Feature: Segment-Package Hierarchy UI (Simplified)

## Overview

Simple UI update to display **packages grouped under segments** with **3-tier structure** (Budget/Middle/Luxury). Minimal changes - backend already supports this fully.

**Note:** Major UI overhaul planned soon. This is a quick win to improve admin comprehension before that work.

## Problem Statement

1. **Packages Tab:** Flat list with no segment grouping
2. **Segments Tab:** Table with no package composition visible
3. **Admin confusion:** Can't see which packages belong to which segment

## Backend Reality (Already Done!)

- `Package.segmentId` - FK to Segment ✅
- `Package.grouping` - Tier: "budget", "middle", "luxury" ✅
- `Package.groupingOrder` - Display order ✅
- `TierSelector.tsx` - Storefront already works ✅

**Gap:** Admin UI doesn't show this structure.

---

## Proposed Solution (Simplified)

**ONE new component** that shows segments with their tier packages inline. No view toggle, no separate files for each piece.

### Visual Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│ Segments & Packages                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ▼ Elopements                          Active   2/3 tiers        │
│   ┌─────────────────┬─────────────────┬─────────────────┐      │
│   │ Essential $1.5K │ Popular ★ $2.5K │ + Add Premium   │      │
│   │ Barn Ceremony   │ Garden Gathering│                 │      │
│   │ [Edit] [Delete] │ [Edit] [Delete] │                 │      │
│   └─────────────────┴─────────────────┴─────────────────┘      │
│                                                                 │
│ ▶ Growth                              Active   0/3 tiers        │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Unassigned Packages                                             │
│   • Test Tier Package - $150                         [Edit] [×] │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Approach (Minimal)

### Files to Change

| File | Change |
|------|--------|
| `client/src/features/admin/types.ts` | Add `grouping` to `PackageFormData` |
| `client/src/features/admin/PackageForm.tsx` | Add tier selector dropdown |
| `client/src/features/admin/packages/PackagesManager.tsx` | Replace PackagesList with new hierarchy view |

### Files to Create (2 total)

| File | Purpose | Lines |
|------|---------|-------|
| `SegmentPackageHierarchy.tsx` | **Single component** - segments with inline tier grid | ~200 |
| `utils/groupPackages.ts` | Pure function to group packages by segment | ~20 |

**That's it.** No `TierSlot`, no `SegmentPackageGroup`, no `GeneralCatalogSection`, no hooks.

### Implementation

```typescript
// utils/groupPackages.ts - Pure utility, no hook
export function groupPackagesBySegment(packages: Package[]) {
  const grouped = new Map<string | null, Package[]>();
  packages.forEach(pkg => {
    const key = pkg.segmentId ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(pkg);
  });
  return grouped;
}

// Tier count is inline: new Set(pkgs.map(p => p.grouping)).size
```

```tsx
// SegmentPackageHierarchy.tsx - All-in-one (~200 lines)
export function SegmentPackageHierarchy({ segments, packages, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const packagesBySegment = groupPackagesBySegment(packages);

  return (
    <>
      {segments.map(segment => {
        const segPkgs = packagesBySegment.get(segment.id) || [];
        const tierCount = new Set(segPkgs.map(p => p.grouping).filter(Boolean)).size;

        return (
          <div key={segment.id}>
            {/* Header */}
            <button onClick={() => setExpanded({...expanded, [segment.id]: !expanded[segment.id]})}>
              {expanded[segment.id] ? '▼' : '▶'} {segment.name} ({tierCount}/3 tiers)
            </button>

            {/* Tier grid - inline, not a separate component */}
            {expanded[segment.id] && (
              <div className="grid grid-cols-3 gap-4">
                {['budget', 'middle', 'luxury'].map(tier => {
                  const pkg = segPkgs.find(p => p.grouping === tier);
                  return pkg ? (
                    <PackageCard key={pkg.id} package={pkg} onEdit={onEdit} onDelete={onDelete} />
                  ) : (
                    <button onClick={() => onAddTier(segment.id, tier)}>+ Add {tier}</button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned packages at bottom */}
      {(packagesBySegment.get(null) || []).length > 0 && (
        <div>
          <h3>Unassigned Packages</h3>
          {packagesBySegment.get(null)?.map(pkg => (
            <PackageCard key={pkg.id} package={pkg} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </>
  );
}
```

---

## Implementation (2-3 Days)

### Day 1: Form + Utility

- [ ] Add `grouping` to `PackageFormData` in `types.ts`
- [ ] Add tier selector dropdown to `PackageForm.tsx`
- [ ] Create `utils/groupPackages.ts` utility function
- [ ] Verify contracts have `grouping` field (they do - checked)

### Day 2: Hierarchy Component

- [ ] Create `SegmentPackageHierarchy.tsx` (~200 lines)
- [ ] Update `PackagesManager.tsx` to use new component
- [ ] Reuse existing `PackageCard` for tier display
- [ ] Test expand/collapse, tier counts

### Day 3: Polish & Test

- [ ] Mobile responsive (single column on small screens)
- [ ] Basic E2E test for hierarchy workflow
- [ ] Handle edge cases inline (no separate phase)

---

## Acceptance Criteria

- [ ] Segments display as expandable cards with tier counts
- [ ] Expanding shows 3 tier slots (filled or empty)
- [ ] PackageForm has tier selector dropdown
- [ ] Unassigned packages shown at bottom
- [ ] Mobile: tiers stack vertically
- [ ] All existing tests pass

---

## Not Doing (Deferred to UI Overhaul)

- ❌ View toggle (hierarchical vs flat)
- ❌ Drag-to-reorder tiers
- ❌ Animations
- ❌ Database unique constraint on (segmentId, grouping)
- ❌ Lazy loading / performance optimization
- ❌ Inline storefront preview

---

## Key References

| What | Where |
|------|-------|
| Package model | `server/prisma/schema.prisma:183-220` |
| Tier utils (reuse) | `client/src/features/storefront/utils.ts` |
| PackageCard (reuse) | `client/src/features/admin/PackageCard.tsx` |
| OrganizationSection (tier fields exist) | `client/src/features/tenant-admin/packages/PackageForm/OrganizationSection.tsx` |

---

**Estimated Effort:** 2-3 days

**Priority:** P2 - Quick win before major UI overhaul
