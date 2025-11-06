const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'lavender-redesign-screenshots');

  // Create screenshots directory
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('🎨 Capturing Lavender Redesign Screenshots...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();

  // Force reload to clear cache
  await page.goto('http://localhost:3000/', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  // Wait for styles to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('1. 📸 Capturing Home Page...');
  await page.screenshot({
    path: path.join(screenshotDir, '01-home-lavender.png'),
    fullPage: true
  });

  // Get actual computed colors
  const colors = await page.evaluate(() => {
    const body = window.getComputedStyle(document.body);
    const h1 = document.querySelector('h1');
    const h1Styles = h1 ? window.getComputedStyle(h1) : null;
    const card = document.querySelector('[class*="rounded"]');
    const cardStyles = card ? window.getComputedStyle(card) : null;

    return {
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      h1Font: h1Styles ? h1Styles.fontFamily : 'N/A',
      h1Color: h1Styles ? h1Styles.color : 'N/A',
      cardBg: cardStyles ? cardStyles.backgroundColor : 'N/A',
      cardBorder: cardStyles ? cardStyles.borderColor : 'N/A'
    };
  });

  console.log('\n🎨 Current Color Scheme:');
  console.log('  Body Background:', colors.bodyBg);
  console.log('  Body Text:', colors.bodyColor);
  console.log('  H1 Font:', colors.h1Font);
  console.log('  H1 Color:', colors.h1Color);
  console.log('  Card Background:', colors.cardBg);
  console.log('  Card Border:', colors.cardBorder);

  console.log('\n2. 📸 Capturing Package Detail...');
  await page.goto('http://localhost:3000/package/simple-ceremony', {
    waitUntil: 'networkidle0'
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.screenshot({
    path: path.join(screenshotDir, '02-package-lavender.png'),
    fullPage: true
  });

  console.log('3. 📸 Capturing Admin Login...');
  await page.goto('http://localhost:3000/admin/login', {
    waitUntil: 'networkidle0'
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.screenshot({
    path: path.join(screenshotDir, '03-admin-login-lavender.png'),
    fullPage: true
  });

  console.log('\n✅ Screenshots saved to:', screenshotDir);
  console.log('\n📋 Files created:');
  console.log('   - 01-home-lavender.png');
  console.log('   - 02-package-lavender.png');
  console.log('   - 03-admin-login-lavender.png');

  console.log('\n⏳ Keeping browser open for 15 seconds...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 15000));

  await browser.close();
  console.log('\n✨ Complete!');
})();
