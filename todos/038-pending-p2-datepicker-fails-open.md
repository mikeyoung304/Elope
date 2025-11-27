---
status: pending
priority: p2
issue_id: "038"
tags: [code-review, ux, booking, error-handling]
dependencies: []
---

# DatePicker Availability Check Silently Fails Open

## Problem Statement

If availability API fails, DatePicker allows date selection anyway (fails open). User can proceed to book unavailable dates.

**Why this matters:** User sees "Date Unavailable" toast but selection proceeds. Booking creation then fails, confusing user.

## Findings

### Code Evidence

**Location:** `client/src/features/booking/DatePicker.tsx:107-111`

```typescript
// On error, allow selection (fail open)
// Shows toast but doesn't prevent selection
```

### Impact

- User selects date believing it's available
- Booking creation fails with conflict error
- Poor user experience
- Potential double-booking attempt

## Proposed Solutions

### Option A: Fail Closed with Retry (Recommended)
**Effort:** Small | **Risk:** Low

```typescript
// Don't allow date selection on availability API error
if (availabilityError) {
  return (
    <Modal>
      <p>Unable to check availability. Please try again.</p>
      <Button onClick={refetch}>Retry</Button>
    </Modal>
  );
}
```

## Acceptance Criteria

- [ ] API error prevents date selection
- [ ] Clear error message shown to user
- [ ] Retry button to re-fetch availability
- [ ] No booking attempts on unavailable dates

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during feature completeness review |
