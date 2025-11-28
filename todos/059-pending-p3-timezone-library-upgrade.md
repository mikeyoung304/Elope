---
status: pending
priority: p3
issue_id: "059"
tags: [code-review, scheduling, dependencies, timezone]
dependencies: []
---

# Consider Timezone Library for Robust Handling

## Problem Statement

The `createDateInTimezone()` method uses a workaround with `Intl.DateTimeFormat`. The code itself acknowledges this limitation. For a scheduling platform, timezone bugs can cause significant user frustration.

## Findings

**Location:** `server/src/services/scheduling-availability.service.ts:325-376`

```typescript
// Use Intl.DateTimeFormat to handle timezone conversion
// This is a workaround until we add a proper timezone library
```

## Proposed Solutions

### Option A: date-fns-tz
```typescript
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const utcDate = zonedTimeToUtc('2025-06-15 09:00', 'America/New_York');
```

### Option B: Luxon
```typescript
import { DateTime } from 'luxon';

const dt = DateTime.fromObject({ hour: 9 }, { zone: 'America/New_York' });
```

## Acceptance Criteria

- [ ] Replace manual timezone handling with library
- [ ] DST transitions handled correctly
- [ ] Comprehensive timezone tests added

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-27 | Created | Found during Performance Oracle review |
