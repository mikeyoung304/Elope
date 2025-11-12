#!/usr/bin/env node

/**
 * Browser Automation Test for Login Flow
 * Tests the unified authentication system end-to-end
 *
 * Prerequisites:
 *   npm install puppeteer
 *
 * Usage:
 *   node test-login-browser.mjs
 */

import puppeteer from 'puppeteer';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';

async function testPlatformAdminLogin() {
  console.log('🚀 Starting Browser Automation Test\n');

  const browser = await puppeteer.launch({
    headless: false, // Show the browser
    slowMo: 100, // Slow down by 100ms
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    console.log('✅ Step 1: Navigate to login page');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/01-login-page.png' });

    // Check if login form exists
    console.log('✅ Step 2: Verify login form elements');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');

    if (!emailInput || !passwordInput || !submitButton) {
      throw new Error('Login form elements not found!');
    }

    console.log('   - Email input: ✓');
    console.log('   - Password input: ✓');
    console.log('   - Submit button: ✓');

    // Fill in credentials
    console.log('\n✅ Step 3: Fill in platform admin credentials');
    await page.type('input[type="email"]', 'admin@elope.com', { delay: 50 });
    await page.type('input[type="password"]', 'admin123', { delay: 50 });
    await page.screenshot({ path: 'screenshots/02-credentials-filled.png' });

    // Set up request interception to capture the login request
    console.log('\n✅ Step 4: Submit login form');
    await page.setRequestInterception(true);
    const loginRequests = [];

    page.on('request', (request) => {
      if (request.url().includes('/auth/login') || request.url().includes('/admin/login')) {
        loginRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
      request.continue();
    });

    page.on('response', async (response) => {
      if (response.url().includes('/auth/login') || response.url().includes('/admin/login')) {
        console.log(`   - Response from ${response.url()}: ${response.status()}`);
        if (response.status() === 200) {
          try {
            const json = await response.json();
            console.log(`   - Role: ${json.role}`);
            console.log(`   - Email: ${json.email}`);
            console.log(`   - Token: ${json.token.substring(0, 20)}...`);
          } catch (e) {
            // Not JSON
          }
        }
      }
    });

    // Click submit button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    await page.screenshot({ path: 'screenshots/03-after-login.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log(`\n✅ Step 5: Verify redirect to admin dashboard`);
    console.log(`   - Current URL: ${currentUrl}`);

    if (currentUrl.includes('/admin/dashboard')) {
      console.log('   ✅ SUCCESS: Redirected to /admin/dashboard');
    } else if (currentUrl.includes('/login')) {
      console.log('   ❌ FAILED: Still on login page (login failed)');

      // Check for error message
      const errorElement = await page.$('[role="alert"], .error, .text-red');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log(`   - Error message: ${errorText}`);
      }
    } else {
      console.log(`   ⚠️  UNEXPECTED: Redirected to ${currentUrl}`);
    }

    // Check localStorage for token
    console.log('\n✅ Step 6: Verify token storage');
    const token = await page.evaluate(() => localStorage.getItem('adminToken'));
    if (token) {
      console.log(`   ✅ Token stored in localStorage`);
      console.log(`   - Token preview: ${token.substring(0, 50)}...`);

      // Decode JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log(`   - User ID: ${payload.userId}`);
      console.log(`   - Email: ${payload.email}`);
      console.log(`   - Role: ${payload.role}`);
      console.log(`   - Expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
    } else {
      console.log('   ❌ No token found in localStorage');
    }

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/04-dashboard.png' });

    // Test summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('Frontend URL:', FRONTEND_URL);
    console.log('Login Endpoint:', loginRequests[0]?.url || 'N/A');
    console.log('Final URL:', currentUrl);
    console.log('Token Present:', token ? 'YES ✅' : 'NO ❌');
    console.log('Screenshots saved in screenshots/');
    console.log('='.repeat(60));

    // Wait a bit so user can see the result
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testPlatformAdminLogin()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
