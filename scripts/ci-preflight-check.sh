#!/bin/bash

# CI Pre-flight Validation Script
# Run before CI/CD deployment to catch issues early
#
# Usage: ./scripts/ci-preflight-check.sh
# Exit code: 0 if all checks pass, 1 if any fail

set -e

# Colors for output
COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Utility functions
log_pass() {
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"
    ((CHECKS_PASSED++))
}

log_fail() {
    echo -e "${COLOR_RED}✗${COLOR_RESET} $1"
    ((CHECKS_FAILED++))
}

log_warn() {
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} $1"
    ((WARNINGS++))
}

log_info() {
    echo -e "${COLOR_BLUE}ℹ${COLOR_RESET} $1"
}

# Start
echo ""
echo -e "${COLOR_BLUE}================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}🚀 CI Pre-flight Validation${COLOR_RESET}"
echo -e "${COLOR_BLUE}================================${COLOR_RESET}"
echo ""

# ========================================
# Check 1: File Structure
# ========================================
echo -e "${COLOR_BLUE}📁 File Structure${COLOR_RESET}"

if [ -f ".eslintrc.cjs" ]; then
    log_pass "ESLint root config exists"
else
    log_fail "ESLint root config missing (.eslintrc.cjs)"
fi

if [ -f "server/.eslintrc.cjs" ]; then
    log_pass "Server ESLint config exists"
else
    log_warn "Server ESLint config missing (server/.eslintrc.cjs) - using root config"
fi

if [ -f "client/.eslintrc.cjs" ]; then
    log_pass "Client ESLint config exists"
else
    log_warn "Client ESLint config missing (client/.eslintrc.cjs) - using root config"
fi

if [ -d ".github/workflows" ]; then
    log_pass "GitHub workflows directory exists"
else
    log_fail "GitHub workflows directory missing (.github/workflows)"
fi

echo ""

# ========================================
# Check 2: Documentation
# ========================================
echo -e "${COLOR_BLUE}📚 Documentation${COLOR_RESET}"

docs_required=(
    "docs/deployment/CI_CD_FAILURE_PREVENTION.md"
    "docs/deployment/ENVIRONMENT_VARIABLES.md"
    "docs/deployment/GITHUB_SECRETS_SETUP.md"
)

for doc in "${docs_required[@]}"; do
    if [ -f "$doc" ]; then
        log_pass "$doc exists"
    else
        log_warn "$doc missing"
    fi
done

echo ""

# ========================================
# Check 3: Environment Variables
# ========================================
echo -e "${COLOR_BLUE}🔐 Environment Configuration${COLOR_RESET}"

# Check .env.example exists
if [ -f ".env.example" ]; then
    log_pass ".env.example exists"
else
    log_fail ".env.example not found"
fi

# Check Prisma schema has DIRECT_URL
if [ -f "server/prisma/schema.prisma" ]; then
    if grep -q 'directUrl.*env("DIRECT_URL")' server/prisma/schema.prisma; then
        log_pass "Prisma schema has DIRECT_URL"
    else
        log_fail "Prisma schema missing DIRECT_URL configuration"
    fi
else
    log_fail "Prisma schema not found"
fi

# Check doctor script exists
if [ -f "server/scripts/doctor.ts" ]; then
    log_pass "Doctor script exists"
else
    log_fail "Doctor script missing (server/scripts/doctor.ts)"
fi

echo ""

# ========================================
# Check 4: GitHub Actions Workflows
# ========================================
echo -e "${COLOR_BLUE}⚙️  GitHub Actions Workflows${COLOR_RESET}"

workflows=(
    ".github/workflows/main-pipeline.yml"
    ".github/workflows/deploy-production.yml"
)

for workflow in "${workflows[@]}"; do
    if [ -f "$workflow" ]; then
        log_pass "$workflow exists"

        # Check for DIRECT_URL in migration steps
        if grep -q "prisma migrate" "$workflow"; then
            if grep -B 10 "prisma migrate" "$workflow" | grep -q "DIRECT_URL"; then
                log_pass "  - Migrations use DIRECT_URL"
            else
                log_fail "  - Migrations missing DIRECT_URL"
            fi
        fi
    else
        log_fail "$workflow not found"
    fi
done

echo ""

# ========================================
# Check 5: ESLint Configuration Quality
# ========================================
echo -e "${COLOR_BLUE}🎨 ESLint Configuration${COLOR_RESET}"

if [ -f ".eslintrc.cjs" ]; then
    # Check for strict type checking
    if grep -q "strict-type-checked" .eslintrc.cjs; then
        log_pass "ESLint has strict type checking enabled"
    else
        log_warn "ESLint missing strict-type-checked (optional but recommended)"
    fi

    # Check for no-explicit-any rule
    if grep -q "no-explicit-any.*error" .eslintrc.cjs; then
        log_pass "ESLint enforces no explicit any"
    else
        log_warn "ESLint doesn't enforce no-explicit-any (optional but recommended)"
    fi

    # Check for workspace project references
    if grep -q '"project".*tsconfig' .eslintrc.cjs; then
        log_pass "ESLint has workspace tsconfig references"
    else
        log_warn "ESLint missing workspace tsconfig references (may cause CI issues)"
    fi
fi

echo ""

# ========================================
# Check 6: Prisma Configuration
# ========================================
echo -e "${COLOR_BLUE}💾 Prisma Configuration${COLOR_RESET}"

if [ -d "server/prisma/migrations" ]; then
    migration_count=$(find server/prisma/migrations -type d -maxdepth 1 | wc -l)
    log_pass "Migrations directory exists ($(($migration_count - 1)) migrations)"
else
    log_warn "No migrations directory (first migration not yet created)"
fi

if [ -f "server/prisma/schema.prisma" ]; then
    # Check for generator configuration
    if grep -q "generator client" server/prisma/schema.prisma; then
        log_pass "Prisma client generator configured"
    else
        log_fail "Prisma client generator not configured"
    fi

    # Check for database datasource
    if grep -q "datasource db" server/prisma/schema.prisma; then
        log_pass "Prisma datasource configured"
    else
        log_fail "Prisma datasource not configured"
    fi
fi

echo ""

# ========================================
# Check 7: CI/CD Best Practices
# ========================================
echo -e "${COLOR_BLUE}✨ CI/CD Best Practices${COLOR_RESET}"

# Check for problematic continue-on-error bypasses
echo -n "Checking for continue-on-error bypasses... "
BYPASS_COUNT=$(grep -r "continue-on-error: true" .github/workflows/ 2>/dev/null | wc -l)
if [ "$BYPASS_COUNT" -gt 0 ]; then
    log_warn "Found $BYPASS_COUNT continue-on-error bypasses (should fix root causes)"
else
    log_pass "No continue-on-error bypasses (good!)"
fi

# Check for hardcoded secrets
echo -n "Checking for hardcoded secrets... "
if grep -r "sk_live_\|sk_test_\|whsec_\|Bearer " --include="*.ts" --include="*.tsx" --include="*.js" \
    --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | \
    grep -v "node_modules" | grep -v ".git" > /dev/null; then
    log_fail "Found potential hardcoded secrets (remove and use env vars)"
else
    log_pass "No hardcoded secrets found"
fi

# Check for console.log in source code (not test files)
echo -n "Checking for console.log in code... "
CONSOLE_COUNT=$(find server/src client/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
    xargs grep -l "console\." 2>/dev/null | wc -l)
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    log_warn "Found $CONSOLE_COUNT files with console.log (should use logger)"
else
    log_pass "No console.log in source code"
fi

echo ""

# ========================================
# Check 8: Required Scripts
# ========================================
echo -e "${COLOR_BLUE}🔧 Required Scripts${COLOR_RESET}"

scripts_required=(
    "npm run doctor"
    "npm run lint"
    "npm run typecheck"
    "npm run test"
    "npm run build"
)

package_json=$(cat package.json)
for script in "${scripts_required[@]}"; do
    script_name=${script#npm run }
    if echo "$package_json" | grep -q "\"$script_name\""; then
        log_pass "$script"
    else
        log_fail "$script missing from package.json"
    fi
done

echo ""

# ========================================
# Check 9: Environment Variable Documentation
# ========================================
echo -e "${COLOR_BLUE}📋 Environment Variables${COLOR_RESET}"

if [ -f "docs/deployment/ENVIRONMENT_VARIABLES.md" ]; then
    # Check for required variables
    required_vars=("JWT_SECRET" "DATABASE_URL" "DIRECT_URL" "ADAPTERS_PRESET")
    for var in "${required_vars[@]}"; do
        if grep -q "| $var " docs/deployment/ENVIRONMENT_VARIABLES.md; then
            log_pass "$var documented"
        else
            log_warn "$var not documented in ENVIRONMENT_VARIABLES.md"
        fi
    done
else
    log_warn "ENVIRONMENT_VARIABLES.md not found"
fi

echo ""

# ========================================
# Check 10: Deployment Configuration
# ========================================
echo -e "${COLOR_BLUE}🚢 Deployment Configuration${COLOR_RESET}"

if [ -f "docs/deployment/GITHUB_SECRETS_SETUP.md" ]; then
    log_pass "GitHub secrets documentation exists"
else
    log_warn "GitHub secrets documentation missing"
fi

if [ -f ".env.example" ]; then
    # Check for PRODUCTION URLs
    if grep -q "PRODUCTION_" .env.example; then
        log_pass "Production environment variables documented"
    else
        log_warn "Production environment variables not in .env.example"
    fi
fi

echo ""

# ========================================
# Summary
# ========================================
echo -e "${COLOR_BLUE}================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}Summary${COLOR_RESET}"
echo -e "${COLOR_BLUE}================================${COLOR_RESET}"
echo ""

TOTAL=$((CHECKS_PASSED + CHECKS_FAILED))

echo -e "Passed:   ${COLOR_GREEN}$CHECKS_PASSED${COLOR_RESET}"
echo -e "Failed:   ${COLOR_RED}$CHECKS_FAILED${COLOR_RESET}"
echo -e "Warnings: ${COLOR_YELLOW}$WARNINGS${COLOR_RESET}"
echo ""

if [ "$CHECKS_FAILED" -eq 0 ]; then
    echo -e "${COLOR_GREEN}✅ All critical checks passed!${COLOR_RESET}"
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "${COLOR_YELLOW}⚠️  Fix $WARNINGS warning(s) for best practices${COLOR_RESET}"
    fi
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run doctor"
    echo "  2. Run: npm run lint"
    echo "  3. Run: npm run typecheck"
    echo "  4. Run: npm run test"
    echo ""
    exit 0
else
    echo -e "${COLOR_RED}❌ $CHECKS_FAILED critical check(s) failed!${COLOR_RESET}"
    echo ""
    echo "Fix the above issues before deploying:"
    echo "  1. Review errors above"
    echo "  2. See docs/deployment/CI_CD_FAILURE_PREVENTION.md for solutions"
    echo "  3. Run npm run doctor to validate environment"
    echo ""
    exit 1
fi
