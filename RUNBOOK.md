# Runbook

## Local dev

```bash
# Mock mode default
pnpm -C apps/api run dev
pnpm -C apps/web run dev
```

### Dev simulators (mock mode only)

- `POST /v1/dev/simulate-checkout-completed` — mark a session as paid
- `GET /v1/dev/debug-state` — inspect in‑memory data

## Switching to real mode

1. Set `ADAPTERS_PRESET=real` and fill real envs.
2. Run Prisma migrations and seed admin.
3. Configure Stripe webhook → `/v1/webhooks/stripe`.
4. Verify Postmark domain and sender.
5. Share Google Calendar with service account.

## Production checks

- **Health endpoints:** `/health` (liveness), `/ready` (DB/keys check)
- **Logging:** pino JSON with requestId
- **Monitoring:** attach Sentry or log drain
