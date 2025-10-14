# Testing

## Strategy

- **Unit (domain):** pure services with fake ports (no HTTP/SDK).
- **Adapter tests:** Stripe/Postmark/GCal thin tests (mock network).
- **HTTP contract tests:** validate req/res via zod from contracts.
- **E2E:** Playwright happy path in mock mode; later one Stripe test.

## Targets

- `availability.service` — busy/booked/blackout cases
- `booking.service` — unique date + refund path; idempotent webhook
- `identity.service` — login success/fail

## Commands

```bash
pnpm -C apps/api run test
pnpm -C apps/api run test:watch
# e2e (optional later)
pnpm -C e2e run test
```
