---
title: Prevention Strategies - Quick Reference
category: prevention
tags: [cheat-sheet, security, multi-tenant]
priority: P0
---

# Prevention Strategies - Quick Reference

**Print this and pin it to your wall! 📌**

---

## 🚨 Before Committing ANY Code

### Multi-Tenant Security (CRITICAL)

```typescript
// ✅ ALWAYS filter by tenantId
const packages = await prisma.package.findMany({
  where: { tenantId }  // ← NEVER forget this!
});

// ❌ NEVER query without tenantId
const packages = await prisma.package.findMany();
```

```typescript
// ✅ ALWAYS validate ownership of foreign keys
if (data.segmentId) {
  await segmentService.getById(tenantId, data.segmentId);
  // Throws if segment doesn't belong to tenant
}

// ❌ NEVER trust user-provided IDs
await prisma.package.create({
  data: { segmentId: data.segmentId } // ← No validation!
});
```

```typescript
// ✅ ALWAYS use tenant-scoped cache keys
const key = `catalog:${tenantId}:packages`;

// ❌ NEVER use global cache keys
const key = 'catalog:packages'; // ← Leaks data between tenants!
```

---

### Input Normalization (CRITICAL)

```typescript
// ✅ ALWAYS normalize email before storage/queries
const email = inputEmail.toLowerCase().trim();

// ❌ NEVER use raw email input
const tenant = await prisma.tenant.findUnique({
  where: { email: inputEmail } // ← Case-sensitive!
});
```

```typescript
// ✅ Test with ALL case variations
const testCases = [
  'user@example.com',
  'USER@EXAMPLE.COM',
  'User@Example.Com',
  '  user@example.com  '
];
```

---

### Database Patterns (CRITICAL)

```typescript
// ✅ NEVER create new PrismaClient
import { prisma } from '../lib/db'; // Use singleton

// ❌ Connection pool exhaustion!
const prisma = new PrismaClient(); // ← Creates 20 connections
```

```typescript
// ✅ Prevent N+1 queries
const packages = await prisma.package.findMany({
  where: { tenantId },
  include: { addOns: true } // ← Single query
});

// ❌ N+1 query pattern
const packages = await prisma.package.findMany({ where: { tenantId } });
for (const pkg of packages) {
  pkg.addOns = await prisma.addOn.findMany({ // ← N queries!
    where: { packageId: pkg.id }
  });
}
```

---

### Logging & Debugging

```typescript
// ✅ Use logger from lib/core/logger
import { logger } from '../lib/core/logger';
logger.info({ userId }, 'User logged in');

// ❌ NEVER use console.log in production code
console.log('User logged in', userId); // ← ESLint will block this
```

---

### UI Patterns

```typescript
// ✅ Use React controlled components
const [email, setEmail] = useState('');
<Input value={email} onChange={e => setEmail(e.target.value)} />

// ❌ NEVER use browser prompt/alert/confirm
const email = prompt('Enter email'); // ← ESLint will block this
```

---

## 📋 Code Review Checklist

Copy-paste this into your PR description:

```markdown
## Multi-Tenant Security
- [ ] All queries filter by tenantId
- [ ] Foreign keys validate ownership
- [ ] Cache keys include tenantId
- [ ] Error messages don't leak tenant info

## Input Handling
- [ ] Emails normalized to lowercase
- [ ] Test cases cover case variations
- [ ] Whitespace trimmed from input

## Database Performance
- [ ] No N+1 query patterns
- [ ] Indexes exist for WHERE clauses
- [ ] No new PrismaClient() instantiated
- [ ] Pagination for unbounded queries

## Feature Completeness
- [ ] Backend routes implemented
- [ ] Frontend UI implemented
- [ ] Tests cover happy + error paths
- [ ] Documentation updated

## Testing
- [ ] Tenant isolation tested
- [ ] Input normalization tested
- [ ] Idempotency tested (webhooks)
- [ ] Performance tested (N+1 check)
```

---

## 🧪 Required Test Patterns

### Tenant Isolation

```typescript
it('should not return data from other tenants', async () => {
  const tenantA = await createTestTenant();
  const tenantB = await createTestTenant();

  await repo.create(tenantA.id, { name: 'A' });
  await repo.create(tenantB.id, { name: 'B' });

  const resultsA = await repo.findAll(tenantA.id);
  expect(resultsA).toHaveLength(1);
  expect(resultsA[0].name).toBe('A');
});
```

### Input Normalization

```typescript
const cases = ['user@example.com', 'USER@EXAMPLE.COM', '  User@Example.Com  '];
cases.forEach(email => {
  it(`should normalize "${email}"`, async () => {
    const result = await service.login(email, 'password');
    expect(result).toBeDefined();
  });
});
```

### Idempotency

```typescript
it('should handle duplicate events', async () => {
  await processWebhook(payload);
  await processWebhook(payload); // Same payload

  const bookings = await repo.findAll(tenantId);
  expect(bookings).toHaveLength(1); // Only created once
});
```

---

## ⚡ ESLint Quick Fixes

### If you see: `no-console` error

```typescript
// ❌ WRONG
console.log('Debug info');

// ✅ RIGHT
import { logger } from '../lib/core/logger';
logger.info('Debug info');
```

### If you see: `no-restricted-syntax` (PrismaClient)

```typescript
// ❌ WRONG
const prisma = new PrismaClient();

// ✅ RIGHT
import { container } from '../di';
const prisma = container.prisma;
```

### If you see: `no-restricted-globals` (prompt)

```typescript
// ❌ WRONG
const email = prompt('Enter email');

// ✅ RIGHT
const [email, setEmail] = useState('');
<Input value={email} onChange={e => setEmail(e.target.value)} />
```

---

## 🔍 Grep Commands for Self-Review

Before submitting PR, run these:

```bash
# Check for missing tenantId filters
rg 'prisma\.\w+\.findMany' --type ts | rg -v 'tenantId'

# Check for new PrismaClient()
rg 'new PrismaClient\(\)' server/src/routes --type ts

# Check for console.log
rg 'console\.log' server/src --type ts

# Check for prompt/alert/confirm
rg 'prompt\(|alert\(|confirm\(' client/src --type ts

# Check for magic tenantId strings
rg 'tenantId.*=.*(unknown|default|test)' --type ts
```

If any return results, fix before committing!

---

## 📚 Documentation Requirements

### When adding a feature, update:

1. **CLAUDE.md** - Add patterns/gotchas
2. **API Contracts** - Define in `packages/contracts`
3. **Repository Interface** - Update `lib/ports.ts`
4. **This Document** - If new prevention strategy

### Required code comments:

```typescript
/**
 * [Method name]
 *
 * CRITICAL: [Why this pattern matters]
 * - Security concern
 * - Performance concern
 * - Business logic
 *
 * See: docs/solutions/[relevant-doc].md
 */
```

---

## 🎯 Quick Decision Trees

### Should I create a new PrismaClient?
```
Are you in di.ts? → YES → OK
                  → NO  → Use dependency injection
```

### Should I filter by tenantId?
```
Does query touch tenant-scoped data? → YES → ALWAYS filter
                                     → NO  → Only platform admin tables
```

### Should I normalize this email?
```
Is it user input? → YES → ALWAYS normalize
                  → NO  → Already normalized in DB
```

### Should I implement frontend UI?
```
Did I add backend route? → YES → MUST add frontend
                         → NO  → Backend first
```

---

## 🚀 Common Fixes

### Fix: Queries without tenantId

```typescript
// Before
const packages = await prisma.package.findMany();

// After
const packages = await prisma.package.findMany({
  where: { tenantId }
});
```

### Fix: Multiple PrismaClient instances

```typescript
// Before
const prisma = new PrismaClient();

// After (create lib/db.ts)
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// Import everywhere
import { prisma } from '../lib/db';
```

### Fix: N+1 Query Pattern

```typescript
// Before
const packages = await prisma.package.findMany({ where: { tenantId } });
for (const pkg of packages) {
  pkg.addOns = await prisma.addOn.findMany({ where: { packageId: pkg.id } });
}

// After
const packages = await prisma.package.findMany({
  where: { tenantId },
  include: { addOns: true }
});
```

### Fix: Missing email normalization

```typescript
// Before
const tenant = await repo.findByEmail(email);

// After
const tenant = await repo.findByEmail(email.toLowerCase().trim());
```

---

## 📞 When in Doubt

1. Check similar code in codebase
2. Search docs: `rg "pattern name" docs/`
3. Read CLAUDE.md section
4. Ask in #engineering channel
5. Pair program with senior engineer

---

## 🎓 Training Resources

- [Comprehensive Prevention Strategies](./COMPREHENSIVE-PREVENTION-STRATEGIES.md)
- [Multi-Tenant Implementation Guide](../multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md)
- [Email Case-Sensitivity Prevention](./security-issues/PREVENTION-STRATEGY-EMAIL-CASE-SENSITIVITY.md)
- [CLAUDE.md](../../CLAUDE.md)

---

**Keep this handy! Print it out! 📄**

**Last Updated:** 2025-11-27
