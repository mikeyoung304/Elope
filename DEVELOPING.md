# Developing

## Vibe‑coding workflow (Claude + MCP)

- **Keep changes small.** Run prompts in phases; verify green typecheck after each.
- **Use contracts as the single source of truth.** FE/BE must import from `packages/contracts`.
- **Domains never import Express/Prisma/Stripe/Postmark**—only their ports.
- **Prefer mocks while shaping flows**; flip to real when stable.
- **Keep TypeScript errors at zero**; don't suppress diagnostics.

## Commands

```bash
pnpm typecheck
pnpm -r build
pnpm -r lint
pnpm -C apps/api run dev
pnpm -C apps/web run dev
```

## Env presets

```bash
# apps/api
ADAPTERS_PRESET=mock # or real
API_PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-me

# real-only
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
POSTMARK_SERVER_TOKEN=...
POSTMARK_FROM_EMAIL=bookings@yourdomain.com
GOOGLE_CALENDAR_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
```

## Repo structure (target)

```
apps/
  api/
    src/http/v1/*.http.ts
    src/domains/*/{entities,service,port,errors}.ts
    src/adapters/{prisma, stripe.adapter.ts, postmark.adapter.ts, gcal.adapter.ts, mock}
    src/core/{events,config,logger,errors}.ts
    src/di.ts
    src/index.ts
  web/
    src/app, ui, lib, features/{catalog,booking,admin}, pages
packages/
  contracts/
  shared/
```

## Pull requests (solo habit)

- Keep PRs under 300 lines.
- Include: what changed, why, test notes.
- CI must pass typecheck + unit tests.
