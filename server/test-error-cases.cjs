#!/usr/bin/env node
/**
 * Error Case & Validation Test Agent for Package Photo Upload Feature
 * Tests authentication, validation, authorization, and edge cases
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const JWT_SECRET = '3d3fa3a52c3ffd50eab162e1222e4f953aede6a9e8732bf4a03a0b836f0bff24';

// Test state
const testResults = {
  testsRun: 0,
  testsPassed: 0,
  testsFailed: 0,
  results: [],
  securityIssues: [],
  validationGaps: [],
};

// Generate test JWT tokens
function generateToken(tenantId, slug) {
  const payload = {
    tenantId,
    slug,
    email: `${slug}@example.com`,
    type: 'tenant',
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

// Create test images
function createTestImage(size) {
  // Minimal valid PNG header
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  ]);

  if (size <= pngHeader.length) {
    return pngHeader.slice(0, size);
  }

  const remaining = Buffer.alloc(size - pngHeader.length, 0xFF);
  return Buffer.concat([pngHeader, remaining]);
}

function createTextFile() {
  return Buffer.from('This is a text file, not an image');
}

// HTTP helper
async function makeRequest(method, endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method,
      ...options,
    });

    const duration = Date.now() - startTime;
    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      data,
      duration,
    };
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function uploadPhoto(packageId, photoBuffer, filename, token = null) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('photo', photoBuffer, filename);

  const headers = { ...form.getHeaders() };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return makeRequest('POST', `/v1/tenant/admin/packages/${packageId}/photos`, {
    headers,
    body: form,
  });
}

async function deletePhoto(packageId, filename, token) {
  return makeRequest('DELETE', `/v1/tenant/admin/packages/${packageId}/photos/${filename}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}

function recordTest(name, expected, actual, details) {
  testResults.testsRun++;
  const status = expected === actual ? 'PASS' : 'FAIL';

  if (status === 'PASS') {
    testResults.testsPassed++;
  } else {
    testResults.testsFailed++;
  }

  testResults.results.push({
    test: name,
    expectedStatus: expected,
    actualStatus: actual,
    status,
    details,
  });

  console.log(`${status === 'PASS' ? '✅' : '❌'} ${status}: ${name}`);
  console.log(`   Expected: ${expected}, Got: ${actual} - ${details}`);
  console.log('');
}

// Main test suite
async function runTests() {
  console.log('🚀 Starting Error Case & Validation Tests');
  console.log('═'.repeat(60));
  console.log('');

  // Setup: Generate tokens for two different tenants
  const tenant1Token = generateToken('tenant_default_legacy', 'test-tenant-1');
  const tenant2Token = generateToken('tenant_test_2', 'test-tenant-2');
  const packageId = 'pkg_basic'; // From mock data
  const nonExistentPackageId = 'pkg_nonexistent';

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================
  console.log('🔐 Authentication Tests:');
  console.log('-'.repeat(60));

  // Test 1: Upload without auth token
  console.log('Test 1: Upload without auth token');
  const test1 = await uploadPhoto(packageId, createTestImage(1024), 'test.png', null);
  recordTest(
    'Upload without auth token',
    401,
    test1.status,
    test1.status === 401 ? 'Correctly rejected unauthorized request' : 'SECURITY ISSUE: Accepted without auth'
  );
  if (test1.status !== 401) {
    testResults.securityIssues.push('Photo upload allowed without authentication');
  }

  // Test 2: Upload with invalid token
  console.log('Test 2: Upload with invalid token');
  const invalidToken = 'invalid_token_12345';
  const test2 = await uploadPhoto(packageId, createTestImage(1024), 'test.png', invalidToken);
  recordTest(
    'Upload with invalid token',
    401,
    test2.status,
    test2.status === 401 ? 'Correctly rejected invalid token' : 'SECURITY ISSUE: Accepted invalid token'
  );
  if (test2.status !== 401) {
    testResults.securityIssues.push('Photo upload allowed with invalid token');
  }

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================
  console.log('✅ Validation Tests:');
  console.log('-'.repeat(60));

  // Test 3: Upload without file
  console.log('Test 3: Upload without file');
  const FormData = (await import('form-data')).default;
  const emptyForm = new FormData();
  const test3 = await makeRequest('POST', `/v1/tenant/admin/packages/${packageId}/photos`, {
    headers: {
      'Authorization': `Bearer ${tenant1Token}`,
      ...emptyForm.getHeaders(),
    },
    body: emptyForm,
  });
  recordTest(
    'Upload without file',
    400,
    test3.status,
    test3.status === 400 ? 'Correctly rejected missing file' : `Wrong error response`
  );
  if (test3.status !== 400) {
    testResults.validationGaps.push('Missing file validation not enforced');
  }

  // Test 4: Upload file too large (>5MB)
  console.log('Test 4: Upload file >5MB');
  const test4 = await uploadPhoto(packageId, createTestImage(6 * 1024 * 1024), 'large.png', tenant1Token);
  const acceptableSizes = [400, 413]; // Either validation error or payload too large
  recordTest(
    'Upload file >5MB',
    413,
    test4.status,
    acceptableSizes.includes(test4.status) ? 'Correctly rejected oversized file' : `Wrong error response`
  );
  if (!acceptableSizes.includes(test4.status)) {
    testResults.validationGaps.push('File size limit (5MB) not enforced');
  }

  // Test 5: Upload invalid file type
  console.log('Test 5: Upload non-image file');
  const test5 = await uploadPhoto(packageId, createTextFile(), 'test.txt', tenant1Token);
  recordTest(
    'Upload non-image file',
    400,
    test5.status,
    test5.status === 400 ? 'Correctly rejected invalid file type' : `Wrong error response`
  );
  if (test5.status !== 400) {
    testResults.validationGaps.push('File type validation not enforced');
  }

  // Test 6: Upload to non-existent package
  console.log('Test 6: Upload to non-existent package');
  const test6 = await uploadPhoto(nonExistentPackageId, createTestImage(1024), 'test.png', tenant1Token);
  recordTest(
    'Upload to non-existent package',
    404,
    test6.status,
    test6.status === 404 ? 'Correctly rejected non-existent package' : `Wrong error response`
  );

  // ==========================================================================
  // BUSINESS LOGIC TESTS
  // ==========================================================================
  console.log('💼 Business Logic Tests:');
  console.log('-'.repeat(60));

  // Test 7: Upload 6th photo (exceeds max 5)
  console.log('Test 7: Upload 6th photo (exceeds max)');
  // First upload 5 photos
  const uploadedFilenames = [];
  for (let i = 0; i < 5; i++) {
    const result = await uploadPhoto(packageId, createTestImage(1024), `max${i}.png`, tenant1Token);
    if (result.status === 201 && result.data.filename) {
      uploadedFilenames.push(result.data.filename);
    }
  }

  // Try to upload 6th
  const test7 = await uploadPhoto(packageId, createTestImage(1024), 'max6.png', tenant1Token);
  recordTest(
    'Upload 6th photo (exceeds max)',
    400,
    test7.status,
    test7.status === 400 && test7.data?.error?.includes('Maximum 5')
      ? 'Correctly enforced 5 photo limit'
      : `Wrong error: ${test7.data?.error || test7.status}`
  );
  if (test7.status !== 400 || !test7.data?.error?.includes('Maximum 5')) {
    testResults.validationGaps.push('Maximum 5 photos limit not enforced');
  }

  // Test 8: Delete non-existent photo
  console.log('Test 8: Delete non-existent photo');
  const test8 = await deletePhoto(packageId, 'non-existent-file.png', tenant1Token);
  recordTest(
    'Delete non-existent photo',
    404,
    test8.status,
    test8.status === 404 ? 'Correctly rejected non-existent photo' : `Wrong error response`
  );

  // ==========================================================================
  // AUTHORIZATION TESTS (Cross-tenant)
  // ==========================================================================
  console.log('🔒 Authorization Tests:');
  console.log('-'.repeat(60));

  // Test 9: Try to upload to another tenant's package (if different tenants exist)
  console.log('Test 9: Upload to another tenant\'s package');
  // Note: In the current implementation with mock data, tenant isolation might work differently
  // This test documents the expected behavior
  const test9 = await uploadPhoto('pkg_premium', createTestImage(1024), 'test.png', tenant2Token);
  const acceptableAuthStatuses = [403, 404]; // Either forbidden or not found
  recordTest(
    'Upload to another tenant\'s package',
    403,
    test9.status,
    acceptableAuthStatuses.includes(test9.status)
      ? 'Correctly prevented cross-tenant upload (403 or 404)'
      : `SECURITY ISSUE: Cross-tenant upload may be possible`
  );
  if (!acceptableAuthStatuses.includes(test9.status) && test9.status !== 400) {
    testResults.securityIssues.push('Cross-tenant photo upload may not be prevented');
  }

  // Test 10: Try to delete another tenant's photo
  console.log('Test 10: Delete another tenant\'s photo');
  const test10 = await deletePhoto(packageId, uploadedFilenames[0] || 'any-file.png', tenant2Token);
  recordTest(
    'Delete another tenant\'s photo',
    403,
    test10.status,
    acceptableAuthStatuses.includes(test10.status)
      ? 'Correctly prevented cross-tenant deletion (403 or 404)'
      : `SECURITY ISSUE: Cross-tenant deletion may be possible`
  );
  if (!acceptableAuthStatuses.includes(test10.status)) {
    testResults.securityIssues.push('Cross-tenant photo deletion may not be prevented');
  }

  // ==========================================================================
  // EDGE CASE TESTS
  // ==========================================================================
  console.log('🎯 Edge Case Tests:');
  console.log('-'.repeat(60));

  // Test 11: Upload with special characters in filename
  console.log('Test 11: Upload with special chars in filename');
  const test11 = await uploadPhoto(
    packageId,
    createTestImage(1024),
    'test file (1) [copy].png',
    tenant1Token
  );
  const test11Success = test11.status === 201 || test11.status === 400;
  recordTest(
    'Upload with special chars in filename',
    201,
    test11.status,
    test11.status === 201
      ? 'Correctly handled special characters'
      : 'May have validation for special characters (acceptable)'
  );

  // Test 12: Upload very small image (1 byte)
  console.log('Test 12: Upload 1-byte file');
  const test12 = await uploadPhoto(packageId, Buffer.from([0xFF]), 'tiny.png', tenant1Token);
  recordTest(
    'Upload 1-byte file',
    400,
    test12.status,
    test12.status === 400
      ? 'Correctly rejected tiny file'
      : 'Edge case: Tiny file accepted (may want min size validation)'
  );

  // Test 13: Delete same photo twice
  console.log('Test 13: Delete same photo twice');
  if (uploadedFilenames.length > 1) {
    const filenameToDelete = uploadedFilenames[1];

    // Delete once
    await deletePhoto(packageId, filenameToDelete, tenant1Token);

    // Delete again
    const test13 = await deletePhoto(packageId, filenameToDelete, tenant1Token);
    recordTest(
      'Delete same photo twice',
      404,
      test13.status,
      test13.status === 404 ? 'Correctly handled double deletion' : `Wrong error response`
    );
  } else {
    recordTest(
      'Delete same photo twice',
      404,
      0,
      'Skipped: Could not upload photos for cleanup test'
    );
  }

  // Cleanup remaining uploaded photos
  for (const filename of uploadedFilenames.slice(2)) {
    await deletePhoto(packageId, filename, tenant1Token).catch(() => {});
  }

  // ==========================================================================
  // GENERATE REPORT
  // ==========================================================================
  console.log('═'.repeat(60));
  console.log('📊 TEST REPORT');
  console.log('═'.repeat(60));
  console.log(`Tests Run: ${testResults.testsRun}`);
  console.log(`Tests Passed: ${testResults.testsPassed} ✅`);
  console.log(`Tests Failed: ${testResults.testsFailed} ❌`);
  console.log(`Summary: ${testResults.testsPassed}/${testResults.testsRun} error cases handled correctly`);
  console.log('');

  if (testResults.securityIssues.length > 0) {
    console.log('🚨 SECURITY ISSUES:');
    testResults.securityIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  }

  if (testResults.validationGaps.length > 0) {
    console.log('⚠️  VALIDATION GAPS:');
    testResults.validationGaps.forEach(gap => console.log(`   - ${gap}`));
    console.log('');
  }

  testResults.summary = `${testResults.testsPassed}/${testResults.testsRun} error cases handled correctly`;

  // Write JSON report
  const reportPath = path.join(__dirname, 'test-error-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Detailed JSON report written to: ${reportPath}`);
  console.log('');

  return testResults;
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
