Display all available slash commands for the Elope project.

# Elope Claude Code Commands

## Development Workflow

**`/d`** - Start Development Environment
- Runs environment health check
- Starts API server (port 3001) and Client (port 5173)
- Displays service URLs and quick tips

**`/test`** - Run Test Suite
- TypeScript type checking
- Unit tests (44 tests)
- E2E tests (9 scenarios)
- Coverage reporting

**`/reset`** - Reset Database
- Drops and recreates database
- Runs migrations
- Seeds sample data
- ⚠️  Destructive operation - asks for confirmation

## Code Quality & Safety

**`/check`** - Validate Multi-Tenant Patterns (CRITICAL)
- Checks repository methods for tenantId parameters
- Validates cache key isolation
- Verifies commission calculation (Math.ceil)
- Scans Prisma queries for missing tenantId
- Reports violations with severity levels

**`/help`** - Show This Help
- Lists all available commands
- Shows usage examples

## Project Context Files

- **`.claude/PROJECT.md`** - Quick project overview and documentation map
- **`.claude/PATTERNS.md`** - Critical coding patterns (repository, service, cache, etc.)
- **`.claude/hooks/validate-patterns.sh`** - Pre-commit validation script

## Key Documentation

- **Architecture**: `ARCHITECTURE.md`
- **Development**: `DEVELOPING.md`
- **Multi-tenant Guide**: `docs/multi-tenant/MULTI_TENANT_IMPLEMENTATION_GUIDE.md`
- **Security**: `docs/security/SECURITY.md`
- **Operations**: `docs/operations/RUNBOOK.md`

## Critical Patterns (Non-Negotiable)

1. **Multi-tenant isolation**: ALL queries MUST include `tenantId`
2. **Commission calculation**: ALWAYS use `Math.ceil()` (round UP)
3. **Webhook idempotency**: Check `eventId` for duplicates
4. **Cache keys**: MUST include `${tenantId}:` prefix
5. **Pessimistic locking**: For booking creation (prevent double-booking)

## Common npm Commands

```bash
npm run dev:all       # Start API + Client
npm test              # Run all tests
npm run typecheck     # TypeScript validation
npm run doctor        # Environment health check
npm run format        # Format code with Prettier
npm run lint          # Lint code with ESLint
```

## Quick Tips

- Use `/check` before every commit to prevent multi-tenant violations
- Run `/test` to ensure all tests pass
- Check PROJECT.md for quick project context
- Review PATTERNS.md for coding standards

## Need More Help?

- Read the full documentation in the `docs/` directory
- Review `ARCHITECTURE.md` for system design
- Check `DECISIONS.md` for architectural decision records (ADRs)
- See `DEVELOPING.md` for detailed development workflow
