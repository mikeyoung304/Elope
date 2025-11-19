#!/usr/bin/env node
/**
 * Automated Playwright Diagnostics Suite
 * Tests for the "multiple about:blank pages" issue
 *
 * Usage: node test-playwright-diagnostics.js
 */

const { chromium } = require('playwright');
const { performance } = require('perf_hooks');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class DiagnosticTest {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.passed = false;
    this.duration = 0;
    this.details = '';
    this.pageCount = 0;
    this.contextCount = 0;
  }

  pass(details = '') {
    this.passed = true;
    this.details = details;
  }

  fail(details = '') {
    this.passed = false;
    this.details = details;
  }

  log() {
    const status = this.passed
      ? `${colors.green}✓ PASS${colors.reset}`
      : `${colors.red}✗ FAIL${colors.reset}`;

    console.log(`\n${colors.bright}${this.name}${colors.reset}`);
    console.log(`${colors.cyan}${this.description}${colors.reset}`);
    console.log(`${status} (${this.duration}ms)`);

    if (this.pageCount > 0) {
      console.log(`  Pages created: ${this.pageCount}`);
    }
    if (this.contextCount > 0) {
      console.log(`  Contexts: ${this.contextCount}`);
    }
    if (this.details) {
      console.log(`  ${this.details}`);
    }
  }
}

class PlaywrightDiagnostics {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async run() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Playwright Diagnostics Suite');
    console.log('  Testing for multiple about:blank pages issue');
    console.log('═══════════════════════════════════════════════════════');
    console.log(colors.reset);

    // Run all diagnostic tests
    await this.testProperPattern();
    await this.testImplicitContext();
    await this.testMultipleContextsNoCleanup();
    await this.testContextReuse();
    await this.testMCPPattern();
    await this.testBrowserPoolPattern();
    await this.testMemoryLeak();
    await this.testNavigationSpeed();

    // Print summary
    this.printSummary();

    // Return exit code
    return this.failed === 0 ? 0 : 1;
  }

  async testProperPattern() {
    const test = new DiagnosticTest(
      'Test 1: Proper Pattern (Browser → Context → Page)',
      'Should create exactly 1 page with explicit context'
    );

    const start = performance.now();
    let browser, context;

    try {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext();
      const page = await context.newPage();

      const pages = context.pages();
      test.pageCount = pages.length;
      test.contextCount = 1;
      test.duration = Math.round(performance.now() - start);

      if (pages.length === 1) {
        test.pass(`Perfect! Only 1 page created as expected`);
      } else {
        test.fail(`Expected 1 page, got ${pages.length}`);
      }
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    } finally {
      if (context) await context.close();
      if (browser) await browser.close();
    }

    test.log();
    this.recordResult(test);
  }

  async testImplicitContext() {
    const test = new DiagnosticTest(
      'Test 2: Implicit Context (Browser → Page directly)',
      'Using browser.newPage() without explicit context'
    );

    const start = performance.now();
    let browser;

    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();  // Creates implicit context

      // Get all contexts
      const contexts = browser.contexts();
      const totalPages = contexts.reduce((sum, ctx) => sum + ctx.pages().length, 0);

      test.contextCount = contexts.length;
      test.pageCount = totalPages;
      test.duration = Math.round(performance.now() - start);

      if (totalPages === 1 && contexts.length === 1) {
        test.pass(`Good! Implicit context created 1 page in 1 context`);
      } else {
        test.fail(`Expected 1 context with 1 page, got ${contexts.length} context(s) with ${totalPages} page(s)`);
      }
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    } finally {
      if (browser) await browser.close();
    }

    test.log();
    this.recordResult(test);
  }

  async testMultipleContextsNoCleanup() {
    const test = new DiagnosticTest(
      'Test 3: Multiple Contexts Without Cleanup (Anti-pattern)',
      'Creating multiple contexts without closing - simulates MCP issue'
    );

    const start = performance.now();
    let browser;

    try {
      browser = await chromium.launch({ headless: true });

      // Create 5 contexts without cleanup (simulates MCP requests)
      const contexts = [];
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        await context.newPage();
        contexts.push(context);
      }

      const allContexts = browser.contexts();
      const totalPages = allContexts.reduce((sum, ctx) => sum + ctx.pages().length, 0);

      test.contextCount = allContexts.length;
      test.pageCount = totalPages;
      test.duration = Math.round(performance.now() - start);

      if (totalPages === 5 && allContexts.length === 5) {
        test.fail(`Anti-pattern confirmed: 5 contexts created 5 pages (memory leak!)`);
      } else {
        test.pass(`Unexpected: ${allContexts.length} contexts with ${totalPages} pages`);
      }

      // Cleanup
      for (const ctx of contexts) {
        await ctx.close();
      }
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    } finally {
      if (browser) await browser.close();
    }

    test.log();
    this.recordResult(test);
  }

  async testContextReuse() {
    const test = new DiagnosticTest(
      'Test 4: Context Reuse with Proper Cleanup',
      'Closing old context before creating new one (correct pattern)'
    );

    const start = performance.now();
    let browser, context;

    try {
      browser = await chromium.launch({ headless: true });

      // Simulate 5 requests with proper cleanup
      for (let i = 0; i < 5; i++) {
        if (context) {
          await context.close();
        }
        context = await browser.newContext();
        await context.newPage();
      }

      const allContexts = browser.contexts();
      const totalPages = allContexts.reduce((sum, ctx) => sum + ctx.pages().length, 0);

      test.contextCount = allContexts.length;
      test.pageCount = totalPages;
      test.duration = Math.round(performance.now() - start);

      if (totalPages === 1 && allContexts.length === 1) {
        test.pass(`Excellent! Proper cleanup maintained 1 context with 1 page`);
      } else {
        test.fail(`Expected 1 context with 1 page, got ${allContexts.length} context(s) with ${totalPages} page(s)`);
      }
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    } finally {
      if (context) await context.close();
      if (browser) await browser.close();
    }

    test.log();
    this.recordResult(test);
  }

  async testMCPPattern() {
    const test = new DiagnosticTest(
      'Test 5: MCP Singleton Pattern',
      'Simulates proper MCP server with singleton browser manager'
    );

    const start = performance.now();

    // Simulate MCP Browser Manager
    class MCPBrowserManager {
      constructor() {
        this.browser = null;
        this.context = null;
      }

      async navigate(url) {
        if (this.context) {
          await this.context.close();
          this.context = null;
        }

        if (!this.browser) {
          this.browser = await chromium.launch({ headless: true });
        }

        this.context = await this.browser.newContext();
        const page = await this.context.newPage();
        return page;
      }

      async close() {
        if (this.context) await this.context.close();
        if (this.browser) await this.browser.close();
      }

      getStats() {
        if (!this.browser) return { contexts: 0, pages: 0 };
        const contexts = this.browser.contexts();
        const pages = contexts.reduce((sum, ctx) => sum + ctx.pages().length, 0);
        return { contexts: contexts.length, pages };
      }
    }

    const manager = new MCPBrowserManager();

    try {
      // Simulate 10 MCP requests
      for (let i = 0; i < 10; i++) {
        await manager.navigate('about:blank');
      }

      const stats = manager.getStats();
      test.contextCount = stats.contexts;
      test.pageCount = stats.pages;
      test.duration = Math.round(performance.now() - start);

      if (stats.pages === 1 && stats.contexts === 1) {
        test.pass(`Perfect! MCP pattern maintained 1 context with 1 page across 10 requests`);
      } else {
        test.fail(`Expected 1 context with 1 page, got ${stats.contexts} context(s) with ${stats.pages} page(s)`);
      }

      await manager.close();
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    }

    test.log();
    this.recordResult(test);
  }

  async testBrowserPoolPattern() {
    const test = new DiagnosticTest(
      'Test 6: Browser Pool Pattern',
      'Testing browser pool with context recycling'
    );

    const start = performance.now();

    class SimpleBrowserPool {
      constructor() {
        this.browser = null;
        this.contexts = new Map();
        this.maxContexts = 3;
      }

      async getContext(id) {
        if (this.contexts.has(id)) {
          return this.contexts.get(id);
        }

        if (this.contexts.size >= this.maxContexts) {
          const [oldestId] = this.contexts.keys();
          const oldContext = this.contexts.get(oldestId);
          await oldContext.close();
          this.contexts.delete(oldestId);
        }

        if (!this.browser) {
          this.browser = await chromium.launch({ headless: true });
        }

        const context = await this.browser.newContext();
        this.contexts.set(id, context);
        return context;
      }

      async close() {
        for (const context of this.contexts.values()) {
          await context.close();
        }
        if (this.browser) await this.browser.close();
      }

      getStats() {
        if (!this.browser) return { contexts: 0, pages: 0 };
        const allContexts = this.browser.contexts();
        const pages = allContexts.reduce((sum, ctx) => sum + ctx.pages().length, 0);
        return { contexts: allContexts.length, pages };
      }
    }

    const pool = new SimpleBrowserPool();

    try {
      // Create 5 contexts (should recycle after 3)
      for (let i = 0; i < 5; i++) {
        const context = await pool.getContext(`session-${i}`);
        await context.newPage();
      }

      const stats = pool.getStats();
      test.contextCount = stats.contexts;
      test.pageCount = stats.pages;
      test.duration = Math.round(performance.now() - start);

      if (stats.contexts <= 3 && stats.pages <= 3) {
        test.pass(`Good! Pool limited to ${stats.contexts} contexts with ${stats.pages} pages (max 3)`);
      } else {
        test.fail(`Expected ≤3 contexts with ≤3 pages, got ${stats.contexts} context(s) with ${stats.pages} page(s)`);
      }

      await pool.close();
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    }

    test.log();
    this.recordResult(test);
  }

  async testMemoryLeak() {
    const test = new DiagnosticTest(
      'Test 7: Memory Leak Detection',
      'Check if memory grows with repeated operations'
    );

    const start = performance.now();
    let browser, context;

    try {
      browser = await chromium.launch({ headless: true });

      const memStart = process.memoryUsage().heapUsed / 1024 / 1024;

      // Simulate 20 operations with proper cleanup
      for (let i = 0; i < 20; i++) {
        if (context) await context.close();
        context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('about:blank');
      }

      // Force garbage collection if available
      if (global.gc) global.gc();

      const memEnd = process.memoryUsage().heapUsed / 1024 / 1024;
      const memGrowth = memEnd - memStart;

      test.duration = Math.round(performance.now() - start);
      test.details = `Memory growth: ${memGrowth.toFixed(2)} MB`;

      if (memGrowth < 10) {
        test.pass(`No significant memory leak (${memGrowth.toFixed(2)} MB growth)`);
      } else {
        test.fail(`Potential memory leak detected (${memGrowth.toFixed(2)} MB growth)`);
      }
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    } finally {
      if (context) await context.close();
      if (browser) await browser.close();
    }

    test.log();
    this.recordResult(test);
  }

  async testNavigationSpeed() {
    const test = new DiagnosticTest(
      'Test 8: Navigation Speed Comparison',
      'Compare context reuse vs new browser launch'
    );

    try {
      // Test 1: Reusing context
      const start1 = performance.now();
      const browser1 = await chromium.launch({ headless: true });
      const context1 = await browser1.newContext();

      for (let i = 0; i < 3; i++) {
        const page = await context1.newPage();
        await page.goto('about:blank');
        await page.close();
      }

      const timeReuse = performance.now() - start1;
      await context1.close();
      await browser1.close();

      // Test 2: New browser each time (anti-pattern)
      const start2 = performance.now();

      for (let i = 0; i < 3; i++) {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('about:blank');
        await browser.close();
      }

      const timeNew = performance.now() - start2;

      test.duration = Math.round(timeReuse + timeNew);
      const speedup = (timeNew / timeReuse).toFixed(1);

      test.details = `Context reuse: ${Math.round(timeReuse)}ms | New browser: ${Math.round(timeNew)}ms | ${speedup}x faster`;

      if (timeReuse < timeNew) {
        test.pass(`Context reuse is ${speedup}x faster than new browser`);
      } else {
        test.fail(`Unexpected: context reuse slower than new browser`);
      }
    } catch (error) {
      test.fail(`Error: ${error.message}`);
    }

    test.log();
    this.recordResult(test);
  }

  recordResult(test) {
    this.tests.push(test);
    if (test.passed) {
      this.passed++;
    } else {
      this.failed++;
    }
  }

  printSummary() {
    const total = this.tests.length;
    const passRate = ((this.passed / total) * 100).toFixed(1);

    console.log('\n' + colors.bright + colors.blue);
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Test Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(colors.reset);

    console.log(`\nTotal tests: ${total}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);
    console.log(`Pass rate: ${passRate}%\n`);

    if (this.failed === 0) {
      console.log(colors.green + colors.bright);
      console.log('🎉 All diagnostics passed! Your Playwright setup is healthy.');
      console.log(colors.reset);
    } else {
      console.log(colors.yellow + colors.bright);
      console.log('⚠️  Some diagnostics failed. Review the results above.');
      console.log(colors.reset);

      console.log('\n' + colors.cyan + 'Recommendations:' + colors.reset);
      console.log('1. Always close contexts before creating new ones');
      console.log('2. Use singleton pattern for MCP browser management');
      console.log('3. Implement browser pooling with max limits');
      console.log('4. Avoid mixing built-in fixtures with custom contexts');
      console.log('\nSee PLAYWRIGHT_BLANK_PAGES_DIAGNOSIS.md for detailed solutions.');
    }

    console.log('\n' + colors.blue);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(colors.reset);
  }
}

// Run diagnostics
const diagnostics = new PlaywrightDiagnostics();
diagnostics.run()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error(colors.red + 'Fatal error:', error.message + colors.reset);
    process.exit(1);
  });
