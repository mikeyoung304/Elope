#!/usr/bin/env node

/**
 * Test Results Comparison Script
 * Compares before and after test results to show improvement
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function loadJSON(filename) {
  try {
    const filepath = path.join(__dirname, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${filename}:${colors.reset}`, error.message);
    return null;
  }
}

function printHeader(title) {
  console.log('');
  console.log(`${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log('');
}

function printSection(title) {
  console.log('');
  console.log(`${colors.magenta}▶ ${title}${colors.reset}`);
  console.log(`${colors.magenta}${'─'.repeat(70)}${colors.reset}`);
}

function formatPercentage(value) {
  const num = typeof value === 'string' ? parseInt(value) : value;
  if (num >= 90) return `${colors.green}${value}${colors.reset}`;
  if (num >= 70) return `${colors.yellow}${value}${colors.reset}`;
  return `${colors.red}${value}${colors.reset}`;
}

function formatChange(before, after) {
  const diff = after - before;
  if (diff > 0) return `${colors.green}+${diff}${colors.reset}`;
  if (diff < 0) return `${colors.red}${diff}${colors.reset}`;
  return `${colors.blue}${diff}${colors.reset}`;
}

function generateProgressBar(passed, total, width = 20) {
  const percentage = Math.round((passed / total) * 100);
  const filled = Math.round((passed / total) * width);
  const empty = width - filled;

  const color = percentage >= 90 ? colors.green : percentage >= 70 ? colors.yellow : colors.red;
  const bar = color + '█'.repeat(filled) + colors.reset + '░'.repeat(empty);

  return `${bar} ${percentage}% (${passed}/${total})`;
}

function compareResults() {
  printHeader('ERROR HANDLING TEST RESULTS COMPARISON');

  const before = loadJSON('test-results-before-fix.json');
  const after = loadJSON('test-results-comprehensive.json');

  if (!before) {
    console.error(`${colors.red}Cannot load before results${colors.reset}`);
    return;
  }

  if (!after) {
    console.log(`${colors.yellow}After results not yet available.${colors.reset}`);
    console.log(`Run: ${colors.cyan}./test-error-handling-comprehensive.sh${colors.reset}`);
    console.log('');
    console.log('Showing BEFORE results only:');
    console.log('');
    displaySingleResult(before, 'BEFORE FIXES');
    return;
  }

  // Display comparison
  printSection('OVERALL COMPARISON');

  console.log(`${'Metric'.padEnd(25)} ${'Before'.padEnd(15)} ${'After'.padEnd(15)} ${'Change'.padEnd(10)}`);
  console.log('─'.repeat(70));

  const beforePassed = before.summary.passed;
  const beforeTotal = before.summary.totalTests;
  const afterPassed = after.summary.passed;
  const afterTotal = after.summary.totalTests;

  console.log(`${'Tests Passed'.padEnd(25)} ${`${beforePassed}/${beforeTotal}`.padEnd(15)} ${`${afterPassed}/${afterTotal}`.padEnd(15)} ${formatChange(beforePassed, afterPassed)}`);

  const beforeRate = parseInt(before.summary.passRate);
  const afterRate = Math.round((afterPassed / afterTotal) * 100);
  console.log(`${'Pass Rate'.padEnd(25)} ${formatPercentage(beforeRate + '%').padEnd(24)} ${formatPercentage(afterRate + '%').padEnd(24)} ${formatChange(beforeRate, afterRate)}`);

  // Category comparison
  printSection('CATEGORY BREAKDOWN');

  const categories = ['authentication', 'validation', 'authorization', 'notFound', 'fileSize'];
  const categoryNames = {
    authentication: 'Authentication (401)',
    validation: 'Validation (400)',
    authorization: 'Authorization (403)',
    notFound: 'Not Found (404)',
    fileSize: 'File Size (413)',
  };

  console.log('');
  categories.forEach(cat => {
    const catName = categoryNames[cat] || cat;
    const beforeCat = before.categories[cat];
    const afterCat = after.categories[cat];

    console.log(`${colors.blue}${catName}${colors.reset}`);
    console.log(`  Before: ${generateProgressBar(beforeCat.passed, beforeCat.total)}`);
    console.log(`  After:  ${generateProgressBar(afterCat.passed, afterCat.total)}`);
    console.log('');
  });

  // Individual test comparison
  printSection('INDIVIDUAL TEST RESULTS');

  console.log(`${'Test'.padEnd(45)} ${'Before'.padEnd(10)} ${'After'.padEnd(10)}`);
  console.log('─'.repeat(70));

  // Create a map of test results
  const beforeTests = {};
  before.results.forEach(test => {
    beforeTests[test.test] = test;
  });

  after.results.forEach(afterTest => {
    const beforeTest = beforeTests[afterTest.test];
    if (!beforeTest) return;

    const beforeStatus = beforeTest.status === 'PASS' ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const afterStatus = afterTest.status === 'PASS' ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;

    const testName = afterTest.test.substring(0, 43);
    const improvement = beforeTest.status !== 'PASS' && afterTest.status === 'PASS' ? `${colors.green}FIXED${colors.reset}` : '';

    console.log(`${testName.padEnd(45)} ${beforeStatus.padEnd(18)} ${afterStatus.padEnd(18)} ${improvement}`);
  });

  // Summary
  printSection('SUMMARY');

  const fixed = afterPassed - beforePassed;
  const remaining = afterTotal - afterPassed;

  console.log(`${colors.green}✓ Tests Fixed:${colors.reset} ${fixed}`);
  console.log(`${colors.blue}→ Tests Already Passing:${colors.reset} ${beforePassed}`);
  if (remaining > 0) {
    console.log(`${colors.yellow}⚠ Tests Still Failing:${colors.reset} ${remaining}`);
  } else {
    console.log(`${colors.green}🎉 All Tests Passing!${colors.reset}`);
  }

  const improvement = afterRate - beforeRate;
  console.log('');
  console.log(`${colors.cyan}Pass Rate Improvement: ${formatChange(0, improvement)} percentage points${colors.reset}`);
  console.log('');

  if (afterRate >= 90) {
    console.log(`${colors.green}✓ Target achieved! (≥90% pass rate)${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Target: 90% pass rate (currently ${afterRate}%)${colors.reset}`);
  }

  console.log('');
}

function displaySingleResult(results, phase) {
  printSection(`${phase} RESULTS`);

  const passed = results.summary.passed;
  const total = results.summary.totalTests;
  const passRate = typeof results.summary.passRate === 'string'
    ? parseInt(results.summary.passRate)
    : Math.round((passed / total) * 100);

  console.log(`Tests: ${passed}/${total} passing (${formatPercentage(passRate + '%')})`);
  console.log('');
  console.log('Progress:');
  console.log(generateProgressBar(passed, total, 50));
  console.log('');

  // Category breakdown
  printSection('CATEGORY BREAKDOWN');

  const categories = ['authentication', 'validation', 'authorization', 'notFound', 'fileSize'];
  const categoryNames = {
    authentication: 'Authentication (401)',
    validation: 'Validation (400)',
    authorization: 'Authorization (403)',
    notFound: 'Not Found (404)',
    fileSize: 'File Size (413)',
  };

  categories.forEach(cat => {
    if (!results.categories[cat]) return;

    const catName = categoryNames[cat] || cat;
    const catData = results.categories[cat];
    console.log(`${colors.blue}${catName}${colors.reset}`);
    console.log(`  ${generateProgressBar(catData.passed, catData.total)}`);
    console.log('');
  });
}

// Run comparison
compareResults();
