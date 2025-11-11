# Playwright MCP Implementation Guide for Elope

**Author:** Claude Code Analysis
**Date:** November 7, 2025
**Status:** Ready for Implementation

---

## Overview

This guide provides step-by-step instructions to add Playwright MCP (Model Context Protocol) browser automation to the Elope project. This will enable E2E testing, visual verification, and interactive browser debugging directly through Claude Code.

**Estimated Implementation Time:** 30 minutes
**Difficulty Level:** Easy
**Benefits:** High

---

## Part 1: Understanding the Current State

### What We Have

- Playwright test framework already installed (`@playwright/test ^1.56.0`)
- Playwright MCP library already in node_modules
- 4 active MCP servers: filesystem, git, prisma, postgres

### What's Missing

- Playwright MCP server is not exposed/configured
- No browser automation through Claude Code
- Manual E2E testing required

### What We're Adding

- Playwright MCP server configuration
- Browser automation tools via MCP
- Permission rules for safe operations

---

## Part 2: Implementation Steps

### Step 1: Create Playwright MCP Server Wrapper

**File:** Create `/Users/mikeyoung/CODING/Elope/scripts/playwright-mcp-server.js`

```javascript
/**
 * Playwright MCP Server
 *
 * Exposes Playwright's built-in MCP functionality for browser automation
 * through Claude Code and other MCP clients.
 *
 * This wrapper uses the MCP library bundled with @playwright/test
 */

import { createConnection } from 'playwright/lib/mcp/index.js';

/**
 * Main server setup
 */
async function start() {
  try {
    console.log('Starting Playwright MCP server...');

    // Create MCP connection with default Playwright config
    const connection = await createConnection();

    // Start listening for MCP messages
    connection.listen();

    console.log('Playwright MCP server ready');
  } catch (error) {
    console.error('Failed to start Playwright MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Playwright MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down Playwright MCP server...');
  process.exit(0);
});

// Start the server
start();
```

**Why this approach:**

- Uses Playwright's built-in MCP (already in node_modules)
- No extra dependencies needed
- Full control over configuration
- Easy to extend with custom logic

### Step 2: Update MCP Configuration

**File:** `/Users/mikeyoung/CODING/Elope/.mcp.json`

Add the playwright server to the mcpServers object:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/mikeyoung/CODING/Elope"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@cyanheads/git-mcp-server"]
    },
    "prisma": {
      "command": "npx",
      "args": ["-y", "prisma", "mcp"]
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost:5432/elope_dev"
      ]
    },
    "playwright": {
      "command": "node",
      "args": ["./scripts/playwright-mcp-server.js"]
    }
  }
}
```

### Step 3: Update Claude Settings

**File:** `/Users/mikeyoung/CODING/Elope/.claude/settings.local.json`

#### 3a. Add playwright to enabledMcpServers array

Change:

```json
"enabledMcpServers": [
  "filesystem",
  "git",
  "prisma",
  "postgres"
]
```

To:

```json
"enabledMcpServers": [
  "filesystem",
  "git",
  "prisma",
  "postgres",
  "playwright"
]
```

#### 3b. Add Playwright permissions to allow list

In the `permissions.allow` array, add these Playwright permissions:

```json
{
  "permissions": {
    "allow": [
      // ... existing permissions ...

      // Playwright MCP - Core Navigation
      "mcp__playwright__navigate",
      "mcp__playwright__goto",
      "mcp__playwright__back",
      "mcp__playwright__forward",
      "mcp__playwright__reload",
      "mcp__playwright__get_url",
      "mcp__playwright__get_title",

      // Playwright MCP - User Interaction
      "mcp__playwright__click",
      "mcp__playwright__fill",
      "mcp__playwright__fill_multiple",
      "mcp__playwright__select_option",
      "mcp__playwright__type",
      "mcp__playwright__press",
      "mcp__playwright__hover",
      "mcp__playwright__dblclick",
      "mcp__playwright__scroll_into_view_if_needed",

      // Playwright MCP - Content Inspection
      "mcp__playwright__get_content",
      "mcp__playwright__inner_html",
      "mcp__playwright__inner_text",
      "mcp__playwright__get_attribute",
      "mcp__playwright__evaluate",

      // Playwright MCP - Screenshots & Export
      "mcp__playwright__screenshot",
      "mcp__playwright__pdf",

      // Playwright MCP - Forms & Files
      "mcp__playwright__set_input_files",

      // Playwright MCP - Verification (Testing)
      "mcp__playwright__is_checked",
      "mcp__playwright__is_disabled",
      "mcp__playwright__is_editable",
      "mcp__playwright__is_enabled",
      "mcp__playwright__is_hidden",
      "mcp__playwright__is_visible",
      "mcp__playwright__is_focused",

      // Playwright MCP - Waiting & Conditions
      "mcp__playwright__wait_for_navigation",
      "mcp__playwright__wait_for_load_state",
      "mcp__playwright__wait_for_selector",
      "mcp__playwright__wait_for_function",

      // Playwright MCP - Network
      "mcp__playwright__get_network_conditions",
      "mcp__playwright__set_network_conditions",

      // Playwright MCP - Vision (if needed)
      "mcp__playwright__click_by_image",
      "mcp__playwright__mouse_click",
      "mcp__playwright__mouse_scroll"
    ]
  }
}
```

---

## Part 3: Testing the Implementation

### Step 3a: Verify Configuration

Run this command to check if configuration is valid:

```bash
cat /Users/mikeyoung/CODING/Elope/.mcp.json | jq '.'
```

Expected output: Valid JSON with playwright server entry

### Step 3b: Test Playwright MCP Server Start

Try running the server directly:

```bash
node /Users/mikeyoung/CODING/Elope/scripts/playwright-mcp-server.js
```

Expected output: "Playwright MCP server ready"

Press Ctrl+C to stop.

### Step 3c: Test Through Claude Code

Once Claude Code is restarted with the new configuration:

1. Ask Claude to navigate to the Elope website
2. Ask for a screenshot
3. Ask to click a button
4. Ask to fill a form field

Example prompts:

```
Can you navigate to the booking page at http://localhost:3000 and take a screenshot?

Please find the email input field and fill it with test@example.com

Take a screenshot of the current page and describe what you see
```

---

## Part 4: Configuration Files Summary

### File 1: Script

**Location:** `/Users/mikeyoung/CODING/Elope/scripts/playwright-mcp-server.js`
**Status:** ✅ New file
**Size:** ~40 lines

### File 2: MCP Config

**Location:** `/Users/mikeyoung/CODING/Elope/.mcp.json`
**Status:** ⚠️ Modify (add 5 lines)
**Changes:** Add playwright server config

### File 3: Claude Settings

**Location:** `/Users/mikeyoung/CODING/Elope/.claude/settings.local.json`
**Status:** ⚠️ Modify (add ~40 lines)
**Changes:**

1. Add "playwright" to enabledMcpServers
2. Add ~40 permission rules

---

## Part 5: Troubleshooting

### Issue: "playwright/lib/mcp/index.js not found"

**Solution:** Verify Playwright is installed:

```bash
npm ls @playwright/test
```

If missing, install:

```bash
npm install @playwright/test
```

### Issue: MCP server fails to start

**Solution:** Check Node.js version:

```bash
node --version  # Should be >=18
```

### Issue: Permissions denied errors

**Solution:** Ensure permission rules match exactly:

- Check for typos in permission names
- Use lowercase for all permission prefixes
- Format: `mcp__playwright__action_name`

### Issue: Browser won't launch

**Solution:** Playwright needs browser binaries:

```bash
npx playwright install
```

### Issue: Can't connect to local app

**Solution:** Ensure app is running:

```bash
# In one terminal
pnpm run dev

# In another terminal, verify it's running
curl http://localhost:3000
```

---

## Part 6: Advanced Configuration

### Optional: Custom Playwright Config

If you need to customize browser behavior, update the script:

```javascript
const connection = await createConnection({
  headless: true,
  slowMo: 100, // Slow down actions for debugging
  args: ['--no-sandbox'], // For restricted environments
});
```

### Optional: Multiple Browser Support

Add support for Firefox or Safari:

```javascript
const config = {
  browserName: 'chromium', // 'firefox', 'webkit'
  headless: true,
};

const connection = await createConnection(config);
```

### Optional: Proxy Configuration

For testing behind a proxy:

```javascript
const connection = await createConnection({
  proxy: 'http://proxy.example.com:3128',
});
```

---

## Part 7: Usage Examples

### Example 1: Taking a Screenshot

```
Navigate to http://localhost:3000/packages and take a screenshot of the packages section
```

### Example 2: Form Testing

```
1. Go to http://localhost:3000/book
2. Fill the email field with test@example.com
3. Fill the date field with tomorrow's date
4. Take a screenshot to verify the form
5. Click the submit button
```

### Example 3: Element Verification

```
Is the "Book Now" button visible on the homepage?
Take a screenshot and tell me its exact location
```

### Example 4: Content Extraction

```
Get all the text from the wedding packages page and
list the package names and prices
```

### Example 5: Multi-step Flow

```
Simulate the complete booking workflow:
1. Go to homepage
2. Click "View Packages"
3. Select first package
4. Choose a date 7 days from now
5. Fill contact information
6. Take screenshot at each step
7. Describe what the user would see
```

---

## Part 8: Integration with Existing Workflows

### With E2E Testing

After Playwright MCP is running, you can:

- Run `npm run test:e2e` via Bash as before
- Additionally interact with browser manually
- Capture screenshots for visual regression testing
- Debug failing tests by inspecting page state

### With Development

- Take screenshots while developing to verify UI
- Test form interactions without manual clicking
- Verify responsive design at different sizes
- Check accessibility visually

### With Documentation

- Generate screenshots for documentation
- Create visual guides for workflows
- Export PDFs of important pages

---

## Part 9: Next Steps

1. **Implement** (30 minutes)
   - [ ] Create playwright-mcp-server.js
   - [ ] Update .mcp.json
   - [ ] Update settings.local.json
   - [ ] Restart Claude Code

2. **Test** (10 minutes)
   - [ ] Navigate to a page
   - [ ] Take a screenshot
   - [ ] Fill a form
   - [ ] Run an E2E test

3. **Document** (15 minutes)
   - [ ] Add examples to README
   - [ ] Share with team
   - [ ] Document common use cases

4. **Optimize** (ongoing)
   - [ ] Create helper prompts
   - [ ] Build workflow documentation
   - [ ] Gather team feedback

---

## Part 10: Success Checklist

After implementation, verify:

- [ ] Script file created at `scripts/playwright-mcp-server.js`
- [ ] Playwright entry added to `.mcp.json`
- [ ] Playwright added to `enabledMcpServers`
- [ ] Playwright permissions added to settings
- [ ] Claude Code restarted
- [ ] Can navigate to localhost:3000
- [ ] Can take screenshots
- [ ] Can fill form fields
- [ ] Can click buttons
- [ ] Can verify element visibility
- [ ] E2E tests still work via Bash

---

## Support & Troubleshooting

### Get Help

1. Check the full analysis report: `/Users/mikeyoung/CODING/Elope/MCP_ANALYSIS_REPORT.md`
2. Check the quick summary: `/Users/mikeyoung/CODING/Elope/MCP_QUICK_SUMMARY.md`
3. Review Playwright docs: https://playwright.dev
4. Check MCP spec: https://modelcontextprotocol.io

### Debug Output

Enable verbose logging by updating the script:

```javascript
import { createConnection } from 'playwright/lib/mcp/index.js';

async function start() {
  try {
    console.log('Starting Playwright MCP server...');
    console.log('Node version:', process.version);
    console.log('CWD:', process.cwd());

    const connection = await createConnection();
    connection.listen();

    console.log('Playwright MCP server ready and listening');
  } catch (error) {
    console.error('Failed to start Playwright MCP server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

start();
```

---

## Final Notes

- This implementation uses Playwright's built-in MCP, requiring zero additional packages
- The approach is conservative and doesn't modify existing functionality
- All changes are additive (nothing removed or changed)
- Can be easily reverted by removing the playwright entries
- Follows the project's existing MCP configuration patterns

---

**Status:** Ready to implement
**Last Updated:** November 7, 2025
**Maintained by:** Claude Code Analysis
