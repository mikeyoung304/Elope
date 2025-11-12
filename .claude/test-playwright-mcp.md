# Playwright MCP Test Commands

Use these commands to test the Playwright MCP server after restarting Claude Code.

## Test 1: Basic Navigation and Screenshot

```
Navigate to https://example.com and take a screenshot
```

Expected: Should navigate to example.com and return a screenshot of the page.

---

## Test 2: Navigate to Elope Website

```
Navigate to https://www.elopetomaconga.com and take a screenshot of the homepage
```

Expected: Should load the Elope website and capture a screenshot.

---

## Test 3: Form Field Interaction

```
1. Navigate to https://www.google.com
2. Fill the search field (selector: input[name="q"]) with "Playwright testing"
3. Take a screenshot
```

Expected: Should navigate to Google, enter text in the search field, and capture the result.

---

## Test 4: Button Click Interaction

```
1. Navigate to https://www.google.com
2. Fill the search field with "Playwright"
3. Click the search button or press Enter
4. Wait for the results page to load
5. Take a screenshot of the search results
```

Expected: Should perform a complete search flow and capture the results page.

---

## Test 5: Element Inspection

```
Navigate to https://example.com and get the inner text of the h1 element
```

Expected: Should return "Example Domain" or similar heading text.

---

## Test 6: Page Content Extraction

```
Navigate to https://example.com and evaluate: document.title
```

Expected: Should return "Example Domain".

---

## Test 7: Wait for Selector

```
1. Navigate to https://www.github.com
2. Wait for the main navigation selector to appear
3. Get the inner text of the navigation
```

Expected: Should wait for the page to load and extract navigation text.

---

## Test 8: Complex Workflow Test

```
Test the following workflow on https://www.elopetomaconga.com:
1. Navigate to the homepage
2. Wait for the page to fully load
3. Take a screenshot of the initial state
4. Get the page title
5. Extract the main heading text
6. Take a final screenshot
```

Expected: Should complete all steps and provide screenshots and extracted data.

---

## Verification Checklist

After running tests, verify:

- [ ] MCP server starts without errors
- [ ] Navigation commands work (mcp**playwright**navigate, mcp**playwright**goto)
- [ ] Screenshots are generated (mcp**playwright**screenshot)
- [ ] Form filling works (mcp**playwright**fill)
- [ ] Clicking works (mcp**playwright**click)
- [ ] Text extraction works (mcp**playwright**inner_text)
- [ ] JavaScript evaluation works (mcp**playwright**evaluate)
- [ ] Selector waiting works (mcp**playwright**wait_for_selector)

---

## Troubleshooting

If any test fails:

1. Check MCP server logs in Claude Code
2. Verify all permissions are granted in settings.local.json
3. Ensure Node.js 18+ is installed: `node --version`
4. Try installing Playwright browsers: `npx playwright install`
5. Check that @playwright/mcp package is available: `npx -y @playwright/mcp@latest --help`

---

## Performance Notes

- Browser sessions are ephemeral (don't persist between commands)
- Default browser is Chromium (headless mode)
- Screenshots are saved to temporary locations
- Page load timeouts default to 30 seconds
- Network idle state may be needed for dynamic content

---

## Next Steps After Testing

1. Create automated test scripts for Elope features:
   - User registration flow
   - Login/logout flow
   - Booking creation flow
   - Payment processing flow
   - Profile management flow

2. Integrate with existing test suite
3. Set up visual regression testing
4. Create screenshot baselines for UI components
5. Document common selectors for the Elope application
