Validate multi-tenant isolation patterns in the MAIS codebase.

This is a CRITICAL safety check to prevent cross-tenant data leaks.

## Validations

### 1. Repository Methods - tenantId First Parameter

```bash
grep -rn "interface.*Repository" server/src --include="*.ts" -A 10
```

Every method must have `tenantId: string` as first parameter.

### 2. Cache Keys - Tenant Prefix

```bash
grep -rn "cache\." server/src --include="*.ts"
```

All keys must include `tenant:${tenantId}:` prefix.

### 3. Prisma Queries - tenantId Filter

```bash
grep -rn "findMany\|findFirst\|findUnique" server/src --include="*.ts" -A 3
```

All queries must include `where: { tenantId, ... }`.

## Output Format

- ✅ PASS: No violations
- ⚠️ WARN: Needs review
- ❌ FAIL: Must fix
