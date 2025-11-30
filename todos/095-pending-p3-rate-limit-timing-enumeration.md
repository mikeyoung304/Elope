# TODO: Add constant-time response for tenant lookup (timing attack mitigation)

**Priority:** P3 (Low)
**Category:** Security
**Source:** Code Review - Security Sentinel Agent
**Created:** 2025-11-29

## Problem

The public tenant lookup endpoint responds faster for non-existent tenants than for existing ones due to database query short-circuiting. An attacker could use timing analysis to enumerate valid tenant slugs even without exceeding rate limits.

## Location

- `server/src/routes/public-tenant.routes.ts`

## Risk

- Tenant slug enumeration via timing side-channel
- Competitive intelligence gathering
- Privacy concerns for tenants who want to remain unlisted
- Low risk in practice due to rate limiting

## Solution

Add artificial delay to normalize response times:

```typescript
import { setTimeout } from 'timers/promises';

router.get('/:slug', async (req, res) => {
  const startTime = Date.now();
  const MIN_RESPONSE_TIME = 100; // ms

  try {
    const tenant = await prisma.tenant.findUnique({ ... });

    // Ensure minimum response time regardless of result
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME) {
      await setTimeout(MIN_RESPONSE_TIME - elapsed);
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    return res.status(200).json(tenant);
  } catch (error) {
    // Still normalize timing on error
    const elapsed = Date.now() - startTime;
    if (elapsed < MIN_RESPONSE_TIME) {
      await setTimeout(MIN_RESPONSE_TIME - elapsed);
    }
    throw error;
  }
});
```

Alternative: Use a generic error that doesn't distinguish between "not found" and "inactive":
```typescript
if (!tenant || !tenant.isActive) {
  return res.status(404).json({ error: 'Tenant not available' });
}
```

## Acceptance Criteria

- [ ] Response time is consistent regardless of tenant existence
- [ ] Error messages don't leak tenant status (found vs inactive)
- [ ] Minimal performance impact for legitimate requests
- [ ] Rate limiting still in place as primary defense

## Related Files

- `server/src/routes/public-tenant.routes.ts`
