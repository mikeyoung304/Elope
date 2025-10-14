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

### Health endpoints

**Liveness check** — Always returns 200 OK:
```bash
curl http://localhost:3001/health
# {"ok":true}
```

**Readiness check** — Verifies configuration:
```bash
# Mock mode — always ready
curl http://localhost:3001/ready
# {"ok":true,"mode":"mock"}

# Real mode — checks required env vars
curl http://localhost:3001/ready
# Success: {"ok":true,"mode":"real"}
# Missing keys: {"ok":false,"missing":["DATABASE_URL","STRIPE_SECRET_KEY",...]}
```

If `/ready` returns `ok: false`, check your `.env` file and ensure all required keys are set:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `POSTMARK_SERVER_TOKEN`
- `POSTMARK_FROM_EMAIL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`

### Logging & Monitoring

- **Logging:** pino JSON with `requestId` on every request
- **Monitoring:** attach Sentry or log drain
