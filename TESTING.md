# Testing

## Strategy

- **Unit (domain):** pure services with fake ports (no HTTP/SDK).
- **Adapter tests:** Stripe/Postmark/GCal thin tests (mock network).
- **HTTP contract tests:** validate req/res via zod from contracts.
- **E2E:** Playwright happy path in mock mode; later one Stripe test.

## Implemented Tests

### Unit Tests (44 passing)
- `availability.service` — busy/booked/blackout cases ✅
- `booking.service` — unique date + refund path; idempotent webhook ✅
- `catalog.service` — package/add-on CRUD operations ✅
- `identity.service` — login success/fail ✅

### E2E Tests (7 scenarios)
- **Booking Flow** (2 scenarios):
  - Complete booking journey (homepage → confirmation)
  - Form validation (checkout disabled without required fields)
- **Admin Flow** (5 scenarios):
  - Admin authentication + dashboard
  - Package CRUD operations
  - Blackout date management
  - Bookings table view
  - Logout

## Commands

```bash
# Unit tests
pnpm -C apps/api run test           # Run all unit tests
pnpm -C apps/api run test:watch     # Watch mode
pnpm -C apps/api run coverage       # With coverage

# E2E tests (requires both servers running)
pnpm -C apps/api run dev            # Terminal 1: API server
pnpm test:e2e                       # Terminal 2: Run E2E tests
pnpm test:e2e:ui                    # Interactive UI mode
pnpm test:e2e:headed                # See browser during tests

# Full workspace validation
pnpm -w run typecheck               # TypeScript check
pnpm -r build                       # Build all packages
```

## E2E Test Setup

The E2E test suite uses Playwright and requires:
1. **API server running on `http://localhost:3001` (mock mode)**
2. Web dev server auto-started by Playwright on `http://localhost:5173`

### Prerequisites

Before running E2E tests, ensure the API server is running in mock mode:

```bash
# Terminal 1: Start API server
cd /Users/mikeyoung/CODING/Elope
pnpm -C apps/api run dev
```

### Environment Variables

The E2E tests use environment variables set in `e2e/playwright.config.ts`:
- `VITE_API_URL=http://localhost:3001` - API endpoint
- `VITE_APP_MODE=mock` - Mock mode for testing

These are automatically injected when Playwright starts the web dev server.

### Running Tests

```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Interactive UI mode (recommended for debugging)
pnpm test:e2e:ui

# Headed mode (see browser during tests)
pnpm test:e2e:headed
```

### Test Scenarios

**Booking Flow** (2 tests):
- Complete booking journey from homepage to confirmation
- Form validation (checkout disabled without required fields)

**Admin Flow** (5 tests):
- Admin authentication and dashboard access
- Package CRUD operations
- Blackout date management
- Bookings table view
- Logout functionality

### Troubleshooting

**API Connection Issues**:
- Ensure API server is running on port 3001
- Check no port conflicts: `lsof -i :3001`
- Verify mock mode: API logs should show "🧪 Using MOCK adapters"

**Test Flakiness**:
- Tests use `waitForLoadState('networkidle')` to ensure API calls complete
- If tests timeout, increase timeout in `e2e/playwright.config.ts`
- Use `pnpm test:e2e:headed` to debug visually

**CI/CD**:
- Tests are CI-ready with automatic retries (2 attempts)
- Playwright generates HTML reports on failure
- Screenshots/videos captured on failure
