---
status: pending
priority: p2
issue_id: "107"
tags: [code-review, ux, accessibility, ui-redesign]
dependencies: []
---

# window.confirm() Used Instead of Confirmation Dialog

## Problem Statement

`usePackageManager` uses native `window.confirm()` while `BlackoutsManager` properly uses a styled `DeleteConfirmationDialog` component. Inconsistent UX and accessibility.

**Why it matters:** Native confirm is not accessible (no ARIA), cannot be styled, no "cannot undo" warnings.

## Findings

### From architecture-strategist agent:

**File:** `client/src/features/tenant-admin/packages/hooks/usePackageManager.ts`
**Line:** 42

```typescript
const handleDelete = async (packageId: string) => {
  if (!window.confirm("Are you sure you want to delete this package?")) {
    return;
  }
  // Delete logic
}
```

**Good pattern exists at:** BlackoutsManager DeleteConfirmationDialog

## Proposed Solutions

### Solution 1: Create Shared DeleteConfirmationDialog (Recommended)
**Pros:** Consistent UX, accessible, reusable
**Cons:** More code
**Effort:** Medium (2 hours)
**Risk:** Low

Extract DeleteConfirmationDialog from BlackoutsManager, make it generic with props: `itemType`, `itemName`, `consequences[]`.

## Acceptance Criteria

- [ ] Shared DeleteConfirmationDialog created
- [ ] window.confirm replaced in usePackageManager
- [ ] Check SegmentsManager for similar issue
- [ ] Dialog is keyboard accessible
- [ ] Screen reader announces dialog properly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-11-30 | Created from code review | UX inconsistency found |
