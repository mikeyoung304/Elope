Run the comprehensive Elope test suite.

Execute the following test stages in order:

## 1. TypeScript Type Check

Verify all code compiles without type errors:

```bash
cd /Users/mikeyoung/CODING/Elope && npm run typecheck
```

This runs `tsc --noEmit` across all workspaces.

## 2. Unit Tests

Run all unit tests with Vitest:

```bash
cd /Users/mikeyoung/CODING/Elope && npm test
```

This runs the full test suite (44 unit tests expected).

## 3. E2E Tests (Optional)

If the development servers are running, run E2E tests:

```bash
cd /Users/mikeyoung/CODING/Elope && npm run test:e2e
```

This runs the 9 E2E test scenarios.

**Note:** E2E tests require:
- API server running on port 3001
- Client server running on port 5173
- Database available

## 4. Test Coverage Report

Display test coverage summary and identify gaps:

```
📊 Test Coverage Summary:
- Unit tests: 44 passing
- E2E tests: 9 scenarios
- Critical paths: 100% (webhooks, payments)
- Overall coverage: 85%

🎯 Coverage Goals:
- ✅ Webhook processing: 100%
- ✅ Payment flows: 100%
- ✅ Multi-tenant isolation: 100%
- ⚠️  Admin routes: 75% (needs improvement)
```

## Expected Results

All tests should pass before committing code:
- ✅ TypeScript: 0 errors
- ✅ Unit tests: 44/44 passing
- ✅ E2E tests: 9/9 passing (if servers running)

If any tests fail, review the error output and fix before proceeding.
