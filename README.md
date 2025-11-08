# Elope - Wedding Booking Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-green)](./TESTING.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](./DEVELOPING.md)

> A production-ready, stability-first wedding booking platform for micro-weddings and elopements.

---

## What is Elope?

**Elope** is a modern **multi-tenant SaaS wedding booking platform** designed specifically for small, intimate weddings and elopements. Built with simplicity and reliability at its core, Elope empowers up to 50 independent wedding businesses to manage their bookings, accept payments, and coordinate with customers seamlessly - all with complete data isolation and variable commission rates.

### Key Features

- **Multi-Tenant Architecture** - Support up to 50 independent wedding businesses with complete data isolation
- **Tenant API Keys** - Secure authentication via X-Tenant-Key header (pk_live_slug_xxx format)
- **Variable Commission Rates** - Per-tenant commission rates (10-15%) via Stripe Connect
- **Unified Authentication** - Role-based access control with Platform Admin and Tenant Admin roles
- **Package Photo Upload** - Upload up to 5 photos per package with drag-and-drop UI
- **Online Booking System** - Customers browse packages and book their wedding date in minutes
- **Stripe Payment Integration** - Secure checkout with automatic booking confirmation
- **Availability Management** - Real-time date availability with Google Calendar integration
- **Admin Dashboards** - Separate Platform Admin and Tenant Admin dashboards with full CRUD operations
- **Email Notifications** - Automatic booking confirmations via Postmark
- **Double-Booking Prevention** - Database-level constraints and pessimistic locking
- **Webhook Reliability** - Idempotent webhook processing with automatic retries
- **Security-First** - Login rate limiting, JWT validation, bcrypt hashing, encrypted secrets, structured security logging

### Target Users

- **Platform Administrators** - Manage multiple tenant businesses on one platform
- **Tenant Businesses** - Small wedding venues and elopement services
- **Wedding Professionals** - Photographers, officiants, and coordinators
- **Boutique Planners** - Independent wedding planners with unique packages
- **Destination Coordinators** - Location-specific wedding services

### Business Value

- **Reduce Manual Work**: Automate booking confirmations and calendar management
- **Increase Conversions**: Streamlined checkout process reduces booking abandonment
- **Prevent Errors**: Bulletproof double-booking prevention protects your reputation
- **Scale Confidently**: Built with production-grade architecture from day one
- **Easy Integration**: Embeddable widget installs on any website with 3 lines of code

### Multi-Tenant Self-Service Status

**Current Maturity: Phase 5.1 In Progress (6.5/10)**

Tenant admins currently have self-service access to:
- ✅ **Visual Branding** - Logo, colors, fonts (95% complete)
- ✅ **Package Management** - Full CRUD for service packages (100% complete)
- ✅ **Package Photos Backend** - Photo upload API complete, UI pending (50% complete) **NEW**
- ✅ **Availability Control** - Blackout date management (95% complete)
- ✅ **Admin Dashboard** - Secure 4-tab interface (100% complete)
- ⚠️ **Package Photos Frontend** - Drag-and-drop UI in development (0% complete)
- ❌ **Add-On Management** - Not yet available to tenants (0% complete)
- ❌ **Content Customization** - No copy/messaging control (0% complete)
- ❌ **Email Templates** - Generic platform emails only (0% complete)

**Latest Update (Nov 7, 2025):**
Major release v1.1.0 - Unified authentication, package photo upload, and security enhancements:
- **Unified Auth System**: Single login with role-based routing (Platform/Tenant Admins)
- **Photo Upload**: Complete frontend + backend implementation with drag-and-drop UI
- **Security Fixes**: Login rate limiting, cross-authentication vulnerability patched
- **Dashboards**: New Platform Admin and Tenant Admin dashboards with full CRUD
- **Database**: photos JSON column, user roles, tenant relationships

**Roadmap:** See [MULTI_TENANT_ROADMAP.md](./docs/multi-tenant/MULTI_TENANT_ROADMAP.md) and [CHANGELOG.md](./CHANGELOG.md) for detailed changes.

**Phase 5 Current Sprint (Next 1-2 weeks):**
1. ✅ Package Photo Upload Backend (COMPLETE - Nov 7, 2025)
2. ✅ Package Photo Upload Frontend (COMPLETE - Nov 7, 2025)
3. ✅ Unified Authentication System (COMPLETE - Nov 7, 2025)
4. ⏳ Add-On Management (NEXT)
5. ⏳ Email Template Customization (UPCOMING)

**Goal:** By end of Phase 5, tenants can manage complete service catalogs independently with zero platform admin support for routine operations.

---

## Architecture Philosophy

Elope is built as a **multi-tenant modular monolith** with clear boundaries and production-ready patterns:

- **Simplicity over novelty**: One backend + one frontend; shared types
- **Multi-tenant by design**: Complete data isolation via row-level tenantId scoping
- **Contract-first API**: Type-safe communication via Zod + ts-rest
- **Layered architecture**: Services own business logic; adapters isolate vendors
- **Tenant middleware**: Automatic tenant resolution from X-Tenant-Key header on all public routes
- **Mock-first development**: Build end-to-end with in-memory adapters, then swap to real providers
- **Bulletproof by default**: Strict TypeScript, Zod validation, comprehensive error handling

Learn more: [ARCHITECTURE.md](./ARCHITECTURE.md) | [MULTI_TENANT_IMPLEMENTATION_GUIDE.md](./docs/multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md)

---

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 4 (HTTP server)
- **Language**: TypeScript 5.3 (strict mode)
- **Database**: PostgreSQL 15 (via Supabase)
- **ORM**: Prisma 6 (type-safe queries, migrations)
- **API Contract**: ts-rest + Zod (type-safe API)
- **Payments**: Stripe (checkout + webhooks)
- **Email**: Postmark (with file-sink fallback)
- **Calendar**: Google Calendar API (with mock fallback)
- **Logging**: Pino (structured JSON logging)
- **Testing**: Vitest (unit + integration tests)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 6
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3
- **UI Components**: Radix UI (accessible primitives)
- **State Management**: TanStack Query (server state)
- **Routing**: React Router 7
- **API Client**: ts-rest/core (generated from contracts)

### Infrastructure
- **Database Hosting**: Supabase (PostgreSQL + connection pooling)
- **Monorepo**: npm workspaces (not pnpm)
- **Process Manager**: systemd / PM2 / Docker
- **Deployment**: Docker containers (recommended)

---

## Project Structure

```
elope/
├── server/               # Backend API application
│   ├── src/
│   │   ├── routes/      # HTTP route handlers (Express + ts-rest)
│   │   ├── services/    # Business logic (booking, catalog, availability)
│   │   ├── adapters/    # External integrations (Prisma, Stripe, Postmark)
│   │   ├── middleware/  # Auth, error handling, logging
│   │   └── lib/         # Core utilities (config, logger, errors)
│   ├── prisma/          # Database schema and migrations
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── test/            # Unit and integration tests
│
├── client/              # Frontend web application
│   ├── src/
│   │   ├── pages/       # Route components
│   │   ├── features/    # Feature-based modules (booking, catalog, admin)
│   │   ├── components/  # Reusable UI components
│   │   └── lib/         # Client utilities
│   └── public/          # Static assets
│
├── packages/
│   ├── contracts/       # Shared API contracts (Zod schemas + endpoints)
│   └── shared/          # Shared DTOs and utilities (money, date helpers)
│
└── docs/                # Documentation
    ├── ARCHITECTURE.md
    ├── INCIDENT_RESPONSE.md
    ├── RUNBOOK.md
    └── ...
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Booking    │  │   Catalog    │  │    Admin     │         │
│  │     Flow     │  │   Browser    │  │  Dashboard   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │ ts-rest client (type-safe)
                         │ X-Tenant-Key: pk_live_slug_xxx
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API SERVER (Express)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Tenant Middleware                       │  │
│  │  Validates X-Tenant-Key → Resolves Tenant → Injects ctx  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Routes Layer                         │  │
│  │  /packages  /bookings  /webhooks  /admin  /availability  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Services Layer                          │  │
│  │  CatalogService  BookingService  AvailabilityService      │  │
│  │  IdentityService  NotificationService  CommissionService  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Adapters Layer                          │  │
│  │  PrismaRepos  StripeProvider  PostmarkProvider            │  │
│  │  GoogleCalendar  TenantRepository  (with mock alts)       │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            ▼
        ┌───────────────────────────────────────┐
        │    External Services                  │
        │  • PostgreSQL (Supabase)              │
        │    - Row-level tenant isolation       │
        │  • Stripe (payments + Connect)        │
        │  • Postmark (email delivery)          │
        │  • Google Calendar (availability)     │
        └───────────────────────────────────────┘
```

**Key Design Patterns:**
- **Multi-Tenant Data Isolation**: All database queries scoped by tenantId
- **Tenant Middleware**: Automatic tenant resolution from API keys on all public routes
- **Variable Commission Rates**: Per-tenant commission calculated server-side (10-15%)
- **Dependency Injection**: Services receive adapters via constructor
- **Repository Pattern**: Database access abstracted behind interfaces
- **Event-Driven**: In-process event emitter for cross-service communication
- **Double-Booking Prevention**: Database constraints (tenantId + date) + pessimistic locking + transactions
- **Idempotent Webhooks**: Database-tracked event processing with retry support

---

## Screenshots

> Coming soon: Customer booking flow, admin dashboard, package management

For now, see the development guide: [DEVELOPING.md](./DEVELOPING.md)

---

## Quick Start

### Prerequisites

- **Node.js** 20+ and npm 8+
- **Git** for cloning the repository
- **PostgreSQL** access (Supabase free tier works perfectly)
- **Stripe Account** (free test mode)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/elope.git
cd elope

# 2. Install dependencies
npm install

# 3. Verify your environment
npm run doctor
# This checks that all required dependencies are installed
```

### Option A: Mock Mode (Fastest - No External Services)

Perfect for local development and testing without setting up external services.

```bash
# 1. Start the API (mock mode is default)
npm run dev:api

# 2. In a new terminal, start the web client
npm run dev:client

# 3. Open your browser
# API: http://localhost:3001
# Web: http://localhost:5173
```

**What's mocked:**
- In-memory database (no PostgreSQL needed)
- Fake Stripe checkout (no payment processing)
- Console logging instead of email (no Postmark needed)
- Mock calendar (no Google Calendar needed)

**Test credentials:**
- Admin login: `admin@example.com` / `admin`

### Option B: Real Mode (Production-Like)

Run with actual external services (recommended before production deployment).

```bash
# 1. Create a Supabase project
# - Go to https://supabase.com
# - Create a new project (free tier)
# - Copy your DATABASE_URL from Settings → Database

# 2. Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials:
# - DATABASE_URL (from Supabase)
# - DIRECT_URL (same as DATABASE_URL)
# - STRIPE_SECRET_KEY (from Stripe dashboard)
# - STRIPE_WEBHOOK_SECRET (from Stripe CLI)

# 3. Run database migrations
cd server
npm run prisma:generate
npx prisma migrate deploy
npm run db:seed  # Creates sample data
cd ..

# 4. Start all services (API + Client + Stripe webhooks)
npm run dev:all

# Or start each service separately:
npm run dev:api          # Terminal 1: API server
npm run dev:client       # Terminal 2: Web client
stripe listen --forward-to localhost:3001/v1/webhooks/stripe  # Terminal 3: Webhooks
```

**Setup guides:**
- Database: [SUPABASE.md](./docs/setup/SUPABASE.md)
- Stripe: [RUNBOOK.md § Stripe Local Testing](./docs/operations/RUNBOOK.md#stripe-local-testing)
- Email: [RUNBOOK.md § Email (Postmark)](./docs/operations/RUNBOOK.md#email-postmark)
- Calendar: [RUNBOOK.md § Google Calendar](./docs/operations/RUNBOOK.md#google-calendar-integration)

### Create Your First Tenant

Before you can use the booking system, you need to create a tenant:

```bash
# Create a test tenant (this generates API keys)
cd server
npm run create-tenant -- \
  --name "Bella Weddings" \
  --slug "bella-weddings" \
  --email "hello@bellaweddings.com" \
  --commission 12.5

# Output will show your API keys:
# Public Key: pk_live_bella-weddings_abc123...
# Secret Key: sk_live_bella-weddings_xyz789...
# Save these keys - the secret key is shown only once!
```

### Verify Installation

```bash
# Check API health
curl http://localhost:3001/health
# Expected: {"ok":true}

# Test tenant API (replace with your public key)
curl -H "X-Tenant-Key: pk_live_bella-weddings_abc123..." \
  http://localhost:3001/v1/packages
# Expected: [] (empty array - no packages yet)

# Check configuration
npm run doctor
# Expected: All green checkmarks

# Run tests
npm test
# Expected: All tests passing
```

### What to Do Next

1. **Explore the Admin Dashboard**
   - Visit http://localhost:5173/admin/login
   - Login with `admin@example.com` / `admin`
   - Manage packages, add-ons, and blackout dates

2. **Test the Booking Flow**
   - Visit http://localhost:5173
   - Browse packages
   - Select a date and complete checkout
   - (Mock mode: use any email, no payment needed)
   - (Real mode: use Stripe test card `4242 4242 4242 4242`)

3. **Review the Documentation**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
   - [DEVELOPING.md](./DEVELOPING.md) - Development workflow
   - [TESTING.md](./TESTING.md) - Testing strategy
   - [INCIDENT_RESPONSE.md](./docs/operations/INCIDENT_RESPONSE.md) - Production runbook

### Troubleshooting

**API won't start:**
```bash
# Check if port 3001 is already in use
lsof -i :3001
# Kill the process or change API_PORT in .env

# Check environment configuration
npm run doctor
```

**Database connection errors:**
```bash
# Verify DATABASE_URL is set correctly
echo $DATABASE_URL

# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check Supabase project isn't paused
# Visit: https://supabase.com/dashboard
```

**Stripe webhooks not working:**
```bash
# Verify Stripe CLI is installed and logged in
stripe --version
stripe login

# Check webhook secret matches .env
stripe listen --print-secret
# Copy output to STRIPE_WEBHOOK_SECRET in .env
```

**Client shows API errors:**
```bash
# Verify API is running
curl http://localhost:3001/health

# Check CORS_ORIGIN in server/.env
# Should be: http://localhost:5173

# Clear browser cache and hard reload
```

Still stuck? See [RUNBOOK.md](./docs/operations/RUNBOOK.md) for detailed troubleshooting.

---

## Switching Modes

Toggle between mock and real mode by changing one environment variable:

```bash
# server/.env
ADAPTERS_PRESET=mock  # In-memory, no external services
# or
ADAPTERS_PRESET=real  # PostgreSQL, Stripe, Postmark, Google Calendar
```

**Graceful Fallbacks** (in real mode):
- **Postmark** not configured → Emails written to `server/tmp/emails/`
- **Google Calendar** not configured → All dates show as available (mock)

This allows you to run "real mode" with just database + Stripe, and add email/calendar later.

---

## Embeddable Widget

Elope offers an embeddable booking widget that tenants can add to their existing websites with just a few lines of code.

### Quick Integration Example

```html
<!-- Add this to your website -->
<div id="mais-booking-widget"></div>

<script>
  (function(){
    window.MaisConfig = {
      apiKey: 'pk_live_yourcompany_abc123xyz789',
      container: '#mais-booking-widget'
    };
    var s = document.createElement('script');
    s.src = 'https://widget.mais.com/sdk/mais-sdk.js';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>
```

**Features:**
- Auto-resizing iframe with seamless integration
- Automatic branding from admin dashboard (colors, logo, fonts)
- Both embedded and modal/popup modes
- Event callbacks for analytics integration
- Mobile-responsive design
- Dark mode support

**Learn More:**
- **[WIDGET_INTEGRATION_GUIDE.md](./docs/roadmaps/WIDGET_INTEGRATION_GUIDE.md)** - Complete integration documentation
- **[examples/widget-demo.html](./examples/widget-demo.html)** - Live example with both modes

---

## Documentation

### Getting Started
- **[Quick Start](#quick-start)** - Get up and running in 5 minutes
- **[WIDGET_INTEGRATION_GUIDE.md](./docs/roadmaps/WIDGET_INTEGRATION_GUIDE.md)** - Embed the booking widget on your website
- **[DEVELOPING.md](./DEVELOPING.md)** - Development workflow and conventions
- **[TESTING.md](./TESTING.md)** - Testing strategy and guidelines
- **[API_DOCS_QUICKSTART.md](./docs/api/API_DOCS_QUICKSTART.md)** - Interactive API documentation

### Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, patterns, and data flow
- **[MULTI_TENANT_IMPLEMENTATION_GUIDE.md](./docs/multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md)** - Multi-tenant architecture guide
- **[MULTI_TENANT_ROADMAP.md](./docs/multi-tenant/MULTI_TENANT_ROADMAP.md)** - Phased plan for tenant self-service features
- **[PHASE_5_IMPLEMENTATION_SPEC.md](./docs/phases/PHASE_5_IMPLEMENTATION_SPEC.md)** - Technical specs for Priority 1 features
- **[DECISIONS.md](./DECISIONS.md)** - Architectural Decision Records (ADRs)
- **[SUPABASE.md](./docs/setup/SUPABASE.md)** - Database setup and integration guide

### Operations & Production
- **[RUNBOOK.md](./docs/operations/RUNBOOK.md)** - Operational procedures and local testing
- **[INCIDENT_RESPONSE.md](./docs/operations/INCIDENT_RESPONSE.md)** - Production incident response playbook
- **[ENVIRONMENT.md](./docs/setup/ENVIRONMENT.md)** - Environment variables reference
- **[SECRETS.md](./docs/security/SECRETS.md)** - Secret management and rotation procedures
- **[SECURITY.md](./docs/security/SECURITY.md)** - Security best practices and guardrails
- **[SECRET_ROTATION_GUIDE.md](./docs/security/SECRET_ROTATION_GUIDE.md)** - Complete guide for rotating secrets
- **[IMMEDIATE_SECURITY_ACTIONS.md](./docs/security/IMMEDIATE_SECURITY_ACTIONS.md)** - Urgent security action items

### Migration & Project History
- **[PHASE_1_COMPLETION_REPORT.md](./docs/phases/PHASE_1_COMPLETION_REPORT.md)** - Phase 1: Multi-tenant foundation
- **[PHASE_2B_COMPLETION_REPORT.md](./docs/phases/PHASE_2B_COMPLETION_REPORT.md)** - Phase 2B completion summary

---

## Contributing

We welcome contributions! Before submitting a PR, please:

1. **Read the development guide**: [DEVELOPING.md](./DEVELOPING.md)
2. **Follow the architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Write tests**: See [TESTING.md](./TESTING.md)
4. **Document decisions**: Add ADRs to [DECISIONS.md](./DECISIONS.md) for significant changes
5. **Update docs**: Keep README and related docs in sync with code changes

### Development Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make your changes and test thoroughly
npm run test
npm run typecheck
npm run lint

# 3. Commit with descriptive messages
git commit -m "feat(booking): add double-booking prevention"

# 4. Push and create a pull request
git push origin feature/your-feature-name
```

### Code Style

- **TypeScript**: Strict mode enabled, no implicit any
- **Formatting**: Prettier (run `npm run format`)
- **Linting**: ESLint (run `npm run lint`)
- **Testing**: Vitest for unit/integration tests

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured (use `npm run doctor`)
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Stripe webhook endpoint configured in dashboard
- [ ] Email provider configured (Postmark or use file-sink)
- [ ] Monitoring and alerting set up
- [ ] Backup strategy in place (Supabase auto-backups enabled)
- [ ] SSL/TLS certificates configured
- [ ] Review [INCIDENT_RESPONSE.md](./docs/operations/INCIDENT_RESPONSE.md)

### Docker Deployment

```bash
# Build Docker image
docker build -t elope/api:latest -f server/Dockerfile .

# Run with environment variables
docker run -d \
  --name elope-api \
  --env-file server/.env.production \
  -p 3001:3001 \
  elope/api:latest

# Check health
curl http://localhost:3001/health
```

### Environment-Specific Configs

```bash
# Development
ADAPTERS_PRESET=mock
NODE_ENV=development
LOG_LEVEL=debug

# Staging
ADAPTERS_PRESET=real
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=<staging-db>

# Production
ADAPTERS_PRESET=real
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=<production-db>
```

See [RUNBOOK.md](./docs/operations/RUNBOOK.md) for detailed production operations.

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/elope/issues)
- **Documentation**: All docs in this repository
- **Questions**: Open a discussion in GitHub Discussions

---

## Acknowledgments

Built with modern, production-ready tools:
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [React](https://react.dev/) - UI framework
- [Prisma](https://www.prisma.io/) - Type-safe database ORM
- [Supabase](https://supabase.com/) - PostgreSQL hosting
- [Stripe](https://stripe.com/) - Payment processing
- [ts-rest](https://ts-rest.com/) - Type-safe API contracts
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

**Made with care for small businesses managing intimate weddings and elopements.**
