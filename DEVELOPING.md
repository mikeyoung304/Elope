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
pnpm -C apps/api run dev        # dev (uses mock adapters by default)
pnpm -C apps/api run dev:real   # dev with real database
pnpm -C apps/web run dev
```

## Database Setup (Phase 2.3+)

### Prerequisites

Install PostgreSQL 14+. Options:
- **Local:** `brew install postgresql@16` (macOS) or Docker
- **Cloud:** Railway, Render, Supabase, or Neon

### Initial Setup

1. **Create a database:**
   ```bash
   createdb elope_dev
   ```

2. **Set DATABASE_URL in `apps/api/.env`:**
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/elope_dev?schema=public"
   ```

3. **Run migrations:**
   ```bash
   cd apps/api
   pnpm exec prisma migrate dev
   ```

4. **Seed the database:**
   ```bash
   pnpm exec prisma db seed
   ```
   This creates:
   - Admin user: `admin@example.com` / password: `admin123`
   - 3 wedding packages with add-ons
   - Sample blackout dates

5. **Start API in real mode:**
   ```bash
   pnpm run dev:real
   ```

### Database Commands

```bash
# View data in Prisma Studio
pnpm exec prisma studio

# Generate Prisma Client after schema changes
pnpm exec prisma generate

# Create a new migration
pnpm exec prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
pnpm exec prisma migrate reset

# Check migration status
pnpm exec prisma migrate status
```

## Env presets

```bash
# apps/api
ADAPTERS_PRESET=mock # or real
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=change-me

# real-only (Phase 2.3+)
DATABASE_URL=postgresql://username:password@localhost:5432/elope_dev?schema=public

# real-only (Phase 2.4+ - not yet implemented)
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
