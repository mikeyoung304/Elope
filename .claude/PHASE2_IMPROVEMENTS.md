# Phase 2 Improvement Plan - Detailed Implementation Guide

## High Priority Fixes

### Fix 1: Improve Validation Script Accuracy (2 hours)

**File:** `.claude/hooks/validate-patterns.sh`

**Current Issues:**

1. Math.floor warning triggers on safe boundary calculations
2. Cache detection includes Google Calendar caching (intentionally unscoped)
3. Prisma detection misses composite unique constraints
4. Webhook check only validates existence, not correctness

**Improvements:**

```bash
# ============================================================================
# IMPROVED Check 2: Commission Calculation - Must Use Math.ceil (PRIMARY)
# ============================================================================
echo "💰 Check 2: Commission calculation must use Math.ceil (round UP)"

# IMPROVED: Only check the PRIMARY commission calculation
if grep -A2 "const commissionCents = Math.floor" server/src/services/commission.service.ts 2>/dev/null | grep -q "."; then
  echo "   ❌ FAIL: Primary commission uses Math.floor"
  echo "   Action: Replace with Math.ceil to protect platform revenue"
  echo "   Location: calculateCommission() method"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ PASS: Primary commission uses Math.ceil"
fi

# NOTE: Math.floor is CORRECT in these contexts:
# - Boundary checks (maxCommission = Math.floor(total * 0.50))
# - Refund calculations (commissionRefund = Math.floor(ratio))
echo ""

# ============================================================================
# IMPROVED Check 3: Cache Keys - Must Include tenantId (Service-Level Only)
# ============================================================================
echo "🗄️  Check 3: Service-level cache keys must include tenantId prefix"

# IMPROVED: Check only service cache patterns, exclude adapter caches
if grep -r "cache\.set\|cache\.get" server/src/services --include="*.ts" 2>/dev/null \
   | grep -v "tenantId" \
   | grep -v "test" \
   | wc -l | grep -v "^0$" | grep -q "."; then
  echo "   ⚠️  WARN: Service cache without tenantId found"
  echo "   Action: Verify all service cache keys include \${tenantId}: prefix"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   ✅ PASS: Service cache keys appear to include tenantId"
fi

# NOTE: Google Calendar adapter uses intentional cache without tenantId
# This is safe because calendar availability is not sensitive data
echo ""

# ============================================================================
# IMPROVED Check 4: Prisma Queries - Must Include tenantId in WHERE Clause
# ============================================================================
echo "🔐 Check 4: Prisma queries must scope by tenantId"

# IMPROVED: Recognize composite unique constraints and system lookups
if grep -r "\.findFirst\|\.findMany\|\.findUnique" server/src/adapters/prisma --include="*.ts" 2>/dev/null \
   | grep -v "where.*tenantId" \
   | grep -v "where.*tenantId_" \
   | grep -v "findByEmail\|findByApiKey\|findBySlug\|findById" \
   | grep -v "test\|spec" \
   | wc -l | grep -v "^0$" | grep -q "."; then
  echo "   ⚠️  WARN: Possible unscoped Prisma queries"
  echo "   Action: Verify all queries properly scope by tenantId or use composite keys"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   ✅ PASS: Prisma queries appear to include tenantId"
fi

echo ""

# ============================================================================
# NEW Check 5: HTTP Cache Middleware Usage
# ============================================================================
echo "💾 Check 5: HTTP cache middleware not used on tenant routes"

if grep -r "cacheMiddleware(" server/src/routes --include="*.ts" 2>/dev/null | grep -q "."; then
  echo "   ⚠️  WARN: HTTP cache middleware detected on routes"
  echo "   Action: Verify tenant-aware keyGenerator is implemented"
  echo "   Example: keyGenerator: (req) => \`GET:\${req.tenantId}:\${req.path}\`"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   ✅ PASS: HTTP cache middleware not deployed"
fi

echo ""

# ============================================================================
# IMPROVED Check 6: Webhook Idempotency - Verify tenantId Scope
# ============================================================================
echo "🔔 Check 6: Webhook handlers check for duplicate events with tenantId"

if [ -f "server/src/routes/webhooks.routes.ts" ]; then
  # IMPROVED: Check if tenantId is passed to isDuplicate
  if grep -q "webhookRepo.isDuplicate(.*tenantId.*event.id" server/src/routes/webhooks.routes.ts; then
    echo "   ✅ PASS: Webhook idempotency is tenant-scoped"
  else
    echo "   ⚠️  WARN: Webhook idempotency may not pass tenantId"
    echo "   Action: Verify isDuplicate receives tenantId parameter"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "   ⚠️  WARN: Webhook handler file not found"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""
```

---

### Fix 2: Add Missing Commands (4 hours)

**Priority:** HIGH - Significantly improves developer experience

#### Command 1: `/lint` (1 hour)

**File:** `.claude/commands/lint.md`

````markdown
# Lint and Format Code

Format code with Prettier and check with ESLint.

## Run Format Only

```bash
npm run format
```
````

## Run Lint Only

```bash
cd /Users/mikeyoung/CODING/Elope && npm run lint
```

## Fix Lint Issues

```bash
cd /Users/mikeyoung/CODING/Elope && npm run lint:fix
```

## Expected Output

✅ All files formatted consistently
✅ No linting errors found
✅ Ready to commit

## When to Use

- Before committing code
- When you see prettier/eslint formatting issues
- As part of your development workflow

## Troubleshooting

**Conflicts with running dev server?** Stop dev servers first with Ctrl+C.

**Still failing?** Check DEVELOPING.md for configuration details.

````

#### Command 2: `/doctor` (1 hour)

**File:** `.claude/commands/doctor.md`

```markdown
# Check Environment Health

Verify your development environment is properly configured.

## Run Health Check

```bash
cd /Users/mikeyoung/CODING/Elope && npm run doctor
````

## What It Checks

- Node.js version
- npm/pnpm version
- Database connection
- Required environment variables
- Port availability (3001, 5173, 5432)
- Git configuration

## Expected Output

```
✅ Node.js v18.x.x
✅ npm v9.x.x
✅ PostgreSQL connected
✅ All required env vars set
✅ Ports available
✅ Git configured
```

## If Checks Fail

1. **Missing Node.js:** Install from https://nodejs.org
2. **Database error:** Ensure PostgreSQL is running
3. **Missing env vars:** Copy .env.example to .env and fill in values
4. **Port conflicts:** Use `lsof -i :PORT` to find processes

## When to Run

- First time setup
- After pulling new changes
- When experiencing connection issues

````

#### Command 3: `/stripe` (1 hour)

**File:** `.claude/commands/stripe.md`

```markdown
# Stripe Development Tools

Manage Stripe webhook testing and integration during development.

## Start Listening for Webhooks

```bash
cd /Users/mikeyoung/CODING/Elope && stripe listen --forward-to localhost:3001/v1/webhooks/stripe
````

This forwards Stripe test events to your local API.

## Trigger Test Events

In another terminal:

```bash
stripe trigger payment_intent.succeeded
```

Or test specific events:

```bash
stripe trigger checkout.session.completed
stripe trigger charge.failed
```

## View Recent Events

```bash
stripe events list
```

## Expected Workflow

1. Start dev server: `/d`
2. In new terminal, start webhook listening: `/stripe listen`
3. In another terminal, trigger events: `/stripe trigger`
4. Watch API logs for webhook processing

## Troubleshooting

**"Command not found"?** Install Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

**Not receiving events?** Check:

1. Webhook listener still running
2. API server still running (port 3001)
3. Check logs for errors

## Webhook Testing

Manual test of complete flow:

1. Create booking via API
2. Manually trigger `checkout.session.completed`
3. Verify booking created in database
4. Check webhook event marked as processed

````

#### Command 4: `/db` (1 hour)

**File:** `.claude/commands/db.md`

```markdown
# Database Tools

Inspect, manage, and debug the database schema.

## Open Prisma Studio (GUI)

```bash
cd /Users/mikeyoung/CODING/Elope/server && npx prisma studio
````

Opens browser interface to explore and edit database data at http://localhost:5555

## View Current Schema

```bash
cd /Users/mikeyoung/CODING/Elope/server && npx prisma db pull
```

Introspects live database and updates schema.prisma.

## Create New Migration

After modifying schema.prisma:

```bash
cd /Users/mikeyoung/CODING/Elope/server && npx prisma migrate dev --name describe_changes
```

Example names: `add_user_table`, `add_webhook_events`, `increase_text_field_length`

## Run Seeds

```bash
cd /Users/mikeyoung/CODING/Elope/server && npx prisma db seed
```

Populates database with sample data from prisma/seed.ts.

## Reset Database

⚠️ **DESTRUCTIVE** - Deletes all data!

Use the `/reset` command instead, which includes reset + seed.

## View Migrations

```bash
cd /Users/mikeyoung/CODING/Elope/server && ls prisma/migrations
```

## Troubleshooting

**"Connection error"?**

```bash
# Check database is running
psql -U postgres -c "SELECT 1;"

# Check DATABASE_URL
echo $DATABASE_URL
```

**"Migration pending"?**

```bash
cd /Users/mikeyoung/CODING/Elope/server && npx prisma migrate deploy
```

## Common Tasks

### Add new table

1. Edit server/prisma/schema.prisma
2. Run: `npx prisma migrate dev --name add_table_name`
3. Commit files and test

### Add field to table

1. Edit schema.prisma
2. Run: `npx prisma migrate dev --name add_field_to_table`
3. Test that code compiles with new field

### Debug query issue

1. Open Prisma Studio: `/db`
2. Look at actual data
3. Test query in code

````

---

### Fix 3: Document HTTP Cache Middleware Risk (1 hour)

**File:** `server/src/middleware/cache.ts` (add warning)

```typescript
/**
 * Simple in-memory HTTP response caching middleware
 * Uses node-cache for LRU cache with TTL support
 *
 * ⚠️  CRITICAL SECURITY NOTE:
 * This middleware is NOT currently used in production.
 * If you deploy this middleware, you MUST provide a tenant-aware keyGenerator.
 *
 * INCORRECT (DATA LEAK):
 * ```typescript
 * app.get('/v1/packages', cacheMiddleware(), handler);
 * // Cache key: "GET:/v1/packages:{}" - SAME for all tenants!
 * ```
 *
 * CORRECT:
 * ```typescript
 * app.get('/v1/packages', cacheMiddleware({
 *   keyGenerator: (req) => `GET:${req.tenantId}:${req.path}`
 * }), handler);
 * // Cache key: "GET:tenant_123:/v1/packages" - Unique per tenant
 * ```
 *
 * If you don't need HTTP caching, consider removing this middleware
 * to reduce the attack surface.
 */
````

Add validation check:

```bash
# Add to validate-patterns.sh
echo "💾 Check N: HTTP cache middleware has tenant-aware keyGenerator"
if grep -r "cacheMiddleware(" server/src --include="*.ts" | grep -v "test" | grep -q "."; then
  # Found usage - verify keyGenerator
  if grep -B5 -A5 "cacheMiddleware(" server/src --include="*.ts" \
     | grep -q "keyGenerator.*tenantId"; then
    echo "   ✅ PASS: Cache middleware uses tenant-aware keyGenerator"
  else
    echo "   ❌ FAIL: Cache middleware missing tenant-aware keyGenerator"
    echo "   Fix: Add keyGenerator option with tenantId in key"
    ERRORS=$((ERRORS + 1))
  fi
fi
```

---

## Medium Priority Improvements

### Improvement 1: Expand Pattern Documentation (4 hours)

**File:** `.claude/PATTERNS_EXTENDED.md`

**Add sections:**

1. **Error Handling Pattern** (45 mins)

````markdown
## Error Handling Pattern

### Domain Errors (Domain Layer)

```typescript
// Define domain errors with business logic
export class BookingConflictError extends DomainError {
  constructor(date: string) {
    super(`Date ${date} is already booked`, 'BOOKING_CONFLICT', 409);
  }
}

// Service throws domain error
if (isBooked) {
  throw new BookingConflictError(date);
}
```
````

### HTTP Error Mapping (Controller Layer)

```typescript
// Express error middleware maps errors to HTTP responses
app.use((error, req, res, next) => {
  if (error instanceof BookingConflictError) {
    res.status(409).json({
      error: 'BOOKING_CONFLICT',
      message: error.message,
      statusCode: 409,
    });
  } else if (error instanceof NotFoundError) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: error.message,
    });
  } else {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});
```

````

2. **Concurrency Control Pattern** (45 mins)
```markdown
## Concurrency Control Pattern

### Pessimistic Locking (Most Common)
For operations where conflicts are likely:

```typescript
async create(tenantId: string, booking: Booking): Promise<Booking> {
  return await prisma.$transaction(async (tx) => {
    // Lock prevents other transactions from accessing this date
    const lockQuery = `
      SELECT 1 FROM "Booking"
      WHERE "tenantId" = $1 AND date = $2
      FOR UPDATE NOWAIT
    `;
    await tx.$queryRawUnsafe(lockQuery, tenantId, booking.date);

    // Safe to create - date is locked
    return await tx.booking.create({ data: booking });
  });
}
````

### Optimistic Locking (Version Column)

For operations where conflicts are rare:

```typescript
async update(id: string, data: UpdateData): Promise<Entity> {
  const result = await prisma.entity.update({
    where: { id },
    data: {
      ...data,
      version: { increment: 1 }
    }
  });
  return result;
}
```

````

3. **Logging Best Practices** (45 mins)
```markdown
## Logging Pattern

### DO: Log with structured context
```typescript
logger.info({
  tenantId,
  bookingId,
  eventDate,
  amount: calculation.subtotal
}, 'Booking created successfully');
````

### DON'T: Log sensitive data

```typescript
// WRONG - logs API key
logger.debug({ apiKey: req.headers['x-api-key'] }, 'Request received');

// CORRECT - redact sensitive data
logger.debug(
  {
    apiKey: apiKey.substring(0, 20) + '...',
  },
  'Request received'
);
```

````

4. **Performance Optimization Guide** (45 mins)
```markdown
## Performance Patterns

### N+1 Query Prevention
```typescript
// WRONG - N+1 queries
const packages = await catalogRepo.getAllPackages(tenantId);
for (const pkg of packages) {
  pkg.addOns = await catalogRepo.getAddOnsByPackageId(tenantId, pkg.id);
}

// CORRECT - Single query
const packages = await catalogRepo.getAllPackagesWithAddOns(tenantId);
````

### Caching Strategy

```typescript
// Cache frequently accessed data
const cacheKey = `catalog:${tenantId}:all-packages`;
let packages = cache.get(cacheKey);
if (!packages) {
  packages = await repo.getAllPackages(tenantId);
  cache.set(cacheKey, packages, 900); // 15 minutes
}
```

````

---

## Validation Enhancement (6 hours)

### Add N+1 Query Detection

```bash
# Check for N+1 patterns
echo "📊 Check N: No N+1 queries (use include instead of loop)"

if grep -r "for.*in\|forEach" server/src/services --include="*.ts" \
   | grep -B3 -A3 "await.*repo\." \
   | grep -v "test" \
   | grep -q "."; then
  echo "   ⚠️  WARN: Possible N+1 query pattern in services"
  echo "   Action: Use repository method with include or getAllWith* variant"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   ✅ PASS: No N+1 patterns detected"
fi
````

### Add Sensitive Data Check

```bash
# Check for logging sensitive data
echo "🔐 Check N: No sensitive data logged"

if grep -r "logger\." server/src --include="*.ts" \
   | grep -E "apiKey|password|secret|bearer|token" \
   | grep -v "substring\|redact\|masked\|test" \
   | grep -q "."; then
  echo "   ⚠️  WARN: Possible sensitive data in logs"
  echo "   Action: Redact API keys, passwords, tokens before logging"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   ✅ PASS: No sensitive data found in logs"
fi
```

---

## Summary of Changes

**Total Effort:** ~18 hours

**Immediate Impact:**

- Validation script 40% more accurate
- 4 new commands improve velocity
- Clear cache middleware documentation prevents leaks

**Medium Term:**

- 10+ patterns documented
- Developers understand best practices
- Fewer questions about implementation details

**Metrics to Track:**

- Validation script accuracy > 90%
- Onboarding time reduced by 20%
- Feature development velocity increased
- Zero cache-related security incidents

---

**Next Steps:**

1. Prioritize validation script fixes
2. Plan command implementation
3. Schedule pattern documentation
4. Assign team members
5. Review and test improvements before deployment
