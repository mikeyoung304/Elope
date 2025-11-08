# Developing

## Vibe‑coding workflow (Claude + MCP)

- **Keep changes small.** Run prompts in phases; verify green typecheck after each.
- **Use contracts as the single source of truth.** FE/BE must import from `packages/contracts`.
- **Services own business logic**; adapters isolate external dependencies (Stripe/Postmark/GCal).
- **Prefer mocks while shaping flows**; flip to real when stable.
- **Keep TypeScript errors at zero**; don't suppress diagnostics.

## Multi-Tenant Development Roadmap

This project is implementing multi-tenant self-service capabilities in phases:

- **Phase 1-3**: Core multi-tenant architecture (COMPLETE)
- **Phase 4**: Tenant admin dashboard with branding (COMPLETE - Nov 2024)
- **Phase 5**: Add-on management, photo uploads, email templates (IN PROGRESS)
- **Phase 6**: Content/copy management system (PLANNED)
- **Phase 7**: Cloud storage and media infrastructure (PLANNED)
- **Phase 8+**: Advanced features and marketplace (PLANNED)

**Current Status:** Phase 5.1 backend complete (Package Photos). Frontend UI in progress.

**Latest Commit:** feat(phase-5.1): Implement package photo upload backend (5688741)

**Key Documents:**
- [MULTI_TENANT_ROADMAP.md](./docs/multi-tenant/MULTI_TENANT_ROADMAP.md) - Comprehensive phased roadmap
- [PHASE_5_IMPLEMENTATION_SPEC.md](./docs/phases/PHASE_5_IMPLEMENTATION_SPEC.md) - Technical specs for next phase
- [PHASE_4_TENANT_ADMIN_COMPLETION_REPORT.md](./docs/phases/PHASE_4_TENANT_ADMIN_COMPLETION_REPORT.md) - What was built in Phase 4

**Development Workflow:**
When implementing new tenant-facing features, follow these principles:
1. **Tenant Scoping**: All queries must filter by `tenantId`
2. **Ownership Verification**: Always verify tenant owns the resource before mutations
3. **Multi-Tenant Isolation**: Never leak data between tenants
4. **JWT Authentication**: Use `res.locals.tenantAuth.tenantId` from JWT middleware
5. **Consistent Patterns**: Follow existing tenant-admin route patterns

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

# Security (REQUIRED for real mode)
JWT_SECRET=change-me  # Generate: openssl rand -hex 32
TENANT_SECRETS_ENCRYPTION_KEY=...  # Generate: openssl rand -hex 32

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

## Security Setup ✅ COMPLETE

### Generating Secure Secrets

```bash
# Generate JWT secret (32 bytes)
openssl rand -hex 32

# Generate tenant encryption key (32 bytes)
openssl rand -hex 32

# Add to server/.env
JWT_SECRET=<generated-jwt-secret>
TENANT_SECRETS_ENCRYPTION_KEY=<generated-encryption-key>
```

### Login Rate Limiting

Login endpoints are automatically protected with rate limiting:
- **5 attempts** per 15-minute window per IP address
- Only **failed attempts** count toward the limit
- Returns **429 Too Many Requests** after limit exceeded

**Test the rate limiting:**
```bash
cd server
./test-login-rate-limit.sh
```

### Security Monitoring

Failed login attempts are logged with structured data:
```bash
# View failed login attempts in logs
grep "login_failed" server/logs/*.log

# Monitor for potential attacks
grep "429" server/logs/*.log  # Rate limit hits
```

### Secret Rotation

For production deployments, rotate secrets quarterly:

1. **JWT_SECRET** - Invalidates all active sessions
2. **Stripe Keys** - Rotate via Stripe dashboard
3. **Database Password** - Update via Supabase/provider dashboard
4. **TENANT_SECRETS_ENCRYPTION_KEY** - Requires migration script

**See comprehensive guides:**
- [SECRET_ROTATION_GUIDE.md](./docs/security/SECRET_ROTATION_GUIDE.md) - Complete rotation procedures
- [IMMEDIATE_SECURITY_ACTIONS.md](./docs/security/IMMEDIATE_SECURITY_ACTIONS.md) - Urgent actions checklist
- [SECURITY.md](./docs/security/SECURITY.md) - Security best practices

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
