#!/bin/bash

# Error Case & Validation Test Script for Package Photo Upload
# Tests authentication, validation, authorization, and edge cases

API_BASE="http://localhost:3001"
TEMP_DIR="/tmp/elope-test-photos"
mkdir -p "$TEMP_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Arrays for issues
declare -a SECURITY_ISSUES
declare -a VALIDATION_GAPS
declare -a TEST_RESULTS

# Helper function to create test images
create_test_image() {
    local size=$1
    local filename=$2
    dd if=/dev/urandom of="$filename" bs=1 count=$size 2>/dev/null
    # Add PNG header to make it a valid image
    printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a' | cat - "$filename" > "$filename.tmp"
    mv "$filename.tmp" "$filename"
}

# Helper function to create text file
create_text_file() {
    local filename=$1
    echo "This is a text file, not an image" > "$filename"
}

# Helper function to record test result
record_test() {
    local test_name="$1"
    local expected=$2
    local actual=$3
    local details="$4"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$expected" -eq "$actual" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        echo "   Expected: $expected, Got: $actual - $details"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("PASS: $test_name ($expected = $actual)")
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo "   Expected: $expected, Got: $actual - $details"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("FAIL: $test_name (expected $expected, got $actual)")
    fi
    echo ""
}

echo "🚀 Starting Error Case & Validation Tests"
echo "============================================================"
echo ""

# Setup: Create test tenants and get tokens
echo "🔧 Setting up test environment..."
echo ""

# Register tenant 1
TENANT1_REGISTER=$(curl -s -X POST "$API_BASE/v1/auth/tenant/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-error-1-'$RANDOM'@example.com","password":"StrongPass123!","businessName":"Test Tenant 1"}')

if echo "$TENANT1_REGISTER" | grep -q "accessToken"; then
    TOKEN1=$(echo "$TENANT1_REGISTER" | jq -r '.accessToken')
    TENANT1_ID=$(echo "$TENANT1_REGISTER" | jq -r '.tenantId')
    echo "✅ Tenant 1 created: $TENANT1_ID"
else
    echo "❌ Failed to create tenant 1"
    echo "$TENANT1_REGISTER"
    exit 1
fi

# Register tenant 2
TENANT2_REGISTER=$(curl -s -X POST "$API_BASE/v1/auth/tenant/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-error-2-'$RANDOM'@example.com","password":"StrongPass123!","businessName":"Test Tenant 2"}')

if echo "$TENANT2_REGISTER" | grep -q "accessToken"; then
    TOKEN2=$(echo "$TENANT2_REGISTER" | jq -r '.accessToken')
    TENANT2_ID=$(echo "$TENANT2_REGISTER" | jq -r '.tenantId')
    echo "✅ Tenant 2 created: $TENANT2_ID"
else
    echo "❌ Failed to create tenant 2"
    exit 1
fi

# Create packages for both tenants
PACKAGE1=$(curl -s -X POST "$API_BASE/v1/tenant-admin/packages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{"slug":"test-pkg-'$RANDOM'","title":"Test Package 1","description":"For testing","priceCents":50000}')

PACKAGE1_ID=$(echo "$PACKAGE1" | jq -r '.id')
echo "✅ Package 1 created: $PACKAGE1_ID"

PACKAGE2=$(curl -s -X POST "$API_BASE/v1/tenant-admin/packages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{"slug":"test-pkg-'$RANDOM'","title":"Test Package 2","description":"For testing","priceCents":60000}')

PACKAGE2_ID=$(echo "$PACKAGE2" | jq -r '.id')
echo "✅ Package 2 created: $PACKAGE2_ID"

echo ""
echo "============================================================"
echo "📋 Running tests..."
echo "============================================================"
echo ""

# Test 1: Upload without auth token
echo "🔐 Test 1: Upload without auth token"
create_test_image 1024 "$TEMP_DIR/test1.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -F "photo=@$TEMP_DIR/test1.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "Upload without auth token" 401 "$HTTP_CODE" "Should reject unauthorized request"
if [ "$HTTP_CODE" -ne 401 ]; then
    SECURITY_ISSUES+=("Photo upload allowed without authentication")
fi

# Test 2: Upload with invalid token
echo "🔐 Test 2: Upload with invalid token"
create_test_image 1024 "$TEMP_DIR/test2.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer invalid_token_12345" \
  -F "photo=@$TEMP_DIR/test2.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "Upload with invalid token" 401 "$HTTP_CODE" "Should reject invalid token"
if [ "$HTTP_CODE" -ne 401 ]; then
    SECURITY_ISSUES+=("Photo upload allowed with invalid token")
fi

# Test 3: Upload without file
echo "✅ Test 3: Upload without file"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer $TOKEN1")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
record_test "Upload without file" 400 "$HTTP_CODE" "Should reject missing file"
if [ "$HTTP_CODE" -ne 400 ]; then
    VALIDATION_GAPS+=("Missing file validation not enforced")
fi

# Test 4: Upload file too large (>5MB)
echo "✅ Test 4: Upload file >5MB"
create_test_image $((6 * 1024 * 1024)) "$TEMP_DIR/test4.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/test4.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Accept either 413 (payload too large) or 400 (validation error)
if [ "$HTTP_CODE" -eq 413 ] || [ "$HTTP_CODE" -eq 400 ]; then
    record_test "Upload file >5MB" 413 "$HTTP_CODE" "Correctly rejected oversized file (413 or 400 acceptable)"
    TESTS_PASSED=$((TESTS_PASSED))  # Already counted
else
    record_test "Upload file >5MB" 413 "$HTTP_CODE" "Should reject oversized file"
    VALIDATION_GAPS+=("File size limit (5MB) not enforced")
fi

# Test 5: Upload invalid file type
echo "✅ Test 5: Upload non-image file"
create_text_file "$TEMP_DIR/test5.txt"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/test5.txt")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "Upload non-image file" 400 "$HTTP_CODE" "Should reject non-image file"
if [ "$HTTP_CODE" -ne 400 ]; then
    VALIDATION_GAPS+=("File type validation not enforced")
fi

# Test 6: Upload to non-existent package
echo "✅ Test 6: Upload to non-existent package"
create_test_image 1024 "$TEMP_DIR/test6.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/non-existent-id/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/test6.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "Upload to non-existent package" 404 "$HTTP_CODE" "Should return 404 for missing package"

# Test 7: Upload 6th photo (exceeds max 5)
echo "💼 Test 7: Upload 6th photo (exceeds max)"
# First upload 5 photos
for i in {1..5}; do
    create_test_image 1024 "$TEMP_DIR/max${i}.png"
    curl -s -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
      -H "Authorization: Bearer $TOKEN1" \
      -F "photo=@$TEMP_DIR/max${i}.png" > /dev/null
done
# Try to upload 6th
create_test_image 1024 "$TEMP_DIR/max6.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/max6.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)
record_test "Upload 6th photo (exceeds max)" 400 "$HTTP_CODE" "Should enforce 5 photo limit"
if [ "$HTTP_CODE" -ne 400 ]; then
    VALIDATION_GAPS+=("Maximum 5 photos limit not enforced")
fi

# Test 8: Delete non-existent photo
echo "💼 Test 8: Delete non-existent photo"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos/non-existent.png" \
  -H "Authorization: Bearer $TOKEN1")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "Delete non-existent photo" 404 "$HTTP_CODE" "Should return 404 for missing photo"

# Test 9: Upload to another tenant's package
echo "🔒 Test 9: Upload to another tenant's package"
create_test_image 1024 "$TEMP_DIR/test9.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE2_ID/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/test9.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Accept either 403 (forbidden) or 404 (not found)
if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
    record_test "Upload to another tenant's package" 403 "$HTTP_CODE" "Correctly prevented cross-tenant upload (403 or 404)"
    TESTS_PASSED=$((TESTS_PASSED))  # Already counted
else
    record_test "Upload to another tenant's package" 403 "$HTTP_CODE" "Should prevent cross-tenant upload"
    SECURITY_ISSUES+=("Cross-tenant photo upload not prevented")
fi

# Test 10: Delete another tenant's photo
echo "🔒 Test 10: Delete another tenant's photo"
# First upload a photo as tenant 2
create_test_image 1024 "$TEMP_DIR/test10.png"
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE2_ID/photos" \
  -H "Authorization: Bearer $TOKEN2" \
  -F "photo=@$TEMP_DIR/test10.png")
FILENAME=$(echo "$UPLOAD_RESPONSE" | jq -r '.filename')

# Tenant 1 tries to delete it
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/v1/tenant-admin/packages/$PACKAGE2_ID/photos/$FILENAME" \
  -H "Authorization: Bearer $TOKEN1")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Accept either 403 or 404
if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
    record_test "Delete another tenant's photo" 403 "$HTTP_CODE" "Correctly prevented cross-tenant deletion (403 or 404)"
    TESTS_PASSED=$((TESTS_PASSED))  # Already counted
else
    record_test "Delete another tenant's photo" 403 "$HTTP_CODE" "Should prevent cross-tenant deletion"
    SECURITY_ISSUES+=("Cross-tenant photo deletion not prevented")
fi

# Test 11: Upload with special characters in filename
echo "🎯 Test 11: Upload with special characters in filename"
create_test_image 1024 "$TEMP_DIR/test file (1) [copy].png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/test file (1) [copy].png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# This should succeed (201) as it's not an error case
if [ "$HTTP_CODE" -eq 201 ]; then
    record_test "Upload with special chars in filename" 201 "$HTTP_CODE" "Correctly handled special characters"
else
    record_test "Upload with special chars in filename" 201 "$HTTP_CODE" "Failed to handle special characters"
fi

# Test 12: Upload very small image
echo "🎯 Test 12: Upload 1-byte file"
echo -n "x" > "$TEMP_DIR/test12.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/test12.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# This might be accepted or rejected depending on implementation
# Accept 400 (rejected) or 201 (accepted) as both are reasonable
echo "   Note: 1-byte file test - implementation dependent"
if [ "$HTTP_CODE" -eq 400 ]; then
    record_test "Upload 1-byte file" 400 "$HTTP_CODE" "Correctly rejected tiny file"
else
    record_test "Upload 1-byte file" 201 "$HTTP_CODE" "Accepted tiny file (may want min size validation)"
fi

# Test 13: Delete same photo twice
echo "🎯 Test 13: Delete same photo twice"
# Upload a photo
create_test_image 1024 "$TEMP_DIR/test13.png"
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos" \
  -H "Authorization: Bearer $TOKEN1" \
  -F "photo=@$TEMP_DIR/test13.png")
FILENAME=$(echo "$UPLOAD_RESPONSE" | jq -r '.filename')

# Delete once
curl -s -X DELETE "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos/$FILENAME" \
  -H "Authorization: Bearer $TOKEN1" > /dev/null

# Delete again
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/v1/tenant-admin/packages/$PACKAGE1_ID/photos/$FILENAME" \
  -H "Authorization: Bearer $TOKEN1")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "Delete same photo twice" 404 "$HTTP_CODE" "Should return 404 on second delete"

# Cleanup
rm -rf "$TEMP_DIR"

# Generate Report
echo "============================================================"
echo "📊 TEST REPORT"
echo "============================================================"
echo "Tests Run: $TESTS_RUN"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED ✅${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED ❌${NC}"
echo "Summary: $TESTS_PASSED/$TESTS_RUN error cases handled correctly"
echo ""

if [ ${#SECURITY_ISSUES[@]} -gt 0 ]; then
    echo -e "${RED}🚨 SECURITY ISSUES:${NC}"
    for issue in "${SECURITY_ISSUES[@]}"; do
        echo "   - $issue"
    done
    echo ""
fi

if [ ${#VALIDATION_GAPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  VALIDATION GAPS:${NC}"
    for gap in "${VALIDATION_GAPS[@]}"; do
        echo "   - $gap"
    done
    echo ""
fi

# Generate JSON report
cat > test-error-report.json <<EOF
{
  "testsRun": $TESTS_RUN,
  "testsPassed": $TESTS_PASSED,
  "testsFailed": $TESTS_FAILED,
  "results": [
EOF

for i in "${!TEST_RESULTS[@]}"; do
    RESULT="${TEST_RESULTS[$i]}"
    echo "    \"$RESULT\"" >> test-error-report.json
    if [ $i -lt $((${#TEST_RESULTS[@]} - 1)) ]; then
        echo "," >> test-error-report.json
    fi
done

cat >> test-error-report.json <<EOF
  ],
  "securityIssues": [
EOF

for i in "${!SECURITY_ISSUES[@]}"; do
    echo "    \"${SECURITY_ISSUES[$i]}\"" >> test-error-report.json
    if [ $i -lt $((${#SECURITY_ISSUES[@]} - 1)) ]; then
        echo "," >> test-error-report.json
    fi
done

cat >> test-error-report.json <<EOF
  ],
  "validationGaps": [
EOF

for i in "${!VALIDATION_GAPS[@]}"; do
    echo "    \"${VALIDATION_GAPS[$i]}\"" >> test-error-report.json
    if [ $i -lt $((${#VALIDATION_GAPS[@]} - 1)) ]; then
        echo "," >> test-error-report.json
    fi
done

cat >> test-error-report.json <<EOF
  ],
  "summary": "$TESTS_PASSED/$TESTS_RUN error cases handled correctly"
}
EOF

echo "📄 JSON report saved to: test-error-report.json"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
fi
