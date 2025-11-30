---
status: pending
priority: p3
issue_id: "114"
tags: [code-review, code-quality, ui-redesign]
dependencies: []
---

# Magic Numbers in Animation Delays - Inconsistent Values

## Problem Statement

Animation delay values are hardcoded inline throughout components with inconsistent multipliers (0.03s vs 0.05s vs fixed 0.1s increments).

**Why it matters:** Inconsistent animation timing, harder to maintain, magic numbers.

## Findings

### From pattern-recognition and code-quality agents:

**Inconsistent patterns:**
- TenantDashboard: Fixed `"0.1s"`, `"0.2s"`, `"0.3s"`, `"0.4s"`
- MetricsCards: `${0.1 + index * 0.05}s`
- PackageList: `${index * 0.05}s`
- TenantBookingList: `${index * 0.03}s`

## Proposed Solutions

### Solution 1: Create Animation Constants/Hook (Recommended)
**Pros:** Consistent, maintainable
**Cons:** Minor abstraction
**Effort:** Small (1 hour)
**Risk:** Low

```typescript
// lib/design-tokens.ts
export const ANIMATION = {
  stagger: 0.05,
  fadeInDelay: {
    header: '0.1s',
    metrics: '0.2s',
    tabs: '0.3s',
    content: '0.4s',
  }
} as const;

// hooks/useStaggeredAnimation.ts
export const useStaggeredAnimation = (index: number, baseDelay = 0) => ({
  animationDelay: `${baseDelay + index * ANIMATION.stagger}s`,
  animationFillMode: 'backwards' as const
});
```

## Acceptance Criteria

- [ ] Animation constants defined in design-tokens
- [ ] useStaggeredAnimation hook created
- [ ] All components use consistent values
- [ ] Animation timing looks cohesive

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-11-30 | Created from code review | Inconsistent magic numbers |
