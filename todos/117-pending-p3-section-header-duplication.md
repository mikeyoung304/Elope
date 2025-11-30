---
status: pending
priority: p3
issue_id: "117"
tags: [code-review, architecture, duplication, ui-redesign]
dependencies: []
---

# Section Header Pattern Duplicated in BrandingForm and BrandingPreview

## Problem Statement

The section header pattern (icon + title + description in a flex container) is duplicated across components.

**Why it matters:** Code duplication, inconsistent if styling changes.

## Findings

### From pattern-recognition agent:

**Files with duplication:**
- `client/src/features/tenant-admin/branding/components/BrandingForm/index.tsx` (lines 54-62)
- `client/src/features/tenant-admin/branding/components/BrandingPreview.tsx` (lines 28-36)

**Duplicated pattern:**
```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
    <Icon className="w-5 h-5 text-sage" />
  </div>
  <div>
    <h3 className="font-serif text-xl font-bold text-text-primary">Title</h3>
    <p className="text-sm text-text-muted">Description</p>
  </div>
</div>
```

## Proposed Solutions

### Solution 1: Create SectionHeader Component
**Pros:** Reusable across all sections
**Cons:** Minor abstraction
**Effort:** Small (30 min)
**Risk:** Low

```tsx
// components/ui/SectionHeader.tsx
interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-sage" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold text-text-primary">{title}</h3>
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
    </div>
  );
}
```

## Acceptance Criteria

- [ ] SectionHeader component created
- [ ] All instances refactored to use it
- [ ] Visual appearance unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-11-30 | Created from code review | Pattern duplication |
