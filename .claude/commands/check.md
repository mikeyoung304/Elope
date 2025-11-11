Validate multi-tenant isolation patterns in the Elope codebase.

This is a CRITICAL safety check to prevent cross-tenant data leaks.

Run the following validations:

## 1. Check Repository Interfaces for Missing tenantId

Search for repository interface methods that don't have `tenantId` as the first parameter:

```bash
cd /Users/mikeyoung/CODING/Elope/server/src
```

Use Grep to find repository interfaces and check if they include tenantId parameters.

## 2. Check Cache Keys for Tenant Isolation

Search for cache operations that might not include tenantId:

```bash
cd /Users/mikeyoung/CODING/Elope/server/src
```

Use Grep to find cache usage patterns and verify they include `${tenantId}` in keys.

## 3. Check Commission Calculation (Must Use Math.ceil)

Search for incorrect commission rounding:

```bash
cd /Users/mikeyoung/CODING/Elope/server/src
```

Use Grep to find any use of `Math.floor` in commission-related code (should always be `Math.ceil`).

## 4. Check Prisma Queries for tenantId

Search for Prisma queries that might be missing tenantId:

```bash
cd /Users/mikeyoung/CODING/Elope/server/src
```

Use Grep to find `.findMany(`, `.findFirst(`, `.findUnique(` calls and verify they include tenantId.

## Expected Output

For each check, report:
- ✅ PASS: No violations found
- ⚠️  WARN: Potential issues (need manual review)
- ❌ FAIL: Definite violations (must fix immediately)

## Critical Patterns to Enforce

1. **Repository Pattern**: ALL repository methods MUST have `tenantId: string` as first parameter
2. **Cache Pattern**: ALL cache keys MUST include `${tenantId}:` prefix
3. **Commission Pattern**: ALWAYS use `Math.ceil()` to round UP (protect platform revenue)
4. **Query Pattern**: ALL Prisma queries MUST include `where: { tenantId, ... }`

See `.claude/PATTERNS.md` for detailed examples.
