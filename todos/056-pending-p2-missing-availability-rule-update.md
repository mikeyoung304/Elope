---
status: pending
priority: p2
issue_id: "056"
tags: [code-review, scheduling, api, ux]
dependencies: []
---

# No Update Endpoint for Availability Rules

## Problem Statement

The API has endpoints to create and delete availability rules, but no endpoint to UPDATE an existing rule. Users must delete and recreate rules to make changes, losing history and creating poor UX.

**Why this matters:** Common workflow (changing rule start time) requires delete+create instead of simple update.

## Findings

### Current Endpoints

- `POST /v1/tenant-admin/availability-rules` - Create ✓
- `GET /v1/tenant-admin/availability-rules` - List ✓
- `DELETE /v1/tenant-admin/availability-rules/:id` - Delete ✓
- `PUT /v1/tenant-admin/availability-rules/:id` - **MISSING**

### User Impact

To change a rule's start time from 9:00 to 10:00:
1. Delete existing rule
2. Create new rule with 10:00
3. Rule gets new ID
4. Any references to old ID are broken
5. Audit trail is lost

## Proposed Solutions

### Option A: Add Update Endpoint (Recommended)
**Effort:** Medium | **Risk:** Low

```typescript
// api.v1.ts
tenantAdminUpdateAvailabilityRule: {
  method: 'PUT',
  path: '/v1/tenant-admin/availability-rules/:id',
  body: UpdateAvailabilityRuleDtoSchema,
  responses: {
    200: AvailabilityRuleDtoSchema,
    400: BadRequestErrorSchema,
    404: NotFoundErrorSchema,
    // ...
  }
}

// tenant-admin-scheduling.routes.ts
router.put('/availability-rules/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId!;
  const data = req.body;

  const updated = await availabilityRuleRepo.update(tenantId, id, data);
  res.json(updated);
});
```

## Technical Details

**Files to Update:**
- `packages/contracts/src/api.v1.ts` - Add contract
- `packages/contracts/src/dto.ts` - Add UpdateAvailabilityRuleDtoSchema
- `server/src/lib/ports.ts` - Add update method to interface
- `server/src/adapters/prisma/availability-rule.repository.ts` - Implement update
- `server/src/routes/tenant-admin-scheduling.routes.ts` - Add route

## Acceptance Criteria

- [ ] PUT /v1/tenant-admin/availability-rules/:id endpoint added
- [ ] Partial updates supported
- [ ] Rule ID preserved on update
- [ ] Frontend uses update instead of delete+create

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during API Contract review |
