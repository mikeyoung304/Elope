#!/usr/bin/env node
/**
 * Comprehensive Package Photo Upload API Test Suite
 * Tests all happy path scenarios for photo upload, retrieval, and deletion
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:3001';
const TEST_PHOTO_PATH = '/tmp/test-package-photo.jpg';

// Test report structure
const testReport = {
  singleUpload: {
    tested: false,
    passed: false,
    httpStatus: null,
    photoMetadata: null,
    issues: []
  },
  multipleUploads: {
    tested: false,
    passed: false,
    photosUploaded: 0,
    orderSequence: [],
    uniqueFilenames: false,
    issues: []
  },
  photoRetrieval: {
    tested: false,
    passed: false,
    photosRetrieved: 0,
    correctStructure: false,
    issues: []
  },
  photoDeletion: {
    tested: false,
    passed: false,
    deletionVerified: false,
    orderPreserved: false,
    issues: []
  },
  fileFormats: {
    jpg: { tested: false, passed: false, issues: [] },
    png: { tested: false, passed: false, issues: [] },
    webp: { tested: false, passed: false, issues: [] }
  },
  completeWorkflow: {
    tested: false,
    passed: false,
    steps: [],
    issues: []
  },
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    criticalIssues: []
  }
};

// Helper function to make HTTP requests
async function request(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');

  let data = null;
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    const text = await response.text();
    data = text || null;
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: Object.fromEntries(response.headers.entries())
  };
}

// Helper function to upload a photo
async function uploadPhoto(packageId, filePath, authToken) {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('photo', blob, path.basename(filePath));

  const response = await fetch(`${API_BASE}/v1/tenant/admin/packages/${packageId}/photos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  const data = response.ok ? await response.json() : null;
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Helper function to delete a photo
async function deletePhoto(packageId, filename, authToken) {
  return request(`${API_BASE}/v1/tenant/admin/packages/${packageId}/photos/${filename}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
}

// Helper function to get package with photos
async function getPackage(packageId, authToken) {
  return request(`${API_BASE}/v1/tenant/admin/packages/${packageId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
}

// Helper function to get all packages
async function getAllPackages(authToken) {
  return request(`${API_BASE}/v1/tenant/admin/packages`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
}

// Create test PNG file
function createTestPNG(outputPath) {
  // Create a simple 1x1 pixel PNG
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
    0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  fs.writeFileSync(outputPath, pngData);
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Package Photo Upload API Tests...\n');

  // Step 1: Attempt to authenticate
  console.log('📋 Step 1: Authentication');
  console.log('⚠️  Note: This test requires tenant authentication to be set up.');
  console.log('⚠️  If authentication fails, all tests will be skipped.\n');

  // Try tenant auth login
  let authToken = null;
  let packageId = null;

  // Try to login with test tenant (if it exists)
  const loginAttempt = await request(`${API_BASE}/v1/tenant-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@venue.com',
      password: 'password123'
    })
  });

  if (loginAttempt.ok && loginAttempt.data && loginAttempt.data.token) {
    authToken = loginAttempt.data.token;
    console.log('✅ Tenant authentication successful');
  } else {
    console.log('❌ Tenant authentication failed');
    console.log(`   Status: ${loginAttempt.status}`);
    console.log(`   Response: ${JSON.stringify(loginAttempt.data)}`);
    console.log('\n⚠️  CRITICAL: Cannot proceed without authentication');
    console.log('   Please ensure:');
    console.log('   1. A tenant exists in the database');
    console.log('   2. The tenant has email: test@venue.com');
    console.log('   3. The tenant has password: password123');
    console.log('\n   Or update the test script with correct credentials.\n');

    testReport.summary.criticalIssues.push('Authentication failed - no tenant configured');
    return testReport;
  }

  // Get a package to test with
  const packagesResponse = await getAllPackages(authToken);
  if (packagesResponse.ok && packagesResponse.data && packagesResponse.data.length > 0) {
    packageId = packagesResponse.data[0].id;
    console.log(`✅ Found test package: ${packageId}\n`);
  } else {
    console.log('❌ No packages found');
    testReport.summary.criticalIssues.push('No packages available for testing');
    return testReport;
  }

  // TEST 1: Single Photo Upload
  console.log('📸 Test 1: Single Photo Upload');
  testReport.singleUpload.tested = true;

  try {
    const uploadResult = await uploadPhoto(packageId, TEST_PHOTO_PATH, authToken);
    testReport.singleUpload.httpStatus = uploadResult.status;

    if (uploadResult.status === 201 && uploadResult.data) {
      const photo = uploadResult.data;
      if (photo.url && photo.filename && typeof photo.size === 'number' && typeof photo.order === 'number') {
        testReport.singleUpload.passed = true;
        testReport.singleUpload.photoMetadata = photo;
        console.log(`✅ Single photo uploaded successfully`);
        console.log(`   URL: ${photo.url}`);
        console.log(`   Filename: ${photo.filename}`);
        console.log(`   Size: ${photo.size} bytes`);
        console.log(`   Order: ${photo.order}`);

        if (photo.order !== 0) {
          testReport.singleUpload.issues.push('First photo order should be 0');
        }
      } else {
        testReport.singleUpload.issues.push('Response missing required fields');
      }
    } else {
      testReport.singleUpload.issues.push(`Expected 201 Created, got ${uploadResult.status}`);
    }
  } catch (error) {
    testReport.singleUpload.issues.push(`Error: ${error.message}`);
  }
  console.log('');

  // TEST 2: Multiple Photo Uploads
  console.log('📸 Test 2: Multiple Photo Uploads (5 photos)');
  testReport.multipleUploads.tested = true;

  try {
    const uploadedPhotos = [];
    for (let i = 0; i < 5; i++) {
      const result = await uploadPhoto(packageId, TEST_PHOTO_PATH, authToken);
      if (result.ok && result.data) {
        uploadedPhotos.push(result.data);
        testReport.multipleUploads.photosUploaded++;
      } else {
        testReport.multipleUploads.issues.push(`Failed to upload photo ${i + 1}`);
        break;
      }
    }

    if (uploadedPhotos.length === 5) {
      // Check unique filenames
      const filenames = uploadedPhotos.map(p => p.filename);
      const uniqueFilenames = new Set(filenames);
      testReport.multipleUploads.uniqueFilenames = uniqueFilenames.size === filenames.length;

      // Check order sequence
      testReport.multipleUploads.orderSequence = uploadedPhotos.map(p => p.order);
      const expectedOrder = [0, 1, 2, 3, 4];
      const orderCorrect = testReport.multipleUploads.orderSequence.every((o, i) => o === expectedOrder[i]);

      if (testReport.multipleUploads.uniqueFilenames && orderCorrect) {
        testReport.multipleUploads.passed = true;
        console.log(`✅ All 5 photos uploaded successfully`);
        console.log(`   Unique filenames: ${testReport.multipleUploads.uniqueFilenames}`);
        console.log(`   Order sequence: ${testReport.multipleUploads.orderSequence.join(', ')}`);
      } else {
        if (!testReport.multipleUploads.uniqueFilenames) {
          testReport.multipleUploads.issues.push('Filenames are not unique');
        }
        if (!orderCorrect) {
          testReport.multipleUploads.issues.push('Order sequence is incorrect');
        }
      }
    }
  } catch (error) {
    testReport.multipleUploads.issues.push(`Error: ${error.message}`);
  }
  console.log('');

  // TEST 3: Photo Retrieval
  console.log('📸 Test 3: Photo Retrieval');
  testReport.photoRetrieval.tested = true;

  try {
    const packagesResult = await getAllPackages(authToken);
    if (packagesResult.ok && packagesResult.data) {
      const pkg = packagesResult.data.find(p => p.id === packageId);
      if (pkg && pkg.photos && Array.isArray(pkg.photos)) {
        testReport.photoRetrieval.photosRetrieved = pkg.photos.length;
        testReport.photoRetrieval.correctStructure = pkg.photos.every(p =>
          p.url && p.filename && typeof p.size === 'number' && typeof p.order === 'number'
        );

        if (testReport.photoRetrieval.photosRetrieved > 0 && testReport.photoRetrieval.correctStructure) {
          testReport.photoRetrieval.passed = true;
          console.log(`✅ Successfully retrieved ${testReport.photoRetrieval.photosRetrieved} photos`);
          console.log(`   All photos have correct structure: ${testReport.photoRetrieval.correctStructure}`);
        } else {
          testReport.photoRetrieval.issues.push('Photos array structure incorrect');
        }
      } else {
        testReport.photoRetrieval.issues.push('Package missing photos array');
      }
    } else {
      testReport.photoRetrieval.issues.push('Failed to retrieve packages');
    }
  } catch (error) {
    testReport.photoRetrieval.issues.push(`Error: ${error.message}`);
  }
  console.log('');

  // TEST 4: Photo Deletion
  console.log('📸 Test 4: Photo Deletion');
  testReport.photoDeletion.tested = true;

  try {
    // Get current photos
    const beforeResult = await getAllPackages(authToken);
    const pkgBefore = beforeResult.data.find(p => p.id === packageId);
    const photosBefore = pkgBefore?.photos || [];

    if (photosBefore.length >= 3) {
      // Delete middle photo (index 1)
      const photoToDelete = photosBefore[1];
      const deleteResult = await deletePhoto(packageId, photoToDelete.filename, authToken);

      if (deleteResult.status === 204) {
        // Verify deletion
        const afterResult = await getAllPackages(authToken);
        const pkgAfter = afterResult.data.find(p => p.id === packageId);
        const photosAfter = pkgAfter?.photos || [];

        testReport.photoDeletion.deletionVerified = photosAfter.length === photosBefore.length - 1;
        const stillExists = photosAfter.some(p => p.filename === photoToDelete.filename);

        if (testReport.photoDeletion.deletionVerified && !stillExists) {
          testReport.photoDeletion.passed = true;
          console.log(`✅ Photo deleted successfully`);
          console.log(`   Photos before: ${photosBefore.length}`);
          console.log(`   Photos after: ${photosAfter.length}`);
          console.log(`   Deleted photo no longer exists: ${!stillExists}`);
        } else {
          testReport.photoDeletion.issues.push('Photo deletion not verified');
        }
      } else {
        testReport.photoDeletion.issues.push(`Expected 204 No Content, got ${deleteResult.status}`);
      }
    } else {
      testReport.photoDeletion.issues.push('Not enough photos to test deletion');
    }
  } catch (error) {
    testReport.photoDeletion.issues.push(`Error: ${error.message}`);
  }
  console.log('');

  // TEST 5: File Formats
  console.log('📸 Test 5: File Formats');

  // JPG test
  testReport.fileFormats.jpg.tested = true;
  try {
    const jpgResult = await uploadPhoto(packageId, TEST_PHOTO_PATH, authToken);
    if (jpgResult.status === 201) {
      testReport.fileFormats.jpg.passed = true;
      console.log(`✅ JPG format upload successful`);
    } else {
      testReport.fileFormats.jpg.issues.push(`Upload failed with status ${jpgResult.status}`);
    }
  } catch (error) {
    testReport.fileFormats.jpg.issues.push(`Error: ${error.message}`);
  }

  // PNG test
  testReport.fileFormats.png.tested = true;
  const testPNGPath = '/tmp/test-photo.png';
  try {
    createTestPNG(testPNGPath);
    const pngResult = await uploadPhoto(packageId, testPNGPath, authToken);
    if (pngResult.status === 201) {
      testReport.fileFormats.png.passed = true;
      console.log(`✅ PNG format upload successful`);
    } else {
      testReport.fileFormats.png.issues.push(`Upload failed with status ${pngResult.status}`);
    }
  } catch (error) {
    testReport.fileFormats.png.issues.push(`Error: ${error.message}`);
  }

  // WebP test - skip if not available
  console.log(`⏭️  WebP format test skipped (requires WebP test file)`);
  console.log('');

  // TEST 6: Complete Workflow
  console.log('📸 Test 6: Complete Workflow');
  testReport.completeWorkflow.tested = true;

  try {
    const steps = [];

    // Upload 3 photos
    steps.push('Upload 3 photos');
    for (let i = 0; i < 3; i++) {
      await uploadPhoto(packageId, TEST_PHOTO_PATH, authToken);
    }

    // Delete 1 photo
    steps.push('Delete 1 photo');
    const pkg1 = (await getAllPackages(authToken)).data.find(p => p.id === packageId);
    if (pkg1.photos.length > 0) {
      await deletePhoto(packageId, pkg1.photos[0].filename, authToken);
    }

    // Upload 2 more photos
    steps.push('Upload 2 more photos');
    for (let i = 0; i < 2; i++) {
      await uploadPhoto(packageId, TEST_PHOTO_PATH, authToken);
    }

    // Delete all photos
    steps.push('Delete all photos');
    const pkg2 = (await getAllPackages(authToken)).data.find(p => p.id === packageId);
    for (const photo of pkg2.photos) {
      await deletePhoto(packageId, photo.filename, authToken);
    }

    // Verify empty
    steps.push('Verify empty photos array');
    const pkg3 = (await getAllPackages(authToken)).data.find(p => p.id === packageId);
    const isEmpty = !pkg3.photos || pkg3.photos.length === 0;

    testReport.completeWorkflow.steps = steps;
    if (isEmpty) {
      testReport.completeWorkflow.passed = true;
      console.log(`✅ Complete workflow successful`);
      console.log(`   Steps completed: ${steps.length}`);
      console.log(`   Final photos count: 0`);
    } else {
      testReport.completeWorkflow.issues.push('Photos array not empty after deletion');
    }
  } catch (error) {
    testReport.completeWorkflow.issues.push(`Error: ${error.message}`);
  }
  console.log('');

  return testReport;
}

// Calculate summary
function calculateSummary(report) {
  const tests = [
    report.singleUpload,
    report.multipleUploads,
    report.photoRetrieval,
    report.photoDeletion,
    report.fileFormats.jpg,
    report.fileFormats.png,
    report.completeWorkflow
  ];

  report.summary.totalTests = tests.filter(t => t.tested).length;
  report.summary.passed = tests.filter(t => t.passed).length;
  report.summary.failed = report.summary.totalTests - report.summary.passed;

  // Collect critical issues
  tests.forEach(test => {
    if (test.issues && test.issues.length > 0) {
      report.summary.criticalIssues.push(...test.issues);
    }
  });
}

// Run tests and output report
runTests().then(report => {
  calculateSummary(report);

  console.log('═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log('');

  if (report.summary.criticalIssues.length > 0) {
    console.log('⚠️  CRITICAL ISSUES:');
    report.summary.criticalIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    console.log('');
  }

  // Write detailed report to file
  const reportPath = path.join(__dirname, 'PHOTO_UPLOAD_TEST_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report written to: ${reportPath}`);
  console.log('');

  process.exit(report.summary.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
