# Developing

## Vibe‑coding workflow (Claude + MCP)

- **Keep changes small.** Run prompts in phases; verify green typecheck after each.
- **Use contracts as the single source of truth.** FE/BE must import from `packages/contracts`.
- **Services own business logic**; adapters isolate external dependencies (Stripe/Postmark/GCal).
- **Prefer mocks while shaping flows**; flip to real when stable.
- **Keep TypeScript errors at zero**; don't suppress diagnostics.

## Commands

```bash
npm run typecheck                 # typecheck all workspaces
npm run lint                      # lint all workspaces
npm run dev:api                   # API server (mock mode by default)
npm run dev:client                # Web client
npm run dev:all                   # Both API + client + Stripe webhook listener
npm test --workspace=server       # Run server tests
```

## Database Setup ✅ COMPLETE

### Prerequisites

Install PostgreSQL 14+. Options:
- **Local:** `brew install postgresql@16` (macOS) or Docker
- **Cloud:** Railway, Render, Supabase, or Neon

### Initial Setup

1. **Create a database:**
   ```bash
   createdb elope_dev
   ```

2. **Set DATABASE_URL in `server/.env`:**
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/elope_dev?schema=public"
   ```

3. **Run migrations:**
   ```bash
   cd server
   npm exec prisma migrate dev
   ```

4. **Seed the database:**
   ```bash
   npm exec prisma db seed
   ```
   This creates:
   - Admin user: `admin@example.com` / password: `admin`
   - 3 wedding packages (Classic, Garden, Luxury) with 4 add-ons
   - Sample blackout date (Dec 25, 2025)

5. **Start API in real mode:**
   ```bash
   npm run dev:api
   # Or set ADAPTERS_PRESET=real in server/.env
   ```

### Database Commands

```bash
# View data in Prisma Studio
cd server && npm exec prisma studio

# Generate Prisma Client after schema changes
cd server && npm run prisma:generate

# Create a new migration
cd server && npm exec prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
cd server && npm exec prisma migrate reset

# Check migration status
cd server && npm exec prisma migrate status
```

## Env presets

```bash
# server/.env
ADAPTERS_PRESET=mock # or real
API_PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-me

# Real mode - Database (✅ IMPLEMENTED)
DATABASE_URL=postgresql://username:password@localhost:5432/elope_dev?schema=public

# Real mode - Stripe (✅ IMPLEMENTED)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=http://localhost:5173/success
STRIPE_CANCEL_URL=http://localhost:5173

# Real mode - Email (✅ IMPLEMENTED with file-sink fallback)
POSTMARK_SERVER_TOKEN=...          # Optional: falls back to file-sink
POSTMARK_FROM_EMAIL=bookings@yourdomain.com

# Real mode - Calendar (✅ IMPLEMENTED with mock fallback)
GOOGLE_CALENDAR_ID=...            # Optional: falls back to mock calendar
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
```

## Repo structure (current)

```
server/                           # Express 4 API
  src/
    routes/*.routes.ts            # HTTP routes (was http/v1/*.http.ts)
    services/*.service.ts         # Business logic (was domains/*/service.ts)
    middleware/                   # Express middleware
    adapters/                     # External integrations (prisma, stripe, postmark, gcal, mock)
    lib/
      core/                       # Config, logger, events, errors
      ports.ts                    # Repository/provider interfaces
      entities.ts                 # Domain entities
      errors.ts                   # Domain errors
    di.ts                         # Dependency injection
    app.ts                        # Express app setup
    index.ts                      # Server entry point
  prisma/                         # Database schema & migrations
  test/                           # Unit & integration tests

client/                           # React 18 + Vite
  src/
    features/{catalog,booking,admin}/  # Feature modules
    pages/                        # Route pages
    ui/                           # Reusable components
    lib/                          # Utilities & API client
    app/                          # App shell

packages/
  contracts/                      # @ts-rest API contracts
  shared/                         # Shared utilities (money, date, result)
```

## Pull requests (solo habit)

- Keep PRs under 300 lines.
- Include: what changed, why, test notes.
- CI must pass typecheck + unit tests.
