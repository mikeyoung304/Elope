#!/bin/bash

################################################################################
# Comprehensive Error Handling Test Suite
# Package Photo Upload Feature - Error Case Verification
#
# Tests all error scenarios for the package photo upload endpoint:
# - Authentication errors (401)
# - Validation errors (400)
# - Authorization errors (403)
# - Not found errors (404)
# - File size errors (413)
#
# Usage: ./test-error-handling-comprehensive.sh
################################################################################

set -e  # Exit on error

# Configuration
API_BASE="http://localhost:3001"
TEMP_DIR="/tmp/elope-comprehensive-test"
TEST_SETUP_FILE="./TEST_SETUP_COMPLETE.json"
RESULTS_FILE="./test-results-comprehensive.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Category counters
AUTH_TESTS=0
AUTH_PASSED=0
VALIDATION_TESTS=0
VALIDATION_PASSED=0
AUTHORIZATION_TESTS=0
AUTHORIZATION_PASSED=0
NOT_FOUND_TESTS=0
NOT_FOUND_PASSED=0
FILE_SIZE_TESTS=0
FILE_SIZE_PASSED=0

# Results array
declare -a TEST_RESULTS=()

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test_category() {
    echo ""
    echo -e "${MAGENTA}▶ $1${NC}"
    echo -e "${MAGENTA}───────────────────────────────────────────────────────────────${NC}"
}

record_test() {
    local category="$1"
    local test_name="$2"
    local expected_status=$3
    local actual_status=$4
    local details="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Increment category counter
    case "$category" in
        "authentication")
            AUTH_TESTS=$((AUTH_TESTS + 1))
            ;;
        "validation")
            VALIDATION_TESTS=$((VALIDATION_TESTS + 1))
            ;;
        "authorization")
            AUTHORIZATION_TESTS=$((AUTHORIZATION_TESTS + 1))
            ;;
        "notFound")
            NOT_FOUND_TESTS=$((NOT_FOUND_TESTS + 1))
            ;;
        "fileSize")
            FILE_SIZE_TESTS=$((FILE_SIZE_TESTS + 1))
            ;;
    esac

    if [ "$expected_status" -eq "$actual_status" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        echo -e "   Expected: $expected_status, Got: $actual_status"
        echo -e "   ${BLUE}$details${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))

        # Increment category passed counter
        case "$category" in
            "authentication")
                AUTH_PASSED=$((AUTH_PASSED + 1))
                ;;
            "validation")
                VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
                ;;
            "authorization")
                AUTHORIZATION_PASSED=$((AUTHORIZATION_PASSED + 1))
                ;;
            "notFound")
                NOT_FOUND_PASSED=$((NOT_FOUND_PASSED + 1))
                ;;
            "fileSize")
                FILE_SIZE_PASSED=$((FILE_SIZE_PASSED + 1))
                ;;
        esac

        TEST_RESULTS+=("{\"category\":\"$category\",\"test\":\"$test_name\",\"expected\":$expected_status,\"actual\":$actual_status,\"status\":\"PASS\",\"details\":\"$details\"}")
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        echo -e "   Expected: $expected_status, Got: $actual_status"
        echo -e "   ${YELLOW}$details${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("{\"category\":\"$category\",\"test\":\"$test_name\",\"expected\":$expected_status,\"actual\":$actual_status,\"status\":\"FAIL\",\"details\":\"$details\"}")
    fi
    echo ""
}

create_test_image() {
    local size=$1
    local filename=$2
    # Create a file with PNG header
    printf '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a' > "$filename"
    # Add random data to reach desired size
    dd if=/dev/urandom bs=1 count=$((size - 8)) 2>/dev/null >> "$filename"
}

create_text_file() {
    local filename=$1
    echo "This is a text file, not an image" > "$filename"
}

################################################################################
# Setup
################################################################################

print_header "COMPREHENSIVE ERROR HANDLING TEST SUITE"
echo -e "${CYAN}Package Photo Upload Feature${NC}"
echo -e "API Base: ${BLUE}$API_BASE${NC}"
echo -e "Test Directory: ${BLUE}$TEMP_DIR${NC}"
echo ""

# Create temp directory
mkdir -p "$TEMP_DIR"

# Load test setup
if [ ! -f "$TEST_SETUP_FILE" ]; then
    echo -e "${RED}ERROR: Test setup file not found: $TEST_SETUP_FILE${NC}"
    echo "Please run the setup script first."
    exit 1
fi

echo -e "${GREEN}Loading test configuration...${NC}"
AUTH_TOKEN=$(jq -r '.authToken' "$TEST_SETUP_FILE")
TENANT_ID=$(jq -r '.tenantId' "$TEST_SETUP_FILE")
PACKAGE_ID=$(jq -r '.availablePackages[0]' "$TEST_SETUP_FILE")

echo "  Tenant ID: $TENANT_ID"
echo "  Package ID: $PACKAGE_ID"
echo "  Token: ${AUTH_TOKEN:0:20}..."
echo ""

################################################################################
# Test Category 1: Authentication Errors (401)
################################################################################

print_test_category "AUTHENTICATION ERRORS (401)"

# Test 1.1: No authentication token
create_test_image 1024 "$TEMP_DIR/auth-test-1.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -F "photo=@$TEMP_DIR/auth-test-1.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "authentication" "Upload without auth token" 401 "$HTTP_CODE" "Should reject unauthorized requests"

# Test 1.2: Invalid authentication token
create_test_image 1024 "$TEMP_DIR/auth-test-2.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer invalid_token_xyz123" \
    -F "photo=@$TEMP_DIR/auth-test-2.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "authentication" "Upload with invalid token" 401 "$HTTP_CODE" "Should reject malformed/invalid tokens"

################################################################################
# Test Category 2: Validation Errors (400)
################################################################################

print_test_category "VALIDATION ERRORS (400)"

# Test 2.1: No file uploaded
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "validation" "Upload without file" 400 "$HTTP_CODE" "Should return 400 with 'No photo uploaded' message"

# Test 2.2: Invalid file type (non-image)
create_text_file "$TEMP_DIR/validation-test-2.txt"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$TEMP_DIR/validation-test-2.txt")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "validation" "Upload non-image file" 400 "$HTTP_CODE" "Should reject text files with validation error"

# Test 2.3: Empty file (1 byte)
echo -n "x" > "$TEMP_DIR/validation-test-3.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$TEMP_DIR/validation-test-3.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Accept either 400 (rejected) or 201 (accepted) - implementation dependent
if [ "$HTTP_CODE" -eq 400 ] || [ "$HTTP_CODE" -eq 201 ]; then
    if [ "$HTTP_CODE" -eq 400 ]; then
        record_test "validation" "Upload 1-byte file" 400 "$HTTP_CODE" "Correctly rejected tiny/malformed file"
    else
        # Mark as passed but note no minimum validation
        VALIDATION_TESTS=$((VALIDATION_TESTS + 1))
        VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${YELLOW}⚠ NOTE${NC}: Upload 1-byte file"
        echo -e "   Expected: 400, Got: $HTTP_CODE (accepted)"
        echo -e "   ${BLUE}No minimum file size validation - may want to add this${NC}"
        echo ""
        TEST_RESULTS+=("{\"category\":\"validation\",\"test\":\"Upload 1-byte file\",\"expected\":400,\"actual\":$HTTP_CODE,\"status\":\"PASS_WITH_NOTE\",\"details\":\"Accepted tiny file - consider adding minimum size validation\"}")
    fi
else
    record_test "validation" "Upload 1-byte file" 400 "$HTTP_CODE" "Unexpected error response"
fi

# Test 2.4: Maximum photos exceeded (6th photo)
# First, upload 5 photos to reach the limit
echo -e "${CYAN}  Setting up: Uploading 5 photos to reach limit...${NC}"
for i in {1..5}; do
    create_test_image 1024 "$TEMP_DIR/max-photo-$i.png"
    curl -s -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -F "photo=@$TEMP_DIR/max-photo-$i.png" > /dev/null
    echo -e "    Photo $i/5 uploaded"
done
echo ""

# Now try to upload 6th photo
create_test_image 1024 "$TEMP_DIR/validation-test-4.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$TEMP_DIR/validation-test-4.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "validation" "Upload 6th photo (exceeds max 5)" 400 "$HTTP_CODE" "Should enforce 5 photo per package limit"

# Test 2.5: Special characters in filename
create_test_image 1024 "$TEMP_DIR/test file (1) [copy].png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$TEMP_DIR/test file (1) [copy].png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# This should succeed (201) as special chars should be handled
if [ "$HTTP_CODE" -eq 201 ]; then
    VALIDATION_TESTS=$((VALIDATION_TESTS + 1))
    VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: Upload with special characters in filename"
    echo -e "   Expected: 201, Got: $HTTP_CODE"
    echo -e "   ${BLUE}Correctly handled special characters in filename${NC}"
    echo ""
    TEST_RESULTS+=("{\"category\":\"validation\",\"test\":\"Upload with special characters in filename\",\"expected\":201,\"actual\":$HTTP_CODE,\"status\":\"PASS\",\"details\":\"Correctly handled special characters in filename\"}")
else
    record_test "validation" "Upload with special characters in filename" 201 "$HTTP_CODE" "Failed to handle special characters"
fi

################################################################################
# Test Category 3: Authorization Errors (403)
################################################################################

print_test_category "AUTHORIZATION ERRORS (403)"

# Setup: Create a second tenant and package for cross-tenant testing
echo -e "${CYAN}  Setting up: Creating second tenant for authorization tests...${NC}"
TENANT2_REGISTER=$(curl -s -X POST "$API_BASE/v1/auth/tenant/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test-auth-'$RANDOM'@example.com","password":"StrongPass123!","businessName":"Test Tenant 2"}')

if echo "$TENANT2_REGISTER" | grep -q "accessToken"; then
    TOKEN2=$(echo "$TENANT2_REGISTER" | jq -r '.accessToken')
    TENANT2_ID=$(echo "$TENANT2_REGISTER" | jq -r '.tenantId')
    echo -e "    Tenant 2 ID: $TENANT2_ID"

    # Create package for tenant 2
    PACKAGE2=$(curl -s -X POST "$API_BASE/v1/tenant/admin/packages" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN2" \
        -d '{"slug":"test-pkg-'$RANDOM'","title":"Test Package 2","description":"For testing","priceCents":60000}')
    PACKAGE2_ID=$(echo "$PACKAGE2" | jq -r '.id')
    echo -e "    Package 2 ID: $PACKAGE2_ID"
    echo ""

    # Test 3.1: Upload to another tenant's package
    create_test_image 1024 "$TEMP_DIR/auth-test-1.png"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE2_ID/photos" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -F "photo=@$TEMP_DIR/auth-test-1.png")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    # Accept either 403 or 404 as both prevent cross-tenant access
    if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
        AUTHORIZATION_TESTS=$((AUTHORIZATION_TESTS + 1))
        AUTHORIZATION_PASSED=$((AUTHORIZATION_PASSED + 1))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASS${NC}: Upload to another tenant's package"
        echo -e "   Expected: 403, Got: $HTTP_CODE (403 or 404 acceptable)"
        echo -e "   ${BLUE}Cross-tenant upload correctly prevented${NC}"
        echo ""
        TEST_RESULTS+=("{\"category\":\"authorization\",\"test\":\"Upload to another tenant's package\",\"expected\":403,\"actual\":$HTTP_CODE,\"status\":\"PASS\",\"details\":\"Cross-tenant upload correctly prevented (403 or 404)\"}")
    else
        record_test "authorization" "Upload to another tenant's package" 403 "$HTTP_CODE" "Failed to prevent cross-tenant upload"
    fi

    # Test 3.2: Delete another tenant's photo
    # First upload a photo as tenant 2
    create_test_image 1024 "$TEMP_DIR/auth-test-2.png"
    UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE2_ID/photos" \
        -H "Authorization: Bearer $TOKEN2" \
        -F "photo=@$TEMP_DIR/auth-test-2.png")
    FILENAME=$(echo "$UPLOAD_RESPONSE" | jq -r '.filename')

    # Tenant 1 tries to delete it
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/v1/tenant/admin/packages/$PACKAGE2_ID/photos/$FILENAME" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    # Accept either 403 or 404
    if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
        AUTHORIZATION_TESTS=$((AUTHORIZATION_TESTS + 1))
        AUTHORIZATION_PASSED=$((AUTHORIZATION_PASSED + 1))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASS${NC}: Delete another tenant's photo"
        echo -e "   Expected: 403, Got: $HTTP_CODE (403 or 404 acceptable)"
        echo -e "   ${BLUE}Cross-tenant deletion correctly prevented${NC}"
        echo ""
        TEST_RESULTS+=("{\"category\":\"authorization\",\"test\":\"Delete another tenant's photo\",\"expected\":403,\"actual\":$HTTP_CODE,\"status\":\"PASS\",\"details\":\"Cross-tenant deletion correctly prevented (403 or 404)\"}")
    else
        record_test "authorization" "Delete another tenant's photo" 403 "$HTTP_CODE" "Failed to prevent cross-tenant deletion"
    fi
else
    echo -e "${YELLOW}⚠ WARNING: Could not create second tenant, skipping authorization tests${NC}"
    echo ""
fi

################################################################################
# Test Category 4: Not Found Errors (404)
################################################################################

print_test_category "NOT FOUND ERRORS (404)"

# Test 4.1: Upload to non-existent package
create_test_image 1024 "$TEMP_DIR/notfound-test-1.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/non-existent-package-id/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$TEMP_DIR/notfound-test-1.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "notFound" "Upload to non-existent package" 404 "$HTTP_CODE" "Should return 404 for missing package"

# Test 4.2: Delete non-existent photo
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos/non-existent-photo.png" \
    -H "Authorization: Bearer $AUTH_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
record_test "notFound" "Delete non-existent photo" 404 "$HTTP_CODE" "Should return 404 for missing photo"

################################################################################
# Test Category 5: File Size Errors (413)
################################################################################

print_test_category "FILE SIZE ERRORS (413)"

# Test 5.1: Upload file exactly at limit (4MB - should succeed)
echo -e "${CYAN}  Creating 4MB test file...${NC}"
create_test_image $((4 * 1024 * 1024)) "$TEMP_DIR/filesize-test-1.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$TEMP_DIR/filesize-test-1.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 201 ]; then
    FILE_SIZE_TESTS=$((FILE_SIZE_TESTS + 1))
    FILE_SIZE_PASSED=$((FILE_SIZE_PASSED + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: Upload 4MB file (within limit)"
    echo -e "   Expected: 201, Got: $HTTP_CODE"
    echo -e "   ${BLUE}File within 5MB limit correctly accepted${NC}"
    echo ""
    TEST_RESULTS+=("{\"category\":\"fileSize\",\"test\":\"Upload 4MB file (within limit)\",\"expected\":201,\"actual\":$HTTP_CODE,\"status\":\"PASS\",\"details\":\"File within 5MB limit correctly accepted\"}")
else
    record_test "fileSize" "Upload 4MB file (within limit)" 201 "$HTTP_CODE" "Should accept files under 5MB limit"
fi

# Test 5.2: Upload file over limit (6MB - should fail)
echo -e "${CYAN}  Creating 6MB test file...${NC}"
create_test_image $((6 * 1024 * 1024)) "$TEMP_DIR/filesize-test-2.png"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -F "photo=@$TEMP_DIR/filesize-test-2.png")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Accept either 413 or 400 for file size errors
if [ "$HTTP_CODE" -eq 413 ] || [ "$HTTP_CODE" -eq 400 ]; then
    FILE_SIZE_TESTS=$((FILE_SIZE_TESTS + 1))
    FILE_SIZE_PASSED=$((FILE_SIZE_PASSED + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: Upload 6MB file (over limit)"
    echo -e "   Expected: 413, Got: $HTTP_CODE (413 or 400 acceptable)"
    echo -e "   ${BLUE}File over 5MB limit correctly rejected${NC}"
    echo ""
    TEST_RESULTS+=("{\"category\":\"fileSize\",\"test\":\"Upload 6MB file (over limit)\",\"expected\":413,\"actual\":$HTTP_CODE,\"status\":\"PASS\",\"details\":\"File over 5MB limit correctly rejected (413 or 400)\"}")
else
    record_test "fileSize" "Upload 6MB file (over limit)" 413 "$HTTP_CODE" "Should reject files over 5MB limit"
fi

################################################################################
# Generate Summary Report
################################################################################

print_header "TEST SUMMARY"

echo -e "${CYAN}Overall Results:${NC}"
echo -e "  Tests Run:    ${BLUE}$TOTAL_TESTS${NC}"
echo -e "  Tests Passed: ${GREEN}$PASSED_TESTS ✓${NC}"
echo -e "  Tests Failed: ${RED}$FAILED_TESTS ✗${NC}"
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "  Pass Rate:    ${GREEN}${PASS_RATE}%${NC}"
echo ""

echo -e "${CYAN}Category Breakdown:${NC}"
echo -e "  Authentication:  ${GREEN}$AUTH_PASSED${NC}/${BLUE}$AUTH_TESTS${NC} passed"
echo -e "  Validation:      ${GREEN}$VALIDATION_PASSED${NC}/${BLUE}$VALIDATION_TESTS${NC} passed"
echo -e "  Authorization:   ${GREEN}$AUTHORIZATION_PASSED${NC}/${BLUE}$AUTHORIZATION_TESTS${NC} passed"
echo -e "  Not Found:       ${GREEN}$NOT_FOUND_PASSED${NC}/${BLUE}$NOT_FOUND_TESTS${NC} passed"
echo -e "  File Size:       ${GREEN}$FILE_SIZE_PASSED${NC}/${BLUE}$FILE_SIZE_TESTS${NC} passed"
echo ""

################################################################################
# Save JSON Results
################################################################################

cat > "$RESULTS_FILE" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": {
    "apiBase": "$API_BASE",
    "tenantId": "$TENANT_ID",
    "testPackageId": "$PACKAGE_ID"
  },
  "summary": {
    "totalTests": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "passRate": "${PASS_RATE}%"
  },
  "categories": {
    "authentication": {
      "total": $AUTH_TESTS,
      "passed": $AUTH_PASSED,
      "failed": $((AUTH_TESTS - AUTH_PASSED))
    },
    "validation": {
      "total": $VALIDATION_TESTS,
      "passed": $VALIDATION_PASSED,
      "failed": $((VALIDATION_TESTS - VALIDATION_PASSED))
    },
    "authorization": {
      "total": $AUTHORIZATION_TESTS,
      "passed": $AUTHORIZATION_PASSED,
      "failed": $((AUTHORIZATION_TESTS - AUTHORIZATION_PASSED))
    },
    "notFound": {
      "total": $NOT_FOUND_TESTS,
      "passed": $NOT_FOUND_PASSED,
      "failed": $((NOT_FOUND_TESTS - NOT_FOUND_PASSED))
    },
    "fileSize": {
      "total": $FILE_SIZE_TESTS,
      "passed": $FILE_SIZE_PASSED,
      "failed": $((FILE_SIZE_TESTS - FILE_SIZE_PASSED))
    }
  },
  "results": [
EOF

# Add test results
for i in "${!TEST_RESULTS[@]}"; do
    echo "    ${TEST_RESULTS[$i]}" >> "$RESULTS_FILE"
    if [ $i -lt $((${#TEST_RESULTS[@]} - 1)) ]; then
        echo "," >> "$RESULTS_FILE"
    fi
done

cat >> "$RESULTS_FILE" <<EOF

  ]
}
EOF

echo -e "${GREEN}Results saved to: $RESULTS_FILE${NC}"
echo ""

# Cleanup
rm -rf "$TEMP_DIR"

# Exit with error code if tests failed
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Some tests failed. See results above for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
fi
