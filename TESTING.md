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
1. API server running on `http://localhost:3001` (mock mode)
2. Web dev server auto-started by Playwright on `http://localhost:5173`

**Note**: Some E2E tests may need environment variable fixes for API URL configuration. See `work-log.md` for details.
