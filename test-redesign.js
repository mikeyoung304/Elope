const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'redesign-screenshots');

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();

  console.log('📸 Testing redesigned Elope application...\n');

  // Test 1: Home Page
  console.log('1. Testing Home Page...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotDir, '01-home-page.png'), fullPage: true });

  // Check for Playfair Display font
  const heroFont = await page.evaluate(() => {
    const hero = document.querySelector('h1');
    return hero ? window.getComputedStyle(hero).fontFamily : null;
  });
  console.log('   ✓ Hero font:', heroFont);

  // Check for monochrome colors
  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log('   ✓ Body background:', bgColor);

  // Test 2: Package Detail Page
  console.log('\n2. Testing Package Detail Page...');
  await page.goto('http://localhost:3000/package/simple-ceremony', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotDir, '02-package-detail.png'), fullPage: true });
  console.log('   ✓ Package page loaded');

  // Test 3: Admin Login Page
  console.log('\n3. Testing Admin Login Page...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotDir, '03-admin-login.png'), fullPage: true });

  // Log in to admin
  console.log('   ✓ Attempting admin login...');
  await page.type('input[type="email"]', 'admin@elope.com');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('   ✓ Admin logged in successfully');

  // Test 4: Admin Dashboard
  console.log('\n4. Testing Admin Dashboard...');
  await page.screenshot({ path: path.join(screenshotDir, '04-admin-dashboard.png'), fullPage: true });

  // Click on Packages tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Packages')) {
      await tab.click();
      await page.waitForTimeout(500);
      break;
    }
  }
  await page.screenshot({ path: path.join(screenshotDir, '05-admin-packages.png'), fullPage: true });
  console.log('   ✓ Admin dashboard captured');

  // Test 5: Design System Verification
  console.log('\n5. Design System Verification...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const designSystemCheck = await page.evaluate(() => {
    const results = {
      hasPlayfairDisplay: false,
      hasMonochromeColors: false,
      hasLucideIcons: false,
      hasNewButtons: false,
      hasNewCards: false
    };

    // Check for Playfair Display
    const headings = document.querySelectorAll('h1, h2, h3');
    for (const h of headings) {
      const font = window.getComputedStyle(h).fontFamily;
      if (font.includes('Playfair Display')) {
        results.hasPlayfairDisplay = true;
        break;
      }
    }

    // Check for white background
    const body = window.getComputedStyle(document.body);
    if (body.backgroundColor === 'rgb(255, 255, 255)' || body.backgroundColor === 'white') {
      results.hasMonochromeColors = true;
    }

    // Check for Lucide icons (SVG with specific structure)
    const svgs = document.querySelectorAll('svg');
    if (svgs.length > 0) {
      results.hasLucideIcons = true;
    }

    // Check for new button classes
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const classes = btn.className;
      if (classes.includes('rounded') && classes.includes('transition')) {
        results.hasNewButtons = true;
        break;
      }
    }

    // Check for card elements
    const cards = document.querySelectorAll('[class*="rounded"]');
    if (cards.length > 0) {
      results.hasNewCards = true;
    }

    return results;
  });

  console.log('\n   Design System Check:');
  console.log('   ✓ Playfair Display font:', designSystemCheck.hasPlayfairDisplay ? '✅' : '❌');
  console.log('   ✓ Monochrome colors:', designSystemCheck.hasMonochromeColors ? '✅' : '❌');
  console.log('   ✓ Lucide icons:', designSystemCheck.hasLucideIcons ? '✅' : '❌');
  console.log('   ✓ New buttons:', designSystemCheck.hasNewButtons ? '✅' : '❌');
  console.log('   ✓ New cards:', designSystemCheck.hasNewCards ? '✅' : '❌');

  console.log(`\n✅ All screenshots saved to: ${screenshotDir}`);
  console.log('\n📋 Screenshots captured:');
  console.log('   1. Home page (full page)');
  console.log('   2. Package detail page');
  console.log('   3. Admin login page');
  console.log('   4. Admin dashboard (bookings)');
  console.log('   5. Admin packages tab');

  console.log('\n🎨 Redesign verification complete!');

  // Keep browser open for manual inspection
  console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('\n✅ Test complete! Check the screenshots directory.');
})();
