#!/bin/bash

# Simplified API Test

set -e

echo "🧪 Testing Multi-Tenant API Authentication"
echo ""

# API Base URL
BASE_URL="http://localhost:3001"

# Hardcode tenant keys (we know them from earlier)
TENANT_A_KEY="pk_live_tenant-a_fd84a41bd3509bf5"
TENANT_B_KEY="pk_live_tenant-b_87a50de619ebdcb0"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Valid API key (Tenant A)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -H "X-Tenant-Key: $TENANT_A_KEY" "$BASE_URL/v1/packages" -o /dev/null -w "%{http_code}")
if [ "$RESPONSE" = "200" ]; then
  echo "✅ PASS: HTTP $RESPONSE"
  PACKAGES=$(curl -s -H "X-Tenant-Key: $TENANT_A_KEY" "$BASE_URL/v1/packages")
  echo "   Packages: $(echo "$PACKAGES" | jq -r '.[].name' | tr '\n' ', ')"
else
  echo "❌ FAIL: HTTP $RESPONSE"
  curl -s -H "X-Tenant-Key: $TENANT_A_KEY" "$BASE_URL/v1/packages"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Valid API key (Tenant B)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -H "X-Tenant-Key: $TENANT_B_KEY" "$BASE_URL/v1/packages" -o /dev/null -w "%{http_code}")
if [ "$RESPONSE" = "200" ]; then
  echo "✅ PASS: HTTP $RESPONSE"
  PACKAGES=$(curl -s -H "X-Tenant-Key: $TENANT_B_KEY" "$BASE_URL/v1/packages")
  echo "   Packages: $(echo "$PACKAGES" | jq -r '.[].name' | tr '\n' ', ')"
else
  echo "❌ FAIL: HTTP $RESPONSE"
  curl -s -H "X-Tenant-Key: $TENANT_B_KEY" "$BASE_URL/v1/packages"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Missing X-Tenant-Key header"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s "$BASE_URL/v1/packages" -o /dev/null -w "%{http_code}")
if [ "$RESPONSE" = "401" ]; then
  echo "✅ PASS: HTTP $RESPONSE (correctly rejected)"
  ERROR=$(curl -s "$BASE_URL/v1/packages")
  echo "   Error: $(echo "$ERROR" | jq -r '.error')"
  echo "   Code: $(echo "$ERROR" | jq -r '.code')"
else
  echo "❌ FAIL: Expected 401, got $RESPONSE"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Invalid API key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -H "X-Tenant-Key: pk_live_invalid_12345678" "$BASE_URL/v1/packages" -o /dev/null -w "%{http_code}")
if [ "$RESPONSE" = "401" ]; then
  echo "✅ PASS: HTTP $RESPONSE (correctly rejected)"
  ERROR=$(curl -s -H "X-Tenant-Key: pk_live_invalid_12345678" "$BASE_URL/v1/packages")
  echo "   Error: $(echo "$ERROR" | jq -r '.error')"
  echo "   Code: $(echo "$ERROR" | jq -r '.code')"
else
  echo "❌ FAIL: Expected 401, got $RESPONSE"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Tenant data isolation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get packages for both tenants
PACKAGES_A=$(curl -s -H "X-Tenant-Key: $TENANT_A_KEY" "$BASE_URL/v1/packages")
PACKAGES_B=$(curl -s -H "X-Tenant-Key: $TENANT_B_KEY" "$BASE_URL/v1/packages")

# Check Tenant A sees Test Package A
if echo "$PACKAGES_A" | jq -r '.[].name' | grep -q "Test Package A"; then
  echo "✅ PASS: Tenant A sees 'Test Package A'"
else
  echo "❌ FAIL: Tenant A should see 'Test Package A'"
  exit 1
fi

# Check Tenant A does NOT see Test Package B
if ! echo "$PACKAGES_A" | jq -r '.[].name' | grep -q "Test Package B"; then
  echo "✅ PASS: Tenant A does NOT see 'Test Package B' (isolation working)"
else
  echo "❌ FAIL: Tenant A sees 'Test Package B' (data leakage!)"
  exit 1
fi

# Check Tenant B sees Test Package B
if echo "$PACKAGES_B" | jq -r '.[].name' | grep -q "Test Package B"; then
  echo "✅ PASS: Tenant B sees 'Test Package B'"
else
  echo "❌ FAIL: Tenant B should see 'Test Package B'"
  exit 1
fi

# Check Tenant B does NOT see Test Package A
if ! echo "$PACKAGES_B" | jq -r '.[].name' | grep -q "Test Package A"; then
  echo "✅ PASS: Tenant B does NOT see 'Test Package A' (isolation working)"
else
  echo "❌ FAIL: Tenant B sees 'Test Package A' (data leakage!)"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL API AUTHENTICATION TESTS PASSED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
