---
status: pending
priority: p3
issue_id: "061"
tags: [code-review, scheduling, validation, ux]
dependencies: []
---

# Auto-Slug Generation Can Produce Empty String

## Problem Statement

The `generateSlug()` function in ServicesManager can produce an empty string if the service name contains only special characters.

## Findings

**Location:** `client/src/features/tenant-admin/scheduling/ServicesManager/useServicesManager.ts:40-47`

```typescript
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")  // Remove special chars
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// If name = "!!!???", slug = ""
```

## Proposed Solutions

Add fallback:

```typescript
const generateSlug = (name: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || 'untitled';
};
```

## Acceptance Criteria

- [ ] Empty slug falls back to 'untitled' or similar
- [ ] User notified if auto-generated slug is generic

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during Code Quality review |
