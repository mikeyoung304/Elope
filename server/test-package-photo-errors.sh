#!/bin/bash

# Package Photo Upload - Comprehensive Error Testing Script
# Tests all validation rules and error scenarios

API_BASE="http://localhost:3001"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6ImNtaHA5MWxjdDAwMDBwMGkzaGkzNDdnMHYiLCJzbHVnIjoidGVzdC10ZW5hbnQiLCJlbWFpbCI6InRlc3QtdGVuYW50QGV4YW1wbGUuY29tIiwidHlwZSI6InRlbmFudCIsImlhdCI6MTc2MjU0Mzc2NiwiZXhwIjoxNzYzMTQ4NTY2fQ.DlsXYNAyK0wuaJqkD9k8q0JWZm4DDFJzWFVo_elyWus"
PACKAGE_ID="pkg_1762547507209"
TEST_DIR="/tmp/package-photo-error-tests"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "========================================"
echo "Package Photo Upload - Error Testing"
echo "========================================"
echo ""

# Results file
RESULTS_FILE="$TEST_DIR/test_results.txt"
> "$RESULTS_FILE"

passed=0
failed=0
total=0

# Helper function to test HTTP request
test_request() {
    local test_name="$1"
    local expected_status="$2"
    shift 2
    local curl_args=("$@")

    echo "Testing: $test_name"
    total=$((total + 1))

    # Make request and capture response
    response_file=$(mktemp)
    http_code=$(curl -s -w "%{http_code}" -o "$response_file" "${curl_args[@]}" 2>&1)
    body=$(cat "$response_file")
    rm -f "$response_file"

    echo "  Expected Status: $expected_status"
    echo "  Actual Status: $http_code"
    echo "  Response: $body"

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        passed=$((passed + 1))
        echo "$test_name|PASSED|$http_code|$body" >> "$RESULTS_FILE"
    else
        echo -e "  ${RED}✗ FAILED${NC}"
        failed=$((failed + 1))
        echo "$test_name|FAILED|$http_code|$body" >> "$RESULTS_FILE"
    fi
    echo ""
}

echo "========================================"
echo "1. FILE SIZE VALIDATION TESTS"
echo "========================================"
echo ""

# Test 1a: Create 6MB file (exceeds 5MB limit)
echo "Creating 6MB test file..."
dd if=/dev/zero of="large-file.jpg" bs=1048576 count=6 2>/dev/null
FILE_SIZE=$(stat -f%z "large-file.jpg" 2>/dev/null || stat -c%s "large-file.jpg")
echo "File size: $FILE_SIZE bytes (6MB)"
echo ""

test_request "File Size: 6MB (should fail with 413)" "413" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@large-file.jpg"

# Test 1b: Create exactly 5MB file (should succeed)
echo "Creating 5MB test file..."
dd if=/dev/zero of="exactly-5mb.jpg" bs=1048576 count=5 2>/dev/null
FILE_SIZE=$(stat -f%z "exactly-5mb.jpg" 2>/dev/null || stat -c%s "exactly-5mb.jpg")
echo "File size: $FILE_SIZE bytes (5MB)"
echo ""

test_request "File Size: Exactly 5MB (should succeed)" "200" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@exactly-5mb.jpg"

# Test 1c: Create 5.5MB file
echo "Creating 5.5MB test file..."
dd if=/dev/zero of="over-5mb.jpg" bs=1048576 count=5 2>/dev/null
dd if=/dev/zero of="over-5mb.jpg" bs=1024 count=512 conv=notrunc oflag=append 2>/dev/null
FILE_SIZE=$(stat -f%z "over-5mb.jpg" 2>/dev/null || stat -c%s "over-5mb.jpg")
echo "File size: $FILE_SIZE bytes (5.5MB)"
echo ""

test_request "File Size: 5.5MB (should fail with 413)" "413" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@over-5mb.jpg"

echo "========================================"
echo "2. FILE TYPE VALIDATION TESTS"
echo "========================================"
echo ""

# Test 2a: Text file
echo "This is a text file, not an image" > "test-file.txt"
test_request "File Type: .txt (should fail with 400)" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@test-file.txt"

# Test 2b: PDF file
echo "%PDF-1.4 fake pdf content" > "test-file.pdf"
test_request "File Type: .pdf (should fail with 400)" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@test-file.pdf"

# Test 2c: EXE file
echo "MZ fake exe content" > "test-file.exe"
test_request "File Type: .exe (should fail with 400)" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@test-file.exe"

# Test 2d: .js file
echo "console.log('test');" > "test-file.js"
test_request "File Type: .js (should fail with 400)" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@test-file.js"

echo "========================================"
echo "3. MISSING FILE TESTS"
echo "========================================"
echo ""

# Test 3a: No file field at all
test_request "Missing File: No file field" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN"

# Test 3b: Wrong field name
echo "test" > "test.jpg"
test_request "Missing File: Wrong field name (image instead of photo)" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "image=@test.jpg"

# Test 3c: Empty file
touch "empty.jpg"
test_request "Missing File: Empty file" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@empty.jpg"

echo "========================================"
echo "4. PHOTO LIMIT TEST (Max 5)"
echo "========================================"
echo ""

# First, check current photos and clean up
echo "Checking current photos for package..."
pkg_response=$(curl -s \
    -X GET \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN")

echo "Package response: $pkg_response"
echo ""

# Create a valid small test image (minimal JPEG header)
echo "Creating small valid test images..."
printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9' > photo1.jpg
cp photo1.jpg photo2.jpg
cp photo1.jpg photo3.jpg
cp photo1.jpg photo4.jpg
cp photo1.jpg photo5.jpg
cp photo1.jpg photo6.jpg
echo ""

# First, delete any existing photos to start fresh
echo "Cleaning up existing photos..."
existing_photos=$(echo "$pkg_response" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4 || echo "")
if [ ! -z "$existing_photos" ]; then
    echo "Found existing photos, deleting them..."
    for photo in $existing_photos; do
        echo "  Deleting: $photo"
        curl -s -X DELETE \
            "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos/$photo" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
    done
fi
echo ""

# Upload 5 photos
echo "Uploading 5 photos to reach the limit..."
for i in {1..5}; do
    echo "Uploading photo $i..."
    result=$(curl -s -X POST \
        "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -F "photo=@photo$i.jpg")
    echo "  Result: $result"
    sleep 1
done
echo ""

# Try to upload 6th photo
test_request "Photo Limit: 6th photo (should fail with 400)" "400" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@photo6.jpg"

echo "========================================"
echo "5. NON-EXISTENT PACKAGE TEST"
echo "========================================"
echo ""

test_request "Non-existent Package (should fail with 404)" "404" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/pkg_nonexistent_12345/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@photo1.jpg"

echo "========================================"
echo "6. NON-EXISTENT PHOTO DELETION TEST"
echo "========================================"
echo ""

test_request "Delete Non-existent Photo (should fail with 404)" "404" \
    -X DELETE \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos/nonexistent-photo-12345.jpg" \
    -H "Authorization: Bearer $AUTH_TOKEN"

echo "========================================"
echo "7. CROSS-TENANT ACCESS TEST"
echo "========================================"
echo ""

# Try with invalid token
test_request "Cross-Tenant: Invalid Token (should fail with 401)" "401" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer invalid_token_12345" \
    -F "photo=@photo1.jpg"

# Try without token
test_request "Cross-Tenant: No Token (should fail with 401)" "401" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -F "photo=@photo1.jpg"

echo "========================================"
echo "8. EDGE CASES"
echo "========================================"
echo ""

# Get second package for edge case testing
SECOND_PACKAGE="pkg_1762547976547"

# Clean up second package
echo "Cleaning up second package for edge case tests..."
pkg2_response=$(curl -s \
    -X GET \
    "$API_BASE/v1/tenant/admin/packages/$SECOND_PACKAGE" \
    -H "Authorization: Bearer $AUTH_TOKEN")
existing_photos2=$(echo "$pkg2_response" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4 || echo "")
if [ ! -z "$existing_photos2" ]; then
    for photo in $existing_photos2; do
        curl -s -X DELETE \
            "$API_BASE/v1/tenant/admin/packages/$SECOND_PACKAGE/photos/$photo" \
            -H "Authorization: Bearer $AUTH_TOKEN" > /dev/null
    done
fi
echo ""

# Test 8a: Special characters in filename
cp photo1.jpg "test photo #1 & more.jpg"
test_request "Edge Case: Special characters in filename" "200" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$SECOND_PACKAGE/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@test photo #1 & more.jpg"

# Test 8b: Very long filename
long_name=$(printf 'a%.0s' {1..200}).jpg
cp photo1.jpg "$long_name"
test_request "Edge Case: Very long filename (200 chars)" "200" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$SECOND_PACKAGE/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$long_name"

# Test 8c: Delete with empty filename
test_request "Edge Case: Delete with empty filename (404)" "404" \
    -X DELETE \
    "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos/" \
    -H "Authorization: Bearer $AUTH_TOKEN"

# Test 8d: Multiple dots in filename
cp photo1.jpg "test.image.file.name.jpg"
test_request "Edge Case: Multiple dots in filename" "200" \
    -X POST \
    "$API_BASE/v1/tenant/admin/packages/$SECOND_PACKAGE/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@test.image.file.name.jpg"

echo "========================================"
echo "SUMMARY OF RESULTS"
echo "========================================"
echo ""

echo "Total Tests: $total"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo ""

if [ $failed -gt 0 ]; then
    echo -e "${RED}FAILED TESTS:${NC}"
    grep "|FAILED|" "$RESULTS_FILE" | while IFS='|' read -r name status code response; do
        echo "  - $name (Expected vs Actual: $code)"
        echo "    Response: $response"
    done
    echo ""
fi

echo "Detailed results saved to: $RESULTS_FILE"
echo ""

echo "Testing complete!"
echo ""
echo "Test directory: $TEST_DIR"
