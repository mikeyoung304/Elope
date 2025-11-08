#!/usr/bin/env bash
#
# Happy Path Test Agent for Package Photo Upload Feature
# Tests the complete lifecycle of uploading and deleting package photos
#

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3001"
JWT_SECRET="3d3fa3a52c3ffd50eab162e1222e4f953aede6a9e8732bf4a03a0b836f0bff24"
UPLOADS_DIR="./uploads/packages"
PACKAGE_ID="pkg_basic"

# Test state
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FILES_CREATED=()
FILES_DELETED=()

# Generate JWT token for testing
generate_token() {
    node -e "
    const jwt = require('jsonwebtoken');
    const payload = {
        tenantId: 'tenant_default_legacy',
        slug: 'test-tenant',
        email: 'test@example.com',
        type: 'tenant'
    };
    console.log(jwt.sign(payload, '$JWT_SECRET', { algorithm: 'HS256', expiresIn: '1h' }));
    "
}

# Create test images
create_test_image() {
    local filename=$1
    # Create a minimal valid PNG (1x1 pixel)
    printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$filename"
}

# Test helper functions
record_test() {
    local name=$1
    local status=$2
    local details=$3

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$status" == "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓${NC} $name"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗${NC} $name"
    fi

    echo "  $details"
}

# Main test suite
main() {
    echo "════════════════════════════════════════════════════════════"
    echo "Package Photo Upload - Happy Path Test Suite"
    echo "════════════════════════════════════════════════════════════"
    echo ""

    # Generate auth token
    echo "Generating authentication token..."
    TOKEN=$(generate_token)
    echo "Token generated"
    echo ""

    # Create test images
    echo "Creating test images..."
    for i in {1..6}; do
        create_test_image "test-photo-$i.png"
    done
    echo "Created 6 test images"
    echo ""

    # TEST 1: Upload single photo
    echo "Test 1: Upload single photo to package"
    echo "------------------------------------------------------------"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "$API_BASE_URL/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
        -H "Authorization: Bearer $TOKEN" \
        -F "photo=@test-photo-1.png")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" == "201" ]; then
        FILENAME=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.filename !== undefined ? data.filename : 'unknown')")
        URL=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.url !== undefined ? data.url : 'unknown')")
        SIZE=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.size !== undefined ? data.size : 'N/A')")
        ORDER=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.order !== undefined ? data.order : 'N/A')")

        FILES_CREATED+=("$FILENAME")
        record_test "Upload single photo" "PASS" "Photo uploaded: $FILENAME, URL: $URL, Size: $SIZE bytes, Order: $ORDER"
    else
        record_test "Upload single photo" "FAIL" "Expected 201, got $HTTP_CODE. Response: $BODY"
    fi
    echo ""

    # TEST 2: Verify photo metadata
    echo "Test 2: Verify photo metadata response"
    echo "------------------------------------------------------------"
    if [ "$HTTP_CODE" == "201" ] && [ -n "$FILENAME" ] && [ "$FILENAME" != "unknown" ] && \
       [ -n "$URL" ] && [ "$URL" != "unknown" ] && \
       [ "$SIZE" != "N/A" ] && [ "$ORDER" != "N/A" ] && [ "$ORDER" == "0" ]; then
        record_test "Verify photo metadata" "PASS" "All metadata fields present and valid (order: $ORDER)"
    else
        record_test "Verify photo metadata" "FAIL" "Missing or invalid metadata fields (ORDER=$ORDER, expected 0)"
    fi
    echo ""

    # TEST 3: Upload second photo (verify order)
    echo "Test 3: Upload second photo (verify order)"
    echo "------------------------------------------------------------"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "$API_BASE_URL/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
        -H "Authorization: Bearer $TOKEN" \
        -F "photo=@test-photo-2.png")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" == "201" ]; then
        FILENAME=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.filename !== undefined ? data.filename : 'unknown')")
        ORDER=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.order !== undefined ? data.order : 'N/A')")
        FILES_CREATED+=("$FILENAME")

        if [ "$ORDER" == "1" ]; then
            record_test "Upload second photo with correct order" "PASS" "Second photo has order: 1"
        else
            record_test "Upload second photo with correct order" "FAIL" "Expected order 1, got $ORDER"
        fi
    else
        record_test "Upload second photo with correct order" "FAIL" "Expected 201, got $HTTP_CODE"
    fi
    echo ""

    # TEST 4: Upload multiple photos (up to 5 max)
    echo "Test 4: Upload multiple photos (up to 5 max)"
    echo "------------------------------------------------------------"
    UPLOAD_COUNT=2  # Already uploaded 2

    for i in {3..5}; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            "$API_BASE_URL/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
            -H "Authorization: Bearer $TOKEN" \
            -F "photo=@test-photo-$i.png")

        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | sed '$d')

        if [ "$HTTP_CODE" == "201" ]; then
            FILENAME=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.filename !== undefined ? data.filename : 'unknown')")
            ORDER=$(echo "$BODY" | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.order !== undefined ? data.order : 'N/A')")
            FILES_CREATED+=("$FILENAME")
            UPLOAD_COUNT=$((UPLOAD_COUNT + 1))
            echo "  ✓ Uploaded photo $i/5 (order: $ORDER)"
        else
            echo "  ✗ Failed to upload photo $i/5 (status: $HTTP_CODE)"
        fi
    done

    if [ "$UPLOAD_COUNT" == "5" ]; then
        record_test "Upload multiple photos (5 total)" "PASS" "Successfully uploaded 5 photos"
    else
        record_test "Upload multiple photos (5 total)" "FAIL" "Only uploaded $UPLOAD_COUNT photos out of 5"
    fi
    echo ""

    # TEST 5: Verify max photo limit (should fail with 6th photo)
    echo "Test 5: Verify max photo limit (6th photo should fail)"
    echo "------------------------------------------------------------"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "$API_BASE_URL/v1/tenant/admin/packages/$PACKAGE_ID/photos" \
        -H "Authorization: Bearer $TOKEN" \
        -F "photo=@test-photo-6.png")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" == "400" ] && echo "$BODY" | grep -q "Maximum 5 photos"; then
        record_test "Verify max photo limit enforcement" "PASS" "Server correctly rejected 6th photo"
    else
        record_test "Verify max photo limit enforcement" "FAIL" "Expected 400 with max photos error, got $HTTP_CODE"
    fi
    echo ""

    # TEST 6: Delete photo by filename
    echo "Test 6: Delete photo by filename"
    echo "------------------------------------------------------------"
    if [ "${#FILES_CREATED[@]}" -gt 0 ]; then
        FILENAME_TO_DELETE="${FILES_CREATED[0]}"
        RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
            "$API_BASE_URL/v1/tenant/admin/packages/$PACKAGE_ID/photos/$FILENAME_TO_DELETE" \
            -H "Authorization: Bearer $TOKEN")

        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

        if [ "$HTTP_CODE" == "204" ]; then
            FILES_DELETED+=("$FILENAME_TO_DELETE")
            record_test "Delete photo by filename" "PASS" "Photo deleted: $FILENAME_TO_DELETE"
        else
            record_test "Delete photo by filename" "FAIL" "Expected 204, got $HTTP_CODE"
        fi
    else
        record_test "Delete photo by filename" "FAIL" "No files to delete"
    fi
    echo ""

    # TEST 7: Verify file removed from storage
    echo "Test 7: Verify file removed from storage"
    echo "------------------------------------------------------------"
    if [ "${#FILES_DELETED[@]}" -gt 0 ]; then
        DELETED_FILE="${FILES_DELETED[0]}"
        FILE_PATH="$UPLOADS_DIR/$DELETED_FILE"

        if [ ! -f "$FILE_PATH" ]; then
            record_test "Verify file removed from storage" "PASS" "File successfully removed: $DELETED_FILE"
        else
            record_test "Verify file removed from storage" "FAIL" "File still exists: $FILE_PATH"
        fi
    else
        record_test "Verify file removed from storage" "FAIL" "No files were deleted to verify"
    fi
    echo ""

    # TEST 8: Verify remaining photos in storage
    echo "Test 8: Verify remaining photos exist in storage"
    echo "------------------------------------------------------------"
    ALL_EXIST=true
    REMAINING_COUNT=0

    for file in "${FILES_CREATED[@]}"; do
        # Skip deleted files
        SKIP=false
        for deleted in "${FILES_DELETED[@]}"; do
            if [ "$file" == "$deleted" ]; then
                SKIP=true
                break
            fi
        done

        if [ "$SKIP" == "false" ]; then
            FILE_PATH="$UPLOADS_DIR/$file"
            if [ -f "$FILE_PATH" ]; then
                echo "  ✓ Found: $file"
                REMAINING_COUNT=$((REMAINING_COUNT + 1))
            else
                echo "  ✗ Missing: $file"
                ALL_EXIST=false
            fi
        fi
    done

    if [ "$ALL_EXIST" == "true" ] && [ "$REMAINING_COUNT" == "4" ]; then
        record_test "Verify remaining photos in storage" "PASS" "All 4 remaining photos found"
    else
        record_test "Verify remaining photos in storage" "FAIL" "Expected 4 remaining photos, found $REMAINING_COUNT"
    fi
    echo ""

    # Clean up test images
    for i in {1..6}; do
        rm -f "test-photo-$i.png"
    done

    # Generate report
    echo "════════════════════════════════════════════════════════════"
    echo "TEST REPORT"
    echo "════════════════════════════════════════════════════════════"
    echo "Tests Run: $TESTS_RUN"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED ✓${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED ✗${NC}"

    if [ "$TESTS_RUN" -gt 0 ]; then
        SUCCESS_RATE=$(echo "scale=1; ($TESTS_PASSED / $TESTS_RUN) * 100" | bc)
        echo "Success Rate: ${SUCCESS_RATE}%"
    fi

    echo ""
    echo "Files Created: ${#FILES_CREATED[@]}"
    for file in "${FILES_CREATED[@]}"; do
        echo "  - $file"
    done

    echo ""
    echo "Files Deleted: ${#FILES_DELETED[@]}"
    for file in "${FILES_DELETED[@]}"; do
        echo "  - $file"
    done

    echo ""
    echo "Summary:"
    if [ "$TESTS_FAILED" == "0" ]; then
        echo -e "${GREEN}All happy path tests passed successfully!${NC}"
    else
        echo -e "${RED}$TESTS_FAILED test(s) failed. Review details above.${NC}"
    fi
    echo "════════════════════════════════════════════════════════════"

    # Generate JSON report
    cat > test-photo-upload-report.json <<EOF
{
  "testsRun": $TESTS_RUN,
  "testsPassed": $TESTS_PASSED,
  "testsFailed": $TESTS_FAILED,
  "filesCreated": [$(printf '"%s",' "${FILES_CREATED[@]}" | sed 's/,$//')],
  "filesDeleted": [$(printf '"%s",' "${FILES_DELETED[@]}" | sed 's/,$//')],
  "summary": "$([ "$TESTS_FAILED" == "0" ] && echo "All happy path tests passed successfully!" || echo "$TESTS_FAILED test(s) failed")"
}
EOF

    echo ""
    echo "Detailed JSON report written to: test-photo-upload-report.json"
}

main
