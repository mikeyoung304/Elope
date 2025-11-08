#!/usr/bin/env node
/**
 * Happy Path Test Agent for Package Photo Upload Feature
 * Tests the complete lifecycle of uploading and deleting package photos
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const JWT_SECRET = '3d3fa3a52c3ffd50eab162e1222e4f953aede6a9e8732bf4a03a0b836f0bff24';
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'packages');

// Test state
const testResults = {
  testsRun: 0,
  testsPassed: 0,
  testsFailed: 0,
  results: [],
  filesCreated: [],
  filesDeleted: [],
};

// Generate a test JWT token for mock tenant
function generateTestToken() {
  const payload = {
    tenantId: 'tenant_default_legacy',
    slug: 'test-tenant',
    email: 'test@example.com',
    type: 'tenant',
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

// Create test images (simple 1x1 PNG)
function createTestImage(filename) {
  // Minimal valid PNG (1x1 pixel, white)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // IEND chunk
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);

  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, pngData);
  return filepath;
}

// HTTP helper functions
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
      headers: response.headers,
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

async function uploadPhoto(packageId, photoPath, token) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('photo', fs.createReadStream(photoPath));

  return makeRequest('POST', `/v1/tenant/admin/packages/${packageId}/photos`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });
}

async function deletePhoto(packageId, filename, token) {
  return makeRequest('DELETE', `/v1/tenant/admin/packages/${packageId}/photos/${filename}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

async function getPackage(packageId, token) {
  return makeRequest('GET', `/v1/tenant/admin/packages/${packageId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

function recordTest(name, status, duration, details, response = null) {
  testResults.testsRun++;
  if (status === 'PASS') {
    testResults.testsPassed++;
  } else {
    testResults.testsFailed++;
  }

  testResults.results.push({
    test: name,
    status,
    duration: `${duration}ms`,
    details,
    response: response ? JSON.stringify(response, null, 2) : null,
  });

  console.log(`${status === 'PASS' ? '✓' : '✗'} ${name} (${duration}ms)`);
  console.log(`  ${details}`);
  if (status === 'FAIL' && response) {
    console.log(`  Response: ${JSON.stringify(response)}`);
  }
}

// Main test suite
async function runTests() {
  console.log('═'.repeat(60));
  console.log('Package Photo Upload - Happy Path Test Suite');
  console.log('═'.repeat(60));
  console.log('');

  const token = generateTestToken();
  const packageId = 'pkg_basic'; // From mock data

  // Create test images
  console.log('Setting up test images...');
  const testImages = [
    createTestImage('test-photo-1.png'),
    createTestImage('test-photo-2.png'),
    createTestImage('test-photo-3.png'),
    createTestImage('test-photo-4.png'),
    createTestImage('test-photo-5.png'),
  ];
  console.log(`Created ${testImages.length} test images\n`);

  // TEST 1: Upload single photo
  console.log('Test 1: Upload single photo to package');
  console.log('-'.repeat(60));
  const upload1 = await uploadPhoto(packageId, testImages[0], token);

  if (upload1.status === 201 && upload1.data && upload1.data.url) {
    recordTest(
      'Upload single photo',
      'PASS',
      upload1.duration,
      `Photo uploaded successfully. URL: ${upload1.data.url}, Filename: ${upload1.data.filename}`,
      upload1.data
    );
    testResults.filesCreated.push(upload1.data.filename);
  } else {
    recordTest(
      'Upload single photo',
      'FAIL',
      upload1.duration,
      `Expected 201 status and photo metadata, got ${upload1.status}`,
      upload1.data
    );
  }
  console.log('');

  // TEST 2: Verify photo metadata
  console.log('Test 2: Verify photo metadata response');
  console.log('-'.repeat(60));
  if (upload1.data && upload1.data.url && upload1.data.filename &&
      typeof upload1.data.size === 'number' && typeof upload1.data.order === 'number') {
    recordTest(
      'Verify photo metadata',
      'PASS',
      0,
      `Photo metadata complete: url, filename, size (${upload1.data.size} bytes), order (${upload1.data.order})`,
      upload1.data
    );
  } else {
    recordTest(
      'Verify photo metadata',
      'FAIL',
      0,
      'Missing required metadata fields (url, filename, size, order)',
      upload1.data
    );
  }
  console.log('');

  // TEST 3: Upload second photo (verify order)
  console.log('Test 3: Upload second photo (verify order)');
  console.log('-'.repeat(60));
  const upload2 = await uploadPhoto(packageId, testImages[1], token);

  if (upload2.status === 201 && upload2.data && upload2.data.order === 1) {
    recordTest(
      'Upload second photo with correct order',
      'PASS',
      upload2.duration,
      `Second photo uploaded with order: ${upload2.data.order}`,
      upload2.data
    );
    testResults.filesCreated.push(upload2.data.filename);
  } else {
    recordTest(
      'Upload second photo with correct order',
      'FAIL',
      upload2.duration,
      `Expected order 1, got ${upload2.data?.order}`,
      upload2.data
    );
  }
  console.log('');

  // TEST 4: Upload multiple photos (up to 5 max)
  console.log('Test 4: Upload multiple photos (up to 5 max)');
  console.log('-'.repeat(60));
  let uploadCount = 2; // Already uploaded 2

  for (let i = 2; i < 5; i++) {
    const upload = await uploadPhoto(packageId, testImages[i], token);
    if (upload.status === 201) {
      uploadCount++;
      testResults.filesCreated.push(upload.data.filename);
      console.log(`  ✓ Uploaded photo ${i + 1}/5 (order: ${upload.data.order})`);
    } else {
      console.log(`  ✗ Failed to upload photo ${i + 1}/5`);
    }
  }

  if (uploadCount === 5) {
    recordTest(
      'Upload multiple photos (5 total)',
      'PASS',
      0,
      `Successfully uploaded 5 photos to package`,
      { uploadedCount: uploadCount }
    );
  } else {
    recordTest(
      'Upload multiple photos (5 total)',
      'FAIL',
      0,
      `Only uploaded ${uploadCount} photos out of 5`,
      { uploadedCount: uploadCount }
    );
  }
  console.log('');

  // TEST 5: Verify max photo limit (should fail with 6th photo)
  console.log('Test 5: Verify max photo limit (6th photo should fail)');
  console.log('-'.repeat(60));
  const extraImage = createTestImage('test-photo-6.png');
  const upload6 = await uploadPhoto(packageId, extraImage, token);

  if (upload6.status === 400 && upload6.data && upload6.data.error &&
      upload6.data.error.includes('Maximum 5 photos')) {
    recordTest(
      'Verify max photo limit enforcement',
      'PASS',
      upload6.duration,
      'Server correctly rejected 6th photo with max limit error',
      upload6.data
    );
  } else {
    recordTest(
      'Verify max photo limit enforcement',
      'FAIL',
      upload6.duration,
      `Expected 400 error for max photos, got ${upload6.status}`,
      upload6.data
    );
  }
  fs.unlinkSync(extraImage); // Clean up extra test image
  console.log('');

  // TEST 6: Delete photo by filename
  console.log('Test 6: Delete photo by filename');
  console.log('-'.repeat(60));
  const filenameToDelete = testResults.filesCreated[0];
  const deleteResult = await deletePhoto(packageId, filenameToDelete, token);

  if (deleteResult.status === 204) {
    recordTest(
      'Delete photo by filename',
      'PASS',
      deleteResult.duration,
      `Photo deleted successfully: ${filenameToDelete}`,
      { filename: filenameToDelete }
    );
    testResults.filesDeleted.push(filenameToDelete);
  } else {
    recordTest(
      'Delete photo by filename',
      'FAIL',
      deleteResult.duration,
      `Expected 204 status, got ${deleteResult.status}`,
      deleteResult.data
    );
  }
  console.log('');

  // TEST 7: Verify file removed from storage
  console.log('Test 7: Verify file removed from storage');
  console.log('-'.repeat(60));
  const deletedFilePath = path.join(UPLOADS_DIR, filenameToDelete);
  const fileExists = fs.existsSync(deletedFilePath);

  if (!fileExists) {
    recordTest(
      'Verify file removed from storage',
      'PASS',
      0,
      `File successfully removed from storage: ${deletedFilePath}`,
      { filePath: deletedFilePath, exists: false }
    );
  } else {
    recordTest(
      'Verify file removed from storage',
      'FAIL',
      0,
      `File still exists in storage: ${deletedFilePath}`,
      { filePath: deletedFilePath, exists: true }
    );
  }
  console.log('');

  // TEST 8: Verify remaining photos in storage
  console.log('Test 8: Verify remaining photos exist in storage');
  console.log('-'.repeat(60));
  const remainingFiles = testResults.filesCreated.filter(f => !testResults.filesDeleted.includes(f));
  let allExist = true;

  for (const filename of remainingFiles) {
    const filepath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filepath)) {
      allExist = false;
      console.log(`  ✗ Missing: ${filename}`);
    } else {
      console.log(`  ✓ Found: ${filename}`);
    }
  }

  if (allExist && remainingFiles.length === 4) {
    recordTest(
      'Verify remaining photos in storage',
      'PASS',
      0,
      `All ${remainingFiles.length} remaining photos found in storage`,
      { remainingCount: remainingFiles.length }
    );
  } else {
    recordTest(
      'Verify remaining photos in storage',
      'FAIL',
      0,
      `Expected 4 remaining photos, found ${remainingFiles.filter(f => fs.existsSync(path.join(UPLOADS_DIR, f))).length}`,
      { remainingCount: remainingFiles.length }
    );
  }
  console.log('');

  // Clean up test images
  testImages.forEach(img => {
    if (fs.existsSync(img)) {
      fs.unlinkSync(img);
    }
  });

  // Generate report
  console.log('═'.repeat(60));
  console.log('TEST REPORT');
  console.log('═'.repeat(60));
  console.log(`Tests Run: ${testResults.testsRun}`);
  console.log(`Tests Passed: ${testResults.testsPassed} ✓`);
  console.log(`Tests Failed: ${testResults.testsFailed} ✗`);
  console.log(`Success Rate: ${((testResults.testsPassed / testResults.testsRun) * 100).toFixed(1)}%`);
  console.log('');
  console.log(`Files Created: ${testResults.filesCreated.length}`);
  testResults.filesCreated.forEach(f => console.log(`  - ${f}`));
  console.log('');
  console.log(`Files Deleted: ${testResults.filesDeleted.length}`);
  testResults.filesDeleted.forEach(f => console.log(`  - ${f}`));
  console.log('');

  testResults.summary = testResults.testsFailed === 0
    ? 'All happy path tests passed successfully!'
    : `${testResults.testsFailed} test(s) failed. Review details above.`;

  console.log('Summary:');
  console.log(testResults.summary);
  console.log('═'.repeat(60));

  // Write JSON report
  const reportPath = path.join(__dirname, 'test-photo-upload-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nDetailed JSON report written to: ${reportPath}`);

  return testResults;
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
