#!/usr/bin/env node
import { chromium } from 'playwright';

async function testTheming() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing Multi-Tenant Theming Implementation');

    // Navigate to the app
    console.log('\n1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if CSS variables are applied
    console.log('\n2. Checking CSS custom properties...');
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        primary: styles.getPropertyValue('--color-primary').trim(),
        secondary: styles.getPropertyValue('--color-secondary').trim(),
        maconNavy: styles.getPropertyValue('--macon-navy').trim(),
        maconOrange: styles.getPropertyValue('--macon-orange').trim(),
        maconTeal: styles.getPropertyValue('--macon-teal').trim(),
        background: styles.getPropertyValue('--color-background').trim(),
      };
    });
    console.log('CSS Variables:', cssVars);

    // Take screenshot of home page
    await page.screenshot({ path: 'test-screenshots/01-home-page.png', fullPage: true });
    console.log('📸 Screenshot saved: 01-home-page.png');

    // Navigate to login page
    console.log('\n3. Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/02-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved: 02-login-page.png');

    // Check if login form is visible
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('✅ Login form found');

      // Check if form is auto-filled
      const emailValue = await page.inputValue('input[type="email"]');
      const passwordValue = await page.inputValue('input[type="password"]');
      console.log(`   Email field: ${emailValue}`);
      console.log(`   Password field: ${passwordValue ? '***filled***' : 'empty'}`);

      // Try logging in with correct credentials
      console.log('\n4. Attempting login with admin@elope.com / admin123...');
      await page.fill('input[type="email"]', 'admin@elope.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.screenshot({ path: 'test-screenshots/03-login-filled.png' });
      console.log('📸 Screenshot saved: 03-login-filled.png');

      await page.click('button[type="submit"]');
      console.log('⏳ Waiting for login response...');
      await page.waitForTimeout(3000);

      // Check current URL
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);

      if (currentUrl.includes('/admin/dashboard')) {
        console.log('✅ Login successful! Redirected to admin dashboard');
      } else if (currentUrl.includes('/tenant/dashboard')) {
        console.log('✅ Login successful! Redirected to tenant dashboard');
      } else if (currentUrl.includes('/login')) {
        console.log('❌ Login failed - still on login page');
      }

      await page.screenshot({ path: 'test-screenshots/04-after-login.png', fullPage: true });
      console.log('📸 Screenshot saved: 04-after-login.png');
    } else {
      console.log('❌ Login form not found');
    }

    console.log('\n✅ Theming test complete!');
    console.log('Check test-screenshots/ folder for results');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testTheming();
