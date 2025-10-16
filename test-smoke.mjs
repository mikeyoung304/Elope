#!/usr/bin/env node
/**
 * Comprehensive smoke test using Puppeteer
 * Tests all investor demo features
 */

import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';

const API_URL = 'http://localhost:3001';
const WEB_URL = 'http://localhost:5173';

async function runSmokeTest() {
  console.log('🚀 Starting comprehensive Puppeteer smoke test...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const results = {
    passed: [],
    failed: [],
    screenshots: []
  };

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => console.log('  [Browser Console]:', msg.text()));
    page.on('pageerror', err => console.error('  [Browser Error]:', err.message));

    // ============================================
    // TEST 1: Homepage Hero Section
    // ============================================
    console.log('📄 TEST 1: Homepage Hero Section');
    await page.goto(WEB_URL, { waitUntil: 'networkidle0' });

    // Check hero headline
    const heroText = await page.$eval('h1', el => el.textContent);
    if (heroText.includes('Your Perfect Day, Simplified')) {
      console.log('  ✅ Hero headline found');
      results.passed.push('Hero headline');
    } else {
      console.log('  ❌ Hero headline not found');
      results.failed.push('Hero headline');
    }

    // Check statistics
    const stats = await page.$$eval('.text-4xl.font-bold', els => els.map(el => el.textContent));
    if (stats.includes('500+') && stats.includes('24hr') && stats.includes('100%')) {
      console.log('  ✅ Statistics displayed (500+, 24hr, 100%)');
      results.passed.push('Statistics');
    } else {
      console.log('  ❌ Statistics not found:', stats);
      results.failed.push('Statistics');
    }

    await page.screenshot({ path: 'screenshots/01-hero.png', fullPage: false });
    results.screenshots.push('01-hero.png');
    console.log('  📸 Screenshot saved: 01-hero.png\n');

    // ============================================
    // TEST 2: Packages Section
    // ============================================
    console.log('📦 TEST 2: Packages Section');
    await page.evaluate(() => {
      document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const packageCards = await page.$$('.grid.grid-cols-1.md\\:grid-cols-2 > *');
    console.log(`  Found ${packageCards.length} package cards`);

    if (packageCards.length >= 6) {
      console.log('  ✅ 6 packages displayed');
      results.passed.push('Package count');
    } else {
      console.log(`  ❌ Expected 6 packages, found ${packageCards.length}`);
      results.failed.push('Package count');
    }

    // Check package images
    const images = await page.$$eval('img[src*="unsplash"]', imgs => imgs.length);
    console.log(`  Found ${images} Unsplash images`);
    if (images >= 6) {
      console.log('  ✅ Unsplash images loaded');
      results.passed.push('Package images');
    } else {
      console.log(`  ❌ Expected at least 6 images, found ${images}`);
      results.failed.push('Package images');
    }

    await page.screenshot({ path: 'screenshots/02-packages.png', fullPage: false });
    results.screenshots.push('02-packages.png');
    console.log('  📸 Screenshot saved: 02-packages.png\n');

    // ============================================
    // TEST 3: Testimonials Section
    // ============================================
    console.log('💬 TEST 3: Testimonials Section');
    await page.evaluate(() => {
      const testimonials = document.querySelector('h2')?.parentElement?.parentElement;
      if (testimonials?.textContent?.includes('What Our Couples Say')) {
        testimonials.scrollIntoView({ behavior: 'smooth' });
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const testimonialText = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2'))
        .find(el => el.textContent?.includes('What Our Couples Say'));
      return h2 ? 'found' : 'not found';
    });

    if (testimonialText === 'found') {
      console.log('  ✅ Testimonials section found');
      results.passed.push('Testimonials section');
    } else {
      console.log('  ❌ Testimonials section not found');
      results.failed.push('Testimonials section');
    }

    await page.screenshot({ path: 'screenshots/03-testimonials.png', fullPage: false });
    results.screenshots.push('03-testimonials.png');
    console.log('  📸 Screenshot saved: 03-testimonials.png\n');

    // ============================================
    // TEST 4: Package Detail Page
    // ============================================
    console.log('🎯 TEST 4: Package Detail Page');

    // Click on the first package card
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 500));

    const firstPackageLink = await page.$('a[href^="/package/"]');
    if (firstPackageLink) {
      await firstPackageLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      console.log('  ✅ Navigated to package detail page');
      results.passed.push('Package navigation');

      // Check customer form fields
      const nameInput = await page.$('input#coupleName');
      const emailInput = await page.$('input#email');

      if (nameInput && emailInput) {
        console.log('  ✅ Customer info form found (name + email)');
        results.passed.push('Customer form');

        // Fill out the form
        await page.type('#coupleName', 'John & Jane Doe');
        await page.type('#email', 'test@example.com');
        console.log('  ✅ Filled out customer form');
        results.passed.push('Form input');
      } else {
        console.log('  ❌ Customer form fields not found');
        results.failed.push('Customer form');
      }

      await page.screenshot({ path: 'screenshots/04-package-detail.png', fullPage: true });
      results.screenshots.push('04-package-detail.png');
      console.log('  📸 Screenshot saved: 04-package-detail.png\n');
    } else {
      console.log('  ❌ Could not find package link');
      results.failed.push('Package navigation');
    }

    // ============================================
    // TEST 5: Date Picker
    // ============================================
    console.log('📅 TEST 5: Date Picker');
    const datePickerText = await page.evaluate(() => {
      const text = document.body.textContent;
      return text?.includes('Select a date for your ceremony') ? 'found' : 'not found';
    });

    if (datePickerText === 'found') {
      console.log('  ✅ Date picker with availability text found');
      results.passed.push('Date picker');
    } else {
      console.log('  ❌ Date picker text not found');
      results.failed.push('Date picker');
    }

    // ============================================
    // TEST 6: Admin Login
    // ============================================
    console.log('🔐 TEST 6: Admin Login');
    await page.goto(`${WEB_URL}/admin/login`, { waitUntil: 'networkidle0' });

    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');

    if (emailField && passwordField) {
      await page.type('input[type="email"]', 'admin@elope.com');
      await page.type('input[type="password"]', 'admin123');

      await page.screenshot({ path: 'screenshots/05-admin-login.png' });
      results.screenshots.push('05-admin-login.png');

      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('  ✅ Login form submitted');
        results.passed.push('Admin login');
      }
    } else {
      console.log('  ❌ Login form fields not found');
      results.failed.push('Admin login');
    }

    // ============================================
    // TEST 7: Admin Dashboard Metrics
    // ============================================
    console.log('📊 TEST 7: Admin Dashboard');
    const metricsText = await page.evaluate(() => document.body.textContent);

    const hasMetrics = metricsText.includes('Total Bookings') &&
                       metricsText.includes('Total Revenue') &&
                       metricsText.includes('Avg Booking Value');

    if (hasMetrics) {
      console.log('  ✅ Dashboard metrics found (Bookings, Revenue, Avg Value)');
      results.passed.push('Dashboard metrics');
    } else {
      console.log('  ❌ Dashboard metrics not found');
      results.failed.push('Dashboard metrics');
    }

    await page.screenshot({ path: 'screenshots/06-admin-dashboard.png', fullPage: true });
    results.screenshots.push('06-admin-dashboard.png');
    console.log('  📸 Screenshot saved: 06-admin-dashboard.png\n');

    // ============================================
    // TEST 8: Footer
    // ============================================
    console.log('🔗 TEST 8: Footer');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 500));

    const footerText = await page.evaluate(() => document.body.textContent);
    const hasFooter = footerText.includes('hello@elope.com') && footerText.includes('2025 Elope');

    if (hasFooter) {
      console.log('  ✅ Professional footer found with contact info');
      results.passed.push('Footer');
    } else {
      console.log('  ❌ Footer content not found');
      results.failed.push('Footer');
    }

    await page.screenshot({ path: 'screenshots/07-footer.png', fullPage: false });
    results.screenshots.push('07-footer.png');
    console.log('  📸 Screenshot saved: 07-footer.png\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    results.failed.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📋 SMOKE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📸 Screenshots: ${results.screenshots.length}`);
  console.log('='.repeat(60));

  if (results.passed.length > 0) {
    console.log('\n✅ Passed Tests:');
    results.passed.forEach(test => console.log(`  - ${test}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`  - ${test}`));
  }

  console.log('\n📸 Screenshots saved in ./screenshots/');
  console.log('='.repeat(60));

  // Save results to JSON
  await writeFile('test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Test results saved to test-results.json');

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the test
runSmokeTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
