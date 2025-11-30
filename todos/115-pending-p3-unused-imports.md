---
status: pending
priority: p3
issue_id: "115"
tags: [code-review, code-quality, ui-redesign]
dependencies: []
---

# Unused Imports in UI Components

## Problem Statement

Several UI components have unused imports (icons, components) that should be removed.

**Why it matters:** Bundle size, code clarity, potential confusion.

## Findings

### From code-quality agent:

**Files with unused imports:**
- `client/src/features/admin/segments/SegmentsList.tsx` - `GripVertical` imported but never used
- `client/src/features/tenant-admin/packages/PackageList.tsx` - `Image` icon imported, may be duplicating `ImageIcon`

## Proposed Solutions

### Solution 1: Remove Unused Imports
**Pros:** Cleaner code, smaller bundle
**Cons:** None
**Effort:** Trivial (10 min)
**Risk:** None

Run ESLint with `no-unused-vars` rule or use VSCode's "Organize Imports" feature.

## Acceptance Criteria

- [ ] All unused imports removed
- [ ] ESLint passes with no-unused-vars
- [ ] No runtime errors after removal

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-11-30 | Created from code review | Unused imports found |
