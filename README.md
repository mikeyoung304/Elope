# Macon AI Solutions - AI-Powered Tenant Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-76%25-yellow)](./TESTING.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](./DEVELOPING.md)

> A production-ready, AI-powered platform for effortless tenant management and property operations.

---

## What is Macon AI Solutions?

**Macon AI Solutions** is a modern **multi-tenant SaaS platform** that uses AI to streamline tenant management, automate property operations, and enhance tenant satisfaction. Built with simplicity and reliability at its core, Macon AI empowers property managers to handle onboarding, communications, and operations seamlessly - all with complete data isolation and intelligent automation.

### Key Features

- **Multi-Tenant Architecture** - Support multiple property management businesses with complete data isolation
- **Tenant API Keys** - Secure authentication via X-Tenant-Key header (pk_live_slug_xxx format)
- **Variable Commission Rates** - Per-tenant commission rates via Stripe Connect
- **Unified Authentication** - Role-based access control with Platform Admin and Tenant Admin roles
- **Property Management** - Full CRUD for properties, leases, and tenant profiles
- **AI-Powered Automation** - Automated lease renewals, rent reminders, and tenant communications
- **Stripe Payment Integration** - Secure rent collection with automatic payment processing
- **Calendar Integration** - Real-time availability management with Google Calendar
- **Admin Dashboards** - Separate Platform Admin and Tenant Admin dashboards with full CRUD operations
- **Smart Notifications** - Automated tenant notifications and support ticket management
- **Data Analytics** - Real-time occupancy tracking, payment monitoring, and tenant satisfaction metrics
- **Webhook Reliability** - Idempotent webhook processing with automatic retries
- **Security-First** - Login rate limiting, JWT validation, bcrypt hashing, encrypted secrets, structured security logging

### Target Users

- **Platform Administrators** - Manage multiple property management businesses on one platform
- **Property Management Companies** - Residential and commercial property managers
- **Real Estate Professionals** - Landlords, leasing agents, and property coordinators
- **Tenant Relations Teams** - Customer service and tenant satisfaction specialists
- **Operations Managers** - Streamline day-to-day property operations

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

**Latest Updates:**

**Sprint 6 (Nov 2025) - Test Stabilization: COMPLETE ✅**
- **60% Pass Rate Achieved**: 62/104 tests passing with 0% variance (zero flaky tests)
- **Infrastructure Improvements**: Fixed connection pool poisoning, eliminated catalog test failures
- **22 Tests Re-enabled**: All with zero test code changes (infrastructure-only fixes)
- **Pattern Discovery**: Identified and resolved "cascading failure" and "flaky test" root causes

**Sprint 4-5 (Oct-Nov 2025):**
- ✅ Cache isolation and HTTP catalog implementation
- ✅ Test suite foundation and integration helper patterns
- ✅ Complete test infrastructure refactoring

**Earlier 2025:**
- ✅ **v1.1.0 Release** (Nov 7): Unified authentication, package photo upload, security enhancements
- ✅ **Sprint 1-3**: Platform foundation, branding endpoint, Stripe refunds, cache audit

**Roadmap:** See [docs/sprints/](./docs/sprints/) for detailed Sprint reports and [CHANGELOG.md](./CHANGELOG.md) for version history.

**Next: Sprint 7 (Target 70% test pass rate)**

---

## Agent-Powered Platform (2025 Transformation)

Starting Sprint 2 (January 2025), Elope is evolving into an **agent-powered, config-driven platform** that enables AI agents to collaborate with human admins in managing tenant configurations.

### What's Changing

**From:** Manual admin updates with hardcoded UI logic
**To:** AI agents propose config changes, admins approve with one click

### Core Capabilities

**🤖 AI Agent Collaboration**

AI agents can analyze tenant context and propose configuration updates:

- **Seasonal Promotions**: "It's January - should we feature winter elopement packages?"
- **Display Optimization**: "Package X has low conversion - try reordering it?"
- **Branding Adjustments**: "Your logo colors could improve accessibility"
- **Content Refinement**: "Package description could highlight your unique value better"

All agent proposals require **human admin approval** via dashboard UI with diff view.

**⚙️ Configuration as Source of Truth**

Every visual and business logic element controlled by versioned config:

- **Branding**: Colors, fonts, logos (migrating from Tenant table to ConfigVersion)
- **Package Display**: Visibility, ordering, featured status, seasonal promotions
- **Display Rules**: Conditional visibility based on date, location, or user context
- **Widget Layout**: Component ordering, feature toggles, customization

**📝 Audit Trail & Rollback**

Every configuration change is tracked with full audit logging:

- **Before/After Snapshots**: See exactly what changed in each update
- **User/Agent Attribution**: Know who or what made each change
- **Timestamps**: Complete change history with millisecond precision
- **One-Click Rollback**: Restore any previous configuration version instantly

**🎨 Preview/Publish Workflow**

Test configuration changes before going live:

```typescript
// Draft mode: Preview changes before publishing
GET /v1/config?versionId=draft_abc123

// Published mode: Live configuration served to production widgets
GET /v1/config (returns latest published version)
```

**🔄 Live Widget Updates**

Embedded widgets automatically fetch configuration at runtime:

- **Zero Redeployment**: Config changes reflect instantly in all embedded widgets
- **PostMessage Hydration**: Parent window can trigger widget refresh
- **Graceful Fallback**: Default theme/layout if config unavailable
- **Tenant Branding**: Each widget automatically styled with tenant's config

### Implementation Roadmap

**Completed Sprints (2025):**

- ✅ **Sprint 1**: Cache leak fix, branding endpoint, Stripe refund logic, cache audit
- ✅ **Sprint 2**: Audit logging system (ConfigChangeLog + AuditService)
- ✅ **Sprint 3**: Type safety improvements and Zod schema additions
- ✅ **Sprint 4**: Cache isolation and HTTP catalog implementation
- ✅ **Sprint 5**: Test suite foundation and integration helper patterns
- ✅ **Sprint 6**: Test stabilization (60% pass rate, 0% variance, infrastructure fixes)

**Sprint 7-8: Continue Test Stabilization (Upcoming)**

- 🎯 **Sprint 7**: Target 70% pass rate (73/104 tests)
  - Fix test logic issues (slug update, concurrent creation)
  - Resolve data contamination patterns
  - Address complex transaction issues (booking tests)
- 🎯 **Sprint 8**: Target 80% pass rate (83/104 tests)
  - Systematic approach to remaining 31 skipped tests
  - Focus on infrastructure improvements over test changes

**Future Sprints: Config Versioning & Agent Interface**

- **Config Versioning Infrastructure**:
  - ConfigVersion database schema (draft/published states)
  - Config versioning API endpoints (create, publish, rollback)
  - Backward compatibility layer with feature flags
  - Widget config hydration via PostMessage

- **Agent Interface**:
  - AgentProposal table (pending/approved/rejected states)
  - Agent API endpoints with rate limiting and authentication
  - Admin proposal review UI with diff view and inline approval
  - Display rules configuration (visibility, ordering, grouping)

### Security & Safety

**Human-in-the-Loop**: All agent proposals require admin approval before publishing

**Rate Limiting**: Agent API endpoints protected against abuse

**Authentication**: Agent API requires secure credentials separate from tenant keys

**Type Safety**: All config validated with Zod schemas before persistence

**Rollback Protection**: Admins can instantly revert bad changes

### Learn More

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Config-driven architecture details
- **[docs/archive/planning/2025-01-analysis/](./docs/archive/planning/2025-01-analysis/)** - Complete planning documentation

**Status**: Sprint 6 complete (60% test pass rate with 0% variance). Sprint 7 planning in progress. Documentation audit complete (Nov 2025).

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
  (function () {
    window.MaisConfig = {
      apiKey: 'pk_live_yourcompany_abc123xyz789',
      container: '#mais-booking-widget',
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
