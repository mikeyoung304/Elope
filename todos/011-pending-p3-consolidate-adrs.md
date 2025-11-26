---
status: pending
priority: p3
issue_id: "011"
tags: [documentation, cleanup, architecture]
dependencies: []
---

# Consolidate ADR Locations

## Problem Statement

The project has two separate ADR (Architecture Decision Record) locations with different numbering schemes and formats:
1. `/DECISIONS/` (root) - 2 ADRs, minimal format (300 bytes each)
2. `/docs/adrs/` - 4+ ADRs, comprehensive format (5,000+ bytes each)

This creates confusion about where ADRs should be documented.

## Findings

**Current state:**

**DECISIONS/ (Root):**
- 0001-modular-monolith.md (309 bytes, minimal)
- 0002-mock-first.md (306 bytes, minimal)

**docs/adrs/:**
- ADR-001-adopt-diataxis-framework.md (documentation governance)
- ADR-002-documentation-naming-standards.md
- ADR-003-sprint-documentation-lifecycle.md
- ADR-004-time-based-archive-strategy.md
- ADR-005-documentation-security-review.md

**Issues:**
- Numbering collision risk (0002 vs ADR-002)
- Different purposes unclear (architecture vs documentation governance)
- Missing major ADRs (multi-tenant, Prisma, ts-rest)

## Proposed Solutions

### Solution 1: Merge to docs/adrs/ (Recommended)
- Move DECISIONS/*.md to docs/adrs/
- Renumber to avoid collisions
- Use comprehensive format going forward
- Effort: Small (1 hour)
- Risk: Low

### Solution 2: Keep Both with Clear Purposes
- DECISIONS/ = Core architecture (quick notes)
- docs/adrs/ = Documentation governance
- Document the distinction
- Effort: Small (30 min)
- Risk: Medium - continued confusion

### Solution 3: Consolidate + Create Missing ADRs
- Merge locations (Solution 1)
- Add ADRs for: multi-tenant, Prisma, ts-rest, DI container
- Effort: Large (6 hours)
- Risk: Low
- Pros: Comprehensive architectural documentation

## Recommended Action

Solution 1 now, Solution 3 as follow-up work.

## Technical Details

**Renumbering plan:**
```
DECISIONS/0001-modular-monolith.md → docs/adrs/ADR-001-modular-monolith.md
DECISIONS/0002-mock-first.md → docs/adrs/ADR-006-mock-first.md (avoid collision)
```

**ADR template location:**
- `docs/architecture/adr-template.md` exists

**Commands:**
```bash
# Move and renumber
git mv DECISIONS/0001-modular-monolith.md docs/adrs/ADR-001-modular-monolith.md
git mv DECISIONS/0002-mock-first.md docs/adrs/ADR-006-mock-first.md

# Remove empty directory
rmdir DECISIONS/

# Update docs/adrs/README.md with full index
```

**Missing ADRs to create later:**
- ADR-007: Multi-Tenant Data Isolation Strategy
- ADR-008: Dependency Injection Container Pattern
- ADR-009: ts-rest Contract-First API Design
- ADR-010: Prisma ORM and Migration Strategy

## Acceptance Criteria

- [ ] DECISIONS/ folder removed
- [ ] All ADRs in docs/adrs/
- [ ] README.md index updated
- [ ] No numbering collisions
- [ ] Cross-references updated

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-24 | Created | Two ADR locations identified |

## Resources

- DECISIONS/: Root folder (2 files)
- docs/adrs/: Main ADR folder (5+ files)
- Template: docs/architecture/adr-template.md
