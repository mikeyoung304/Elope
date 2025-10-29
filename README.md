# Elope (Micro‑Wedding / Elopement Booking)

A stability‑first modular monolith built with TypeScript, npm workspaces, contract‑first API, and mock‑first adapters. Goal: ship a clean MVP fast, then swap mocks for real providers (Stripe, Postmark, Google Calendar, Postgres) with minimal code change.

## Core principles

- **Simplicity over novelty.** One backend app + one web app; shared types.
- **Contract‑first FE/BE** via zod + ts‑rest (or OpenAPI).
- **Layered architecture:** services own business logic; adapters isolate vendors.
- **Mock‑first:** build end‑to‑end with in‑memory adapters, then flip a switch to real.
- **Bulletproof by default:** strict TypeScript, zod validation, error taxonomy, tests.

## High‑level

- `server/` → Express 4 + TS, layered (routes/services/adapters)
- `client/` → React 18 + Vite + Tailwind + TanStack Query
- `packages/contracts` → API schemas & endpoints
- `packages/shared` → DTOs & small utils (money/date)

## Quick start

### Mock Mode (No Setup Required)
```bash
npm install
npm run dev:api     # API (mock mode)
npm run dev:client  # Web
```

### Real Mode (Supabase + Stripe)
```bash
# 1. Setup Supabase (see SUPABASE.md for details)
# - Create project at https://supabase.com
# - Run schema via SQL Editor: server/prisma/migrations/00_supabase_reset.sql
# - Run seed via SQL Editor: server/prisma/seed.sql

# 2. Configure environment (see DEVELOPING.md)
cp server/.env.example server/.env
# Edit .env with Supabase DATABASE_URL, STRIPE keys, etc.

# 3. Generate Prisma client
cd server
npm run prisma:generate

# 4. Start services
npm run dev:api    # API with real adapters (or use npm run dev:all)
npm run dev:client # Web
stripe listen --forward-to localhost:3001/v1/webhooks/stripe  # Stripe webhooks
```

## Switching modes

- **Mock:** `ADAPTERS_PRESET=mock` (no external keys required)
- **Real:** `ADAPTERS_PRESET=real` (requires Supabase + Stripe)
  - Postmark email → graceful fallback to file-sink
  - Google Calendar → graceful fallback to mock calendar

## Docs

- [DECISIONS.md](./DECISIONS.md) — **NEW:** Architectural decision records (ADRs)
- [SUPABASE.md](./SUPABASE.md) — Supabase integration guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) — domains, ports, adapters, contracts, concurrency control
- [PHASE_2B_COMPLETION_REPORT.md](./PHASE_2B_COMPLETION_REPORT.md) — **NEW:** Phase 2B completion summary
- [DEVELOPING.md](./DEVELOPING.md) — how to work with Claude + MCP, conventions
- [ENVIRONMENT.md](./ENVIRONMENT.md) — environment variables reference
- [SECRETS.md](./SECRETS.md) — **UPDATED:** Secret rotation & git history sanitization
- [SECURITY.md](./SECURITY.md) — guardrails
- [TESTING.md](./TESTING.md) — unit/e2e plan
- [RUNBOOK.md](./RUNBOOK.md) — prod ops & webhooks
