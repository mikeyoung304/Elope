#!/bin/bash

# Elope Multi-Tenant Pattern Validation Script
# This script validates critical patterns to prevent cross-tenant data leaks
# Usage: .claude/hooks/validate-patterns.sh
# Exit codes: 0 = all checks pass, 1 = violations found

set -e

ERRORS=0
WARNINGS=0

echo "🔍 Validating Elope Multi-Tenant Patterns..."
echo ""

# Change to project root
cd "$(dirname "$0")/../.."

# Check 1: Repository Interface - tenantId as First Parameter
echo "📋 Check 1: Repository interfaces must have tenantId as first parameter"
if grep -r "Repository" server/src/lib/ports.ts | grep -E "(find|get|create|update|delete)" | grep -v "tenantId: string" | grep -q "."; then
  echo "   ❌ FAIL: Found repository methods without tenantId parameter"
  echo "   Action: Add 'tenantId: string' as first parameter to all repository methods"
  echo "   See: .claude/PATTERNS.md § Repository Pattern"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ PASS: All repository interfaces have tenantId parameter"
fi
echo ""

# Check 2: Commission Calculation - Must Use Math.ceil
echo "💰 Check 2: Commission calculation must use Math.ceil (round UP)"
if grep -r "Math\.floor" server/src/services/commission.service.ts 2>/dev/null | grep -q "."; then
  echo "   ❌ FAIL: Found Math.floor in commission calculation"
  echo "   Action: Replace Math.floor with Math.ceil to protect platform revenue"
  echo "   Example: const commission = Math.ceil(subtotal * 0.125)"
  echo "   See: .claude/PATTERNS.md § Commission Calculation Pattern"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ PASS: No Math.floor found in commission calculation"
fi
echo ""

# Check 3: Cache Keys - Must Include tenantId
echo "🗄️  Check 3: Cache keys must include tenantId prefix"
# This is a warning check since cache implementation may vary
if grep -r "cache\." server/src --include="*.ts" | grep -v "test" | grep -v "${tenantId}" | grep -v "tenantId" | wc -l | grep -v "^0$" | grep -q "."; then
  echo "   ⚠️  WARN: Possible cache operations without tenantId"
  echo "   Action: Verify all cache keys include \${tenantId}: prefix"
  echo "   Example: const key = \`\${tenantId}:packages\`"
  echo "   See: .claude/PATTERNS.md § Cache Pattern"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   ✅ PASS: Cache keys appear to include tenantId"
fi
echo ""

# Check 4: Prisma Queries - Must Include tenantId in WHERE Clause
echo "🔐 Check 4: Prisma queries must scope by tenantId"
# Look for common Prisma query patterns
if grep -r "\.findMany\|\.findFirst\|\.findUnique" server/src/adapters/prisma --include="*.ts" | grep -v "where.*tenantId" | grep -v "test" | wc -l | grep -v "^0$" | grep -q "."; then
  echo "   ⚠️  WARN: Possible Prisma queries without tenantId scoping"
  echo "   Action: Verify all queries include tenantId in WHERE clause"
  echo "   Example: await prisma.package.findMany({ where: { tenantId, active: true } })"
  echo "   See: .claude/PATTERNS.md § Repository Pattern"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   ✅ PASS: Prisma queries appear to include tenantId"
fi
echo ""

# Check 5: Webhook Idempotency - Must Check eventId
echo "🔔 Check 5: Webhook handlers must check for duplicate events"
if [ -f "server/src/routes/webhooks.routes.ts" ]; then
  if grep -q "isDuplicate\|eventId" server/src/routes/webhooks.routes.ts; then
    echo "   ✅ PASS: Webhook handler includes idempotency check"
  else
    echo "   ❌ FAIL: Webhook handler missing idempotency check"
    echo "   Action: Check for duplicate eventId before processing webhook"
    echo "   See: .claude/PATTERNS.md § Webhook Pattern"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "   ⚠️  WARN: Webhook handler file not found"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "═══════════════════════════════════════"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All pattern validations passed!"
  echo "   Safe to commit."
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Validation complete with warnings"
  echo "   Errors: $ERRORS"
  echo "   Warnings: $WARNINGS"
  echo "   Review warnings before committing."
  exit 0
else
  echo "❌ Validation failed!"
  echo "   Errors: $ERRORS"
  echo "   Warnings: $WARNINGS"
  echo "   Fix errors before committing."
  exit 1
fi
