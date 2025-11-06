const puppeteer = require('puppeteer');

(async () => {
  console.log('🎨 Verifying Redesign - Design System Analysis\n');
  console.log('═══════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Comprehensive design system verification
  const analysis = await page.evaluate(() => {
    const results = {
      typography: {},
      colors: {},
      components: {},
      layout: {},
      icons: {}
    };

    // Typography Analysis
    const h1 = document.querySelector('h1');
    if (h1) {
      const h1Styles = window.getComputedStyle(h1);
      results.typography.h1Font = h1Styles.fontFamily;
      results.typography.h1Size = h1Styles.fontSize;
      results.typography.h1Weight = h1Styles.fontWeight;
      results.typography.h1Color = h1Styles.color;
    }

    const bodyStyles = window.getComputedStyle(document.body);
    results.typography.bodyFont = bodyStyles.fontFamily;
    results.typography.bodySize = bodyStyles.fontSize;

    // Color Analysis
    results.colors.background = bodyStyles.backgroundColor;
    results.colors.textColor = bodyStyles.color;

    // Button analysis
    const buttons = document.querySelectorAll('button');
    const buttonColors = new Set();
    buttons.forEach(btn => {
      const btnStyles = window.getComputedStyle(btn);
      buttonColors.add(btnStyles.backgroundColor);
    });
    results.colors.buttonColors = Array.from(buttonColors);

    // Component count
    results.components.buttons = buttons.length;
    results.components.headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    results.components.cards = document.querySelectorAll('[class*="rounded"]').length;
    results.components.links = document.querySelectorAll('a').length;

    // Icon analysis (Lucide icons are SVGs)
    const svgs = document.querySelectorAll('svg');
    results.icons.count = svgs.length;
    results.icons.hasSvgIcons = svgs.length > 0;

    // Layout analysis
    results.layout.hasContainer = !!document.querySelector('[class*="max-w"]');
    results.layout.hasGrid = !!document.querySelector('[class*="grid"]');
    results.layout.hasFlex = !!document.querySelector('[class*="flex"]');

    // Check for old blue/pink colors
    const allElements = document.querySelectorAll('*');
    let hasBlueColors = false;
    let hasPinkColors = false;

    for (const el of allElements) {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      const borderColor = styles.borderColor;

      // Check for blue (rgb values around 37-99, 63-95, 231-239)
      if (
        color.includes('rgb(37, 99, 235)') || // blue-600
        bgColor.includes('rgb(37, 99, 235)') ||
        color.includes('rgb(59, 130, 246)') || // blue-500
        bgColor.includes('rgb(59, 130, 246)')
      ) {
        hasBlueColors = true;
      }

      // Check for pink
      if (
        color.includes('rgb(219, 39, 119)') || // pink-600
        bgColor.includes('rgb(219, 39, 119)')
      ) {
        hasPinkColors = true;
      }
    }

    results.colors.hasOldBlueColors = hasBlueColors;
    results.colors.hasOldPinkColors = hasPinkColors;

    return results;
  });

  // Display results
  console.log('📝 TYPOGRAPHY ANALYSIS');
  console.log('─────────────────────────────────');
  console.log(`  H1 Font:        ${analysis.typography.h1Font}`);
  console.log(`  H1 Size:        ${analysis.typography.h1Size}`);
  console.log(`  H1 Weight:      ${analysis.typography.h1Weight}`);
  console.log(`  H1 Color:       ${analysis.typography.h1Color}`);
  console.log(`  Body Font:      ${analysis.typography.bodyFont}`);
  console.log(`  Body Size:      ${analysis.typography.bodySize}`);

  console.log('\n🎨 COLOR SCHEME ANALYSIS');
  console.log('─────────────────────────────────');
  console.log(`  Background:     ${analysis.colors.background}`);
  console.log(`  Text Color:     ${analysis.colors.textColor}`);
  console.log(`  Button Colors:  ${analysis.colors.buttonColors.join(', ')}`);
  console.log(`  Old Blue:       ${analysis.colors.hasOldBlueColors ? '❌ FOUND' : '✅ REMOVED'}`);
  console.log(`  Old Pink:       ${analysis.colors.hasOldPinkColors ? '❌ FOUND' : '✅ REMOVED'}`);

  console.log('\n🧩 COMPONENT ANALYSIS');
  console.log('─────────────────────────────────');
  console.log(`  Buttons:        ${analysis.components.buttons}`);
  console.log(`  Headings:       ${analysis.components.headings}`);
  console.log(`  Cards:          ${analysis.components.cards}`);
  console.log(`  Links:          ${analysis.components.links}`);

  console.log('\n✨ ICON SYSTEM');
  console.log('─────────────────────────────────');
  console.log(`  SVG Icons:      ${analysis.icons.count}`);
  console.log(`  Lucide Icons:   ${analysis.icons.hasSvgIcons ? '✅ PRESENT' : '❌ MISSING'}`);

  console.log('\n📐 LAYOUT SYSTEM');
  console.log('─────────────────────────────────');
  console.log(`  Container:      ${analysis.layout.hasContainer ? '✅' : '❌'}`);
  console.log(`  Grid Layout:    ${analysis.layout.hasGrid ? '✅' : '❌'}`);
  console.log(`  Flexbox:        ${analysis.layout.hasFlex ? '✅' : '❌'}`);

  // Overall assessment
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 REDESIGN VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════\n');

  const checks = {
    'Playfair Display Font': analysis.typography.h1Font.includes('Playfair Display'),
    'White Background': analysis.colors.background === 'rgb(255, 255, 255)',
    'Black Text': analysis.colors.textColor === 'rgb(0, 0, 0)',
    'No Old Blue Colors': !analysis.colors.hasOldBlueColors,
    'No Old Pink Colors': !analysis.colors.hasOldPinkColors,
    'Lucide Icons Present': analysis.icons.hasSvgIcons,
    'Container Layout': analysis.layout.hasContainer,
    'Grid System': analysis.layout.hasGrid,
  };

  let passed = 0;
  let total = Object.keys(checks).length;

  for (const [check, result] of Object.entries(checks)) {
    console.log(`  ${result ? '✅' : '❌'} ${check}`);
    if (result) passed++;
  }

  console.log(`\n  Score: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);

  if (passed === total) {
    console.log('\n  🎉 PERFECT! All design system checks passed!');
  } else if (passed >= total * 0.8) {
    console.log('\n  ✨ EXCELLENT! Redesign mostly complete.');
  } else {
    console.log('\n  ⚠️  Some checks failed. Review needed.');
  }

  console.log('\n═══════════════════════════════════════════════\n');

  await browser.close();
})();
