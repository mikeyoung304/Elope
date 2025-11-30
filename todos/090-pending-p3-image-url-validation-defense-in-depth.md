---
status: pending
priority: p3
issue_id: "090"
tags:
  - code-review
  - security
  - defense-in-depth
  - storefront
dependencies: []
---

# Defense-in-Depth: Frontend Image URL Validation

## Problem Statement

While the backend validates URLs in create/update DTOs, the response DTO (`SegmentDtoSchema.heroImage`) allows any string. Frontend renders these URLs directly in `<img src>`. Defense-in-depth suggests adding frontend validation as well.

## Findings

### Discovery
Security review noted:

```typescript
// Response DTO (dto.ts line 378) - no .url() validation
heroImage: z.string().nullable(),

// Create/Update DTOs DO have validation (lines 395, 410)
heroImage: z.string().url().nullable().optional(),
```

### Current Protection
- Backend validates URLs on create/update
- React's JSX escapes text content (prevents script injection)
- `<img src>` doesn't execute JavaScript in modern browsers

### Theoretical Risk
If database were compromised, malicious URLs could be served. However:
- `javascript:` URLs don't execute in img src
- `data:` URLs with HTML would just show broken image
- Attack requires database compromise first

### Assessment
LOW RISK - Backend validation is the primary control. This is a defense-in-depth enhancement.

## Proposed Solutions

### Solution 1: Add URL validation in frontend components

```typescript
// utils.ts
export function safeImageUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // Invalid URL
  }
  return null;
}
```

**Pros:**
- Defense-in-depth
- Validates protocol

**Cons:**
- Redundant with backend validation
- Slight performance overhead

**Effort:** Small (20 min)
**Risk:** Low

### Solution 2: Add Content-Security-Policy header

Add `img-src https:` to CSP headers in Express.

**Pros:**
- Browser-level protection
- Covers all images

**Cons:**
- May break development (localhost)
- Requires server config

**Effort:** Medium (30 min)
**Risk:** Low

### Solution 3: Document current protections (RECOMMENDED)

Add comment explaining why frontend validation is not needed.

**Pros:**
- Documents security reasoning
- No code changes

**Cons:**
- No additional protection

**Effort:** Small (5 min)
**Risk:** Low (acceptable given backend validation)

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

### Affected Files
- `client/src/features/storefront/ChoiceCardBase.tsx`
- `packages/contracts/src/dto.ts` (documentation)

### Components
- ChoiceCardBase

### Database Changes
None

## Acceptance Criteria

- [ ] Security decision documented
- [ ] If implementing: URL validation function created
- [ ] If implementing: Applied to image rendering

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-11-29 | Created during code review | Security review identified theoretical risk |

## Resources

- OWASP XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
