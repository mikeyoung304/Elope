---
status: pending
priority: p3
issue_id: "012"
tags: [documentation, archive, compliance]
dependencies: ["001", "002", "005", "006"]
---

# Fix Archive File Naming Compliance

## Problem Statement

Per ADR-004 (Time-Based Archive Strategy), archived files should have YYYY-MM-DD date prefixes. Currently, **98% of archived files (220/225) are non-compliant** with this naming convention. This makes it difficult to understand when documents were created.

## Findings

**Compliance analysis:**

| Archive Month | Total Files | Date-Prefixed | Non-Compliant | Compliance |
|--------------|-------------|---------------|---------------|------------|
| 2025-01 | 42 | 0 | 42 (100%) | 0% |
| 2025-10 | 18 | ~5 | ~13 (72%) | ~28% |
| 2025-11 | 165 | ~0 | ~165 (100%) | 0% |
| **Total** | **225** | **~5** | **~220 (98%)** | **~2%** |

**Example violations:**
- `docs/archive/2025-11/analysis/CODE_HEALTH_INDEX.md`
  - Should be: `2025-11-XX-code-health-index.md`
- `docs/archive/2025-11/sprints/SPRINT_2_1_ROLLBACK_GUIDE.md`
  - Should be: `2025-11-XX-sprint-2-1-rollback-guide.md`

**Additional issues:**
- Nested subdirectories (e.g., `cache-investigation/`) violate flat structure
- Non-standard categories (12+ instead of ADR-004's 5)

## Proposed Solutions

### Solution 1: Batch Rename with Git History Dates (Recommended)
- Extract creation dates from git history
- Rename all 220 files with YYYY-MM-DD prefix
- Effort: Large (4-6 hours)
- Risk: Medium - many file moves
- Pros: Full compliance, clear history

### Solution 2: Manual Date Assignment
- Assign mid-month dates (YYYY-MM-15) for unknown dates
- Faster but less accurate
- Effort: Medium (2-3 hours)
- Risk: Low
- Cons: Dates may not be accurate

### Solution 3: Leave Non-Compliant, Fix Going Forward
- Only apply convention to new archives
- Effort: None
- Risk: Low
- Cons: Inconsistent archive, ADR-004 not enforced

## Recommended Action

Solution 2 for speed, with a note about date approximation.

## Technical Details

**Rename script concept:**
```bash
#!/bin/bash
# Rename archive files with date prefix

for file in docs/archive/2025-11/**/*.md; do
    # Skip README files
    [[ $(basename "$file") == "README.md" ]] && continue

    # Get creation date from git (or use default)
    DATE=$(git log --diff-filter=A --format="%ad" --date=short -- "$file" | head -1)
    DATE=${DATE:-"2025-11-15"}  # Default to mid-month if unknown

    # Convert to lowercase kebab-case
    BASENAME=$(basename "$file" .md)
    LOWERCASE=$(echo "$BASENAME" | tr '[:upper:]_' '[:lower:]-')

    # Build new path
    DIR=$(dirname "$file")
    NEW_NAME="${DATE}-${LOWERCASE}.md"

    # Rename
    git mv "$file" "$DIR/$NEW_NAME"
done
```

**Flatten nested directories:**
```bash
# Move files from cache-investigation/ up one level
for file in docs/archive/2025-11/investigations/cache-investigation/*.md; do
    git mv "$file" "docs/archive/2025-11/investigations/"
done
rmdir docs/archive/2025-11/investigations/cache-investigation/
```

## Acceptance Criteria

- [ ] All archive files have YYYY-MM-DD prefix (220 files)
- [ ] No nested subdirectories in archive categories
- [ ] Validation script passes (all files compliant)
- [ ] No broken internal links

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-24 | Created | 98% non-compliance identified |

## Resources

- ADR-004: Time-based archive strategy
- Archive location: `docs/archive/2025-*/`
- Validation: `find docs/archive -name "*.md" -not -name "2025-*-*-*.md"`
