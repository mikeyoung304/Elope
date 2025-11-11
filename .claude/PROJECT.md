# Elope - Multi-Tenant Wedding Booking Platform

## Quick Context
- **Type:** Multi-tenant SaaS with embeddable widgets
- **Phase:** 5.1 (Package Photos Backend Complete)
- **Stack:** Express + React + TypeScript + Prisma + PostgreSQL
- **Critical:** Multi-tenant isolation, Stripe payments, commission calculation

## Documentation Map
- Architecture: [ARCHITECTURE.md](../ARCHITECTURE.md)
- Decisions: [DECISIONS.md](../DECISIONS.md)
- Development: [DEVELOPING.md](../DEVELOPING.md)
- Multi-tenant: [docs/multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md](../docs/multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md)
- Security: [docs/security/SECURITY.md](../docs/security/SECURITY.md)
- Operations: [docs/operations/RUNBOOK.md](../docs/operations/RUNBOOK.md)
- Testing: [TESTING.md](../TESTING.md)
- Environment: [docs/setup/ENVIRONMENT.md](../docs/setup/ENVIRONMENT.md)
- Incidents: [docs/operations/INCIDENT_RESPONSE.md](../docs/operations/INCIDENT_RESPONSE.md)
- API Docs: [docs/api/API_DOCS_QUICKSTART.md](../docs/api/API_DOCS_QUICKSTART.md)

## Critical Patterns (NON-NEGOTIABLE)
1. **Multi-tenant isolation:** ALL queries MUST include tenantId
2. **Commission calculation:** ALWAYS use Math.ceil (round UP)
3. **Webhook idempotency:** Check eventId for duplicates
4. **Cache keys:** MUST include tenantId prefix
5. **Pessimistic locking:** For booking creation (prevent double-booking)

## Common Commands
- Start dev: `npm run dev:all`
- Run tests: `npm test`
- Reset DB: `npx prisma migrate reset`
- Check types: `npm run typecheck`
- Validate env: `npm run doctor`
- Format code: `npm run format`
- Lint: `npm run lint`

## Key Files
- DI Container: `server/src/di.ts`
- Schema: `server/prisma/schema.prisma`
- Contracts: `packages/contracts/src/api.v1.ts`
- Tenant Middleware: `server/src/middleware/tenant.ts`
- Mock Adapters: `server/src/adapters/mock/index.ts`
- Stripe Adapter: `server/src/adapters/stripe.adapter.ts`
- Booking Service: `server/src/services/booking.service.ts`

## Development Modes
- **Mock mode:** `ADAPTERS_PRESET=mock` (no external dependencies)
- **Real mode:** `ADAPTERS_PRESET=real` (Stripe, PostgreSQL, etc.)

## Current Tasks (Phase 5.1 → 5.2)
- ✅ Package photo upload backend
- ✅ Package photo upload UI
- ✅ Unified authentication system
- ⬜ Add-on management UI
- ⬜ Email template customization
- ⬜ Content page editor

## Security Notes
- JWT_SECRET required (32 bytes)
- TENANT_SECRETS_ENCRYPTION_KEY required (32 bytes)
- Rate limiting: 5 login attempts / 15 minutes
- All tenant API keys encrypted with AES-256-GCM

## Testing
- Unit tests: 44 passing
- E2E tests: 9 scenarios
- Coverage goal: 100% for critical paths (webhooks, payments)

## Automated Validation
- Pre-commit hooks validate critical patterns
- Run manually: `.claude/hooks/validate-patterns.sh`
- Checks: multi-tenant isolation, commission calculation, cache keys
