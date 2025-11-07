#!/bin/bash
# Manual test script for login rate limiting
# This script attempts multiple failed login attempts to verify rate limiting works

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TENANT_LOGIN_URL="$API_URL/v1/tenant-auth/login"
ADMIN_LOGIN_URL="$API_URL/v1/admin/login"

echo "=== Login Rate Limiting Test ==="
echo "Testing against: $API_URL"
echo ""

# Test Tenant Login Rate Limiting
echo "1. Testing Tenant Login Rate Limiting"
echo "   Attempting 6 failed login attempts (limit is 5)..."
for i in {1..6}; do
  echo -n "   Attempt $i: "
  response=$(curl -s -w "\n%{http_code}" -X POST "$TENANT_LOGIN_URL" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}')

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" = "429" ]; then
    echo "RATE LIMITED (HTTP 429) ✓"
    echo "   Response: $body"
  else
    echo "HTTP $status_code"
    echo "   Response: $body"
  fi
done

echo ""
echo "2. Testing Admin Login Rate Limiting"
echo "   Attempting 6 failed login attempts (limit is 5)..."
for i in {1..6}; do
  echo -n "   Attempt $i: "
  response=$(curl -s -w "\n%{http_code}" -X POST "$ADMIN_LOGIN_URL" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"wrongpassword"}')

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" = "429" ]; then
    echo "RATE LIMITED (HTTP 429) ✓"
    echo "   Response: $body"
  else
    echo "HTTP $status_code"
    echo "   Response: $body"
  fi
done

echo ""
echo "=== Test Complete ==="
echo ""
echo "Expected behavior:"
echo "- Attempts 1-5: Should return 401 Unauthorized (authentication error)"
echo "- Attempt 6+: Should return 429 Too Many Requests (rate limit exceeded)"
echo ""
echo "Check server logs for failed login attempt warnings with IP addresses"
