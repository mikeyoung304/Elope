# Elope (Micro‑Wedding / Elopement Booking)

A stability‑first modular monolith built with TypeScript, pnpm workspaces, contract‑first API, and mock‑first adapters. Goal: ship a clean MVP fast, then swap mocks for real providers (Stripe, Postmark, Google Calendar, Postgres) with minimal code change.

## Core principles

- **Simplicity over novelty.** One backend app + one web app; shared types.
- **Contract‑first FE/BE** via zod + ts‑rest (or OpenAPI).
- **Domains own business logic**; ports/adapters isolate vendors.
- **Mock‑first:** build end‑to‑end with in‑memory adapters, then flip a switch to real.
- **Bulletproof by default:** strict TypeScript, zod validation, error taxonomy, tests.

## High‑level

- `apps/api` → Express + TS, hexagonal (domains/ports/adapters)
- `apps/web` → React + Vite + Tailwind + TanStack Query
- `packages/contracts` → API schemas & endpoints
- `packages/shared` → DTOs & small utils (money/date)

## Quick start

### Mock Mode (No Setup Required)
```bash
pnpm i
pnpm -C apps/api run dev   # API (mock mode)
pnpm -C apps/web run dev   # Web
```

### Real Mode (PostgreSQL + Stripe)
```bash
# 1. Setup PostgreSQL
createdb elope_dev

# 2. Configure environment (see DEVELOPING.md)
cp apps/api/.env.example apps/api/.env
# Edit .env with DATABASE_URL, STRIPE keys, etc.

# 3. Run migrations and seed
cd apps/api
pnpm exec prisma migrate dev
pnpm exec prisma db seed

# 4. Start services
pnpm -C apps/api run dev:real  # API with real adapters
pnpm -C apps/web run dev        # Web
stripe listen --forward-to localhost:3001/v1/webhooks/stripe  # Stripe webhooks
```

## Switching modes

- **Mock:** `ADAPTERS_PRESET=mock` (no external keys required)
- **Real:** `ADAPTERS_PRESET=real` (requires PostgreSQL + Stripe)
  - Postmark email → graceful fallback to file-sink
  - Google Calendar → graceful fallback to mock calendar

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — domains, ports, adapters, contracts
- [DECISIONS/](./DECISIONS/) — architectural decision records (ADRs)
- [DEVELOPING.md](./DEVELOPING.md) — how to work with Claude + MCP, conventions
- [SECURITY.md](./SECURITY.md) — guardrails
- [TESTING.md](./TESTING.md) — unit/e2e plan
- [RUNBOOK.md](./RUNBOOK.md) — prod ops & webhooks
