const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to landing page
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take full page screenshot
  await page.screenshot({
    path: 'landing-page-full.png',
    fullPage: true
  });

  // Take viewport screenshot
  await page.screenshot({
    path: 'landing-page-viewport.png'
  });

  console.log('Screenshots saved:');
  console.log('- landing-page-full.png');
  console.log('- landing-page-viewport.png');

  await browser.close();
})();
