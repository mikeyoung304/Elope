# Link Updates Required for Documentation Reorganization

Generated: November 7, 2025

## Overview
This document identifies all links that need updating after the documentation reorganization. Links are organized by source file and priority.

## Priority 1: Core Root Files (Must Update)

### README.md
**Location:** /Users/mikeyoung/CODING/Elope/README.md
**Links to Update:** 22 links

| Current Link | New Link | Line |
|-------------|----------|------|
| `./TESTING.md` | No change (stays in root) | 7 |
| `./DEVELOPING.md` | No change (stays in root) | 8 |
| `./MULTI_TENANT_ROADMAP.md` | `./docs/multi-tenant/MULTI_TENANT_ROADMAP.md` | 70 |
| `./ARCHITECTURE.md` | No change (stays in root) | 94 |
| `./MULTI_TENANT_IMPLEMENTATION_GUIDE.md` | `./docs/multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md` | 94 |
| `./SUPABASE.md` | `./docs/setup/SUPABASE.md` | 321 |
| `./RUNBOOK.md` | `./docs/operations/RUNBOOK.md` | 322-324, 432, 616 |
| `./INCIDENT_RESPONSE.md` | `./docs/operations/INCIDENT_RESPONSE.md` | 384, 576 |
| `./WIDGET_INTEGRATION_GUIDE.md` | `./docs/roadmaps/WIDGET_INTEGRATION_GUIDE.md` | 488, 497 |
| `./API_DOCS_QUICKSTART.md` | `./docs/api/API_DOCS_QUICKSTART.md` | 500 |
| `./PHASE_5_IMPLEMENTATION_SPEC.md` | `./docs/phases/PHASE_5_IMPLEMENTATION_SPEC.md` | 506 |
| `./DECISIONS.md` | No change (stays in root) | 507, 532 |
| `./ENVIRONMENT.md` | `./docs/setup/ENVIRONMENT.md` | 513 |
| `./SECRETS.md` | `./docs/security/SECRETS.md` | 514 |
| `./SECURITY.md` | `./docs/security/SECURITY.md` | 515 |
| `./SECRET_ROTATION_GUIDE.md` | `./docs/security/SECRET_ROTATION_GUIDE.md` | 516 |
| `./IMMEDIATE_SECURITY_ACTIONS.md` | `./docs/security/IMMEDIATE_SECURITY_ACTIONS.md` | 517 |
| `./PHASE_1_COMPLETION_REPORT.md` | `./docs/phases/PHASE_1_COMPLETION_REPORT.md` | 520 |
| `./PHASE_2B_COMPLETION_REPORT.md` | `./docs/phases/PHASE_2B_COMPLETION_REPORT.md` | 521 |

**Impact:** HIGH - Most visible file, needs immediate update

---

### DEVELOPING.md
**Location:** /Users/mikeyoung/CODING/Elope/DEVELOPING.md
**Links to Update:** 7 links

| Current Link | New Link | Line |
|-------------|----------|------|
| `../MULTI_TENANT_ROADMAP.md` | `./docs/multi-tenant/MULTI_TENANT_ROADMAP.md` | 27 |
| `../PHASE_5_IMPLEMENTATION_SPEC.md` | `./docs/phases/PHASE_5_IMPLEMENTATION_SPEC.md` | 28 |
| `../PHASE_4_TENANT_ADMIN_COMPLETION_REPORT.md` | `./docs/phases/PHASE_4_TENANT_ADMIN_COMPLETION_REPORT.md` | 29 |
| `./SECRET_ROTATION_GUIDE.md` | `./docs/security/SECRET_ROTATION_GUIDE.md` | 190 |
| `./IMMEDIATE_SECURITY_ACTIONS.md` | `./docs/security/IMMEDIATE_SECURITY_ACTIONS.md` | 191 |
| `./SECURITY.md` | `./docs/security/SECURITY.md` | 192 |

**Impact:** HIGH - Second most referenced file

---

### CONTRIBUTING.md
**Location:** /Users/mikeyoung/CODING/Elope/CONTRIBUTING.md
**Links to Update:** 6 links

| Current Link | New Link | Line |
|-------------|----------|------|
| `./SUPABASE.md` | `./docs/setup/SUPABASE.md` | 83, 644 |
| `./DEVELOPING.md` | No change (stays in root) | 83, 591, 640 |
| `./TESTING.md` | No change (stays in root) | 435, 641 |
| `./ARCHITECTURE.md` | No change (stays in root) | 591, 642 |
| `./CODING_GUIDELINES.md` | No change (stays in root) | 643 |
| `./DECISIONS.md` | No change (stays in root) | 645 |

**Impact:** MEDIUM - Referenced by contributors

---

### ARCHITECTURE.md
**Location:** /Users/mikeyoung/CODING/Elope/ARCHITECTURE.md
**Links to Update:** 2 links

| Current Link | New Link | Line |
|-------------|----------|------|
| `./MULTI_TENANT_IMPLEMENTATION_GUIDE.md` | `./docs/multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md` | 285 |
| `./PHASE_1_COMPLETION_REPORT.md` | `./docs/phases/PHASE_1_COMPLETION_REPORT.md` | 285 |

**Impact:** MEDIUM - Core architecture documentation

---

## Priority 2: Files Being Moved (Update Internal References)

### RUNBOOK.md → docs/operations/RUNBOOK.md
**Internal Links to Update:** 3 links

| Current Link | New Link (relative to new location) |
|-------------|-------------------------------------|
| `./SECURITY.md` | `../security/SECURITY.md` |
| `./SECRET_ROTATION_GUIDE.md` | `../security/SECRET_ROTATION_GUIDE.md` |
| `./IMMEDIATE_SECURITY_ACTIONS.md` | `../security/IMMEDIATE_SECURITY_ACTIONS.md` |

**Impact:** MEDIUM - Operational documentation

---

### Files in docs/setup/
After moving, these files will reference each other:
- ENVIRONMENT.md
- SUPABASE.md
- SUPABASE_INTEGRATION_COMPLETE.md
- LOCAL_TESTING_GUIDE.md

**Action:** Verify no internal cross-references need updating

---

### Files in docs/security/
After moving, these files may reference each other:
- SECURITY.md
- SECRET_ROTATION_GUIDE.md
- SECRETS_ROTATION.md
- IMMEDIATE_SECURITY_ACTIONS.md
- SECRETS.md

**Action:** Check for cross-references between security docs

---

## Priority 3: Less Critical Files

### Client-side Documentation
**Location:** /Users/mikeyoung/CODING/Elope/client/
Several files have internal references that should not be affected by root-level reorganization:
- README_AUTH_TESTS.md
- AUTH_TEST_INDEX.md
- AUTH_QUICK_REFERENCE.md
- src/contexts/MIGRATION_GUIDE.md
- src/contexts/README.md

**Impact:** LOW - Client docs are self-contained

---

### Server-side Documentation
**Location:** /Users/mikeyoung/CODING/Elope/server/
- UNIFIED_AUTH_QUICK_START.md

**Impact:** LOW - Server docs are self-contained

---

## Automated Link Checking

### Recommended Tools
1. **markdown-link-check**: Validate all markdown links
   ```bash
   npm install -g markdown-link-check
   find . -name "*.md" -exec markdown-link-check {} \;
   ```

2. **remark-validate-links**: More sophisticated checking
   ```bash
   npm install -g remark-cli remark-validate-links
   remark -u validate-links .
   ```

### Manual Verification Checklist
- [ ] All links in README.md work
- [ ] All links in DEVELOPING.md work
- [ ] All links in CONTRIBUTING.md work
- [ ] All links in ARCHITECTURE.md work
- [ ] All navigation README.md files in docs/ work
- [ ] Cross-references between moved files work
- [ ] No 404s when browsing documentation

## Update Strategy

### Recommended Approach
1. **Move files first** (using `git mv` to preserve history)
2. **Update root files immediately** (README.md, DEVELOPING.md, etc.)
3. **Update moved files' internal links**
4. **Run automated link checker**
5. **Fix any remaining broken links**
6. **Commit all changes together** to minimize broken-link window

### Git Command Pattern
```bash
# Move file (preserves history)
git mv SECURITY.md docs/security/SECURITY.md

# Update links in root files
# (use text editor or sed)

# Verify no broken links
markdown-link-check README.md

# Commit together
git add -A
git commit -m "docs: reorganize documentation into structured directories"
```

## Special Considerations

### Relative vs Absolute Paths
All documentation uses **relative paths** (e.g., `./SECURITY.md`), which is correct and should be maintained.

After moving:
- Root → moved file: `./docs/category/FILE.md`
- Moved → root: `../../FILE.md`
- Moved → moved (same dir): `./FILE.md`
- Moved → moved (different dir): `../other-category/FILE.md`

### GitHub Rendering
GitHub renders markdown with relative links correctly. Test key files:
- README.md
- docs/README.md
- Each category README.md

### Badge Links
README.md contains badge links that reference root files:
```markdown
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-green)](./TESTING.md)
```
These point to files staying in root, so no updates needed.

## Summary Statistics

**Total Files to Move:** 74+ files
**Total Links to Update:** ~40+ links across 5 core files
**Estimated Update Time:** 30-45 minutes
**Testing Time:** 15 minutes
**Total Time:** 60 minutes

## Post-Migration Validation

After completing the migration:
1. [ ] Browse all documentation starting from README.md
2. [ ] Click through all links in navigation README files
3. [ ] Verify docs/ structure matches plan
4. [ ] Run automated link checker
5. [ ] Update CHANGELOG.md with migration details
6. [ ] Announce reorganization to team (if applicable)
