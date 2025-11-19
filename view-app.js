#!/usr/bin/env node
/**
 * Interactive App Viewer with Playwright
 * Properly manages browser context to avoid blank pages issue
 */

const { chromium } = require('playwright');

async function viewApp() {
  console.log('🚀 Launching browser to view MAIS app...\n');

  let browser, context;

  try {
    // Launch browser (proper pattern)
    browser = await chromium.launch({
      headless: false,  // Show browser for interaction
      slowMo: 100,      // Slow down for visibility
    });

    console.log('✓ Browser launched');

    // Create single context (proper pattern)
    context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
    });

    console.log('✓ Context created');

    // Create single page (proper pattern)
    const page = await context.newPage();
    console.log('✓ Page created');

    // Verify single page
    const pageCount = context.pages().length;
    console.log(`✓ Pages in context: ${pageCount} (should be 1)\n`);

    if (pageCount !== 1) {
      console.warn(`⚠️  WARNING: Expected 1 page, got ${pageCount}!`);
    }

    // Navigate to app
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✓ Page loaded\n');

    // Get page info
    const title = await page.title();
    const url = page.url();

    console.log('📊 Page Information:');
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);
    console.log(`   Viewport: 1400x900\n`);

    // Take screenshot
    await page.screenshot({
      path: 'app-view.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved: app-view.png\n');

    // Extract key page elements
    console.log('🔍 Analyzing page structure...\n');

    // Check for main navigation
    const hasNav = await page.locator('nav').count() > 0;
    console.log(`   Navigation: ${hasNav ? '✓ Found' : '✗ Not found'}`);

    // Check for main content
    const hasMain = await page.locator('main').count() > 0 ||
                    await page.locator('[role="main"]').count() > 0;
    console.log(`   Main content: ${hasMain ? '✓ Found' : '✗ Not found'}`);

    // Check for headings
    const h1Count = await page.locator('h1').count();
    console.log(`   H1 headings: ${h1Count}`);

    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`   First H1: "${h1Text}"`);
    }

    // Check for buttons/CTAs
    const buttonCount = await page.locator('button').count();
    console.log(`   Buttons: ${buttonCount}`);

    // Check for links
    const linkCount = await page.locator('a').count();
    console.log(`   Links: ${linkCount}`);

    // Get visible text content (first 200 chars)
    const bodyText = await page.locator('body').textContent();
    const preview = bodyText.replace(/\s+/g, ' ').trim().substring(0, 200);
    console.log(`\n   Content preview: "${preview}..."\n`);

    console.log('✅ App analysis complete!\n');
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    console.log('Press Ctrl+C to close immediately.\n');

    // Keep browser open for inspection
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    // Proper cleanup (prevents blank page accumulation)
    console.log('\n🧹 Cleaning up...');

    if (context) {
      const finalPageCount = context.pages().length;
      console.log(`   Final page count: ${finalPageCount}`);
      await context.close();
      console.log('   ✓ Context closed');
    }

    if (browser) {
      await browser.close();
      console.log('   ✓ Browser closed');
    }

    console.log('\n✅ Done! No blank pages left behind.\n');
  }
}

// Run viewer
viewApp().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
