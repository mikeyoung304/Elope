#!/bin/bash

###############################################################################
# Unified Authentication Test Script
# Tests the new /v1/auth/login endpoint for both platform and tenant admins
###############################################################################

set -e

API_URL="${API_URL:-http://localhost:3001}"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║         Unified Authentication System Test Suite             ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}API URL:${NC} $API_URL"
echo ""

###############################################################################
# Test 1: Platform Admin Login
###############################################################################

echo -e "${BOLD}Test 1: Platform Admin Login via Unified Endpoint${NC}"
echo -e "${YELLOW}POST /v1/auth/login${NC}"
echo ""

ADMIN_RESPONSE=$(curl -s -X POST ${API_URL}/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elope.com",
    "password": "admin123"
  }')

echo -e "${BLUE}Request:${NC}"
echo '{
  "email": "admin@elope.com",
  "password": "admin123"
}'
echo ""

echo -e "${BLUE}Response:${NC}"
echo "$ADMIN_RESPONSE" | jq '.'
echo ""

# Extract token and role
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token // empty')
ADMIN_ROLE=$(echo "$ADMIN_RESPONSE" | jq -r '.role // empty')
ADMIN_EMAIL=$(echo "$ADMIN_RESPONSE" | jq -r '.email // empty')
ADMIN_USER_ID=$(echo "$ADMIN_RESPONSE" | jq -r '.userId // empty')

if [ "$ADMIN_ROLE" == "PLATFORM_ADMIN" ]; then
  echo -e "${GREEN}✅ Test 1 PASSED:${NC} Platform admin login successful"
  echo -e "   Role: $ADMIN_ROLE"
  echo -e "   Email: $ADMIN_EMAIL"
  echo -e "   UserID: $ADMIN_USER_ID"
  echo -e "   Token: ${ADMIN_TOKEN:0:50}..."
else
  echo -e "${RED}❌ Test 1 FAILED:${NC} Expected role PLATFORM_ADMIN, got: $ADMIN_ROLE"
  exit 1
fi
echo ""

###############################################################################
# Test 2: Tenant Admin Login
###############################################################################

echo -e "${BOLD}Test 2: Tenant Admin Login via Unified Endpoint${NC}"
echo -e "${YELLOW}POST /v1/auth/login${NC}"
echo ""

TENANT_RESPONSE=$(curl -s -X POST ${API_URL}/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-tenant@example.com",
    "password": "Test123456"
  }')

echo -e "${BLUE}Request:${NC}"
echo '{
  "email": "test-tenant@example.com",
  "password": "Test123456"
}'
echo ""

echo -e "${BLUE}Response:${NC}"
echo "$TENANT_RESPONSE" | jq '.'
echo ""

# Extract token and role
TENANT_TOKEN=$(echo "$TENANT_RESPONSE" | jq -r '.token // empty')
TENANT_ROLE=$(echo "$TENANT_RESPONSE" | jq -r '.role // empty')
TENANT_EMAIL=$(echo "$TENANT_RESPONSE" | jq -r '.email // empty')
TENANT_ID=$(echo "$TENANT_RESPONSE" | jq -r '.tenantId // empty')
TENANT_SLUG=$(echo "$TENANT_RESPONSE" | jq -r '.slug // empty')

if [ "$TENANT_ROLE" == "TENANT_ADMIN" ]; then
  echo -e "${GREEN}✅ Test 2 PASSED:${NC} Tenant admin login successful"
  echo -e "   Role: $TENANT_ROLE"
  echo -e "   Email: $TENANT_EMAIL"
  echo -e "   TenantID: $TENANT_ID"
  echo -e "   Slug: $TENANT_SLUG"
  echo -e "   Token: ${TENANT_TOKEN:0:50}..."
else
  echo -e "${RED}❌ Test 2 FAILED:${NC} Expected role TENANT_ADMIN, got: $TENANT_ROLE"
  exit 1
fi
echo ""

###############################################################################
# Test 3: Verify Platform Admin Token
###############################################################################

echo -e "${BOLD}Test 3: Verify Platform Admin Token${NC}"
echo -e "${YELLOW}GET /v1/auth/verify${NC}"
echo ""

VERIFY_ADMIN=$(curl -s -X GET ${API_URL}/v1/auth/verify \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo -e "${BLUE}Response:${NC}"
echo "$VERIFY_ADMIN" | jq '.'
echo ""

VERIFY_ADMIN_ROLE=$(echo "$VERIFY_ADMIN" | jq -r '.role // empty')

if [ "$VERIFY_ADMIN_ROLE" == "PLATFORM_ADMIN" ]; then
  echo -e "${GREEN}✅ Test 3 PASSED:${NC} Platform admin token verified"
else
  echo -e "${RED}❌ Test 3 FAILED:${NC} Token verification failed"
  exit 1
fi
echo ""

###############################################################################
# Test 4: Verify Tenant Admin Token
###############################################################################

echo -e "${BOLD}Test 4: Verify Tenant Admin Token${NC}"
echo -e "${YELLOW}GET /v1/auth/verify${NC}"
echo ""

VERIFY_TENANT=$(curl -s -X GET ${API_URL}/v1/auth/verify \
  -H "Authorization: Bearer ${TENANT_TOKEN}")

echo -e "${BLUE}Response:${NC}"
echo "$VERIFY_TENANT" | jq '.'
echo ""

VERIFY_TENANT_ROLE=$(echo "$VERIFY_TENANT" | jq -r '.role // empty')

if [ "$VERIFY_TENANT_ROLE" == "TENANT_ADMIN" ]; then
  echo -e "${GREEN}✅ Test 4 PASSED:${NC} Tenant admin token verified"
else
  echo -e "${RED}❌ Test 4 FAILED:${NC} Token verification failed"
  exit 1
fi
echo ""

###############################################################################
# Test 5: Invalid Credentials
###############################################################################

echo -e "${BOLD}Test 5: Invalid Credentials Handling${NC}"
echo -e "${YELLOW}POST /v1/auth/login${NC}"
echo ""

INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }')

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$INVALID_RESPONSE" | head -n-1)

echo -e "${BLUE}HTTP Status:${NC} $HTTP_CODE"
echo -e "${BLUE}Response:${NC}"
echo "$RESPONSE_BODY" | jq '.'
echo ""

if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ Test 5 PASSED:${NC} Invalid credentials rejected with 401"
else
  echo -e "${RED}❌ Test 5 FAILED:${NC} Expected HTTP 401, got: $HTTP_CODE"
  exit 1
fi
echo ""

###############################################################################
# Test 6: Missing Authorization Header
###############################################################################

echo -e "${BOLD}Test 6: Missing Authorization Header${NC}"
echo -e "${YELLOW}GET /v1/auth/verify${NC}"
echo ""

NO_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET ${API_URL}/v1/auth/verify)

HTTP_CODE=$(echo "$NO_AUTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$NO_AUTH_RESPONSE" | head -n-1)

echo -e "${BLUE}HTTP Status:${NC} $HTTP_CODE"
echo -e "${BLUE}Response:${NC}"
echo "$RESPONSE_BODY" | jq '.'
echo ""

if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✅ Test 6 PASSED:${NC} Missing auth header rejected with 401"
else
  echo -e "${RED}❌ Test 6 FAILED:${NC} Expected HTTP 401, got: $HTTP_CODE"
  exit 1
fi
echo ""

###############################################################################
# Summary
###############################################################################

echo -e "${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                     Test Summary                              ║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ All 6 tests passed successfully!${NC}"
echo ""
echo -e "${BOLD}Test Results:${NC}"
echo -e "  1. ${GREEN}✓${NC} Platform admin login via unified endpoint"
echo -e "  2. ${GREEN}✓${NC} Tenant admin login via unified endpoint"
echo -e "  3. ${GREEN}✓${NC} Platform admin token verification"
echo -e "  4. ${GREEN}✓${NC} Tenant admin token verification"
echo -e "  5. ${GREEN}✓${NC} Invalid credentials handling (401)"
echo -e "  6. ${GREEN}✓${NC} Missing authorization header handling (401)"
echo ""
echo -e "${BOLD}Credentials Verified:${NC}"
echo -e "  Platform Admin: ${GREEN}admin@elope.com${NC}"
echo -e "  Tenant Admin:   ${GREEN}test-tenant@example.com${NC}"
echo ""
echo -e "${BOLD}Endpoints Tested:${NC}"
echo -e "  ${BLUE}POST${NC} /v1/auth/login   - Unified login"
echo -e "  ${BLUE}GET${NC}  /v1/auth/verify  - Token verification"
echo ""
echo -e "${YELLOW}Note:${NC} Legacy endpoints still available:"
echo -e "  • /v1/admin/login (platform admin)"
echo -e "  • /v1/tenant-auth/login (tenant admin)"
echo ""
