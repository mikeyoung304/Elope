# Architecture

## Overview

Elope is a **modular monolith**: one API process with clear service boundaries, a thin HTTP layer, and vendor integrations behind adapters. The front‑end consumes a generated client from the contracts package. Internal events decouple modules without microservices.

## Components

### Frontend

React 18 + Vite, feature‑based (catalog, booking, admin). Uses a generated ts‑rest client and TanStack Query.

### Backend (server/)

- **routes/** — HTTP routes using @ts-rest/express, bound to contracts
- **services/** — Business logic: catalog, booking, availability, identity
- **adapters/** — Prisma repos, Stripe, Postmark, Google Calendar. Also `adapters/mock/` for in‑memory.
- **middleware/** — Auth, error handling, request logging, rate limiting
- **lib/core/** — config (zod‑parsed env), logger, error mapping, event bus
- **lib/ports.ts** — Repository and provider interfaces
- **lib/entities.ts** — Domain entities (Package, AddOn, Booking, Blackout)
- **lib/errors.ts** — Domain-specific errors
- **di.ts** — composition root: choose mock vs real adapters via env and wire services

### Contracts (packages/contracts)

Zod schemas + endpoint definitions (@ts-rest).

### Shared (packages/shared)

DTOs, money/date helpers, small types.

## Service map

- **Catalog** — packages & add‑ons. Uses: `CatalogRepository`.
- **Availability** — `isDateAvailable`: bookings + blackout + Google busy. Uses: `BookingRepository`, `BlackoutRepository`, `CalendarProvider`.
- **Booking** — create checkout, handle payment completion, unique‑per‑date guarantee. Uses: `PaymentProvider`, `BookingRepository`, `EmailProvider`; emits `BookingPaid`, `BookingFailed`.
- **Payments** — abstract payment operations (Stripe adapter in real mode).
- **Notifications** — email templates + sending (Postmark adapter in real mode).
- **Identity** — admin login (bcrypt) + JWT.

## Contracts (v1)

- `GET /v1/packages`
- `GET /v1/packages/:slug`
- `GET /v1/availability?date=YYYY‑MM‑DD`
- `POST /v1/bookings/checkout` → `{ checkoutUrl }`
- `POST /v1/webhooks/stripe` (raw body) — payment completed
- `POST /v1/admin/login` → `{ token }`
- `GET /v1/admin/bookings`
- `GET|POST /v1/admin/blackouts`
- `GET|POST|PATCH|DELETE /v1/admin/packages`
- `POST|PATCH|DELETE /v1/admin/packages/:id/addons`

## Events (in‑proc)

- `BookingPaid { bookingId, eventDate, email, lineItems }`
- `BookingFailed { reason, eventDate, sessionId }`

## Data model (MVP)

- **Package**(id, slug*, name, description, basePrice, active, photoUrl)
- **AddOn**(id, slug*, name, description, price, active, photoUrl?)
- **BlackoutDate**(id, date* [UTC midnight])
- **Booking**(id, customerId, packageId, venueId?, date* [UTC midnight unique], status, totalPrice, notes?)
- **Customer**(id, email*, name, phone?)
- **User**(id, email*, passwordHash, role)

## Backing services

- **Mock mode:** in‑memory repos, console "emails", fake checkout URL.
- **Real mode:** PostgreSQL (Prisma), Stripe Checkout + webhook, Postmark (with file-sink fallback), Google Calendar freeBusy (with mock fallback).

## Migration History

**Phase 1 (2025-10-23)**: Migrated from hexagonal to layered architecture:
- apps/api → server
- apps/web → client
- domains/ → services/
- http/v1/*.http.ts → routes/*.routes.ts
- Consolidated ports/entities/errors into lib/
- pnpm → npm workspaces
- Express 5 → 4, React 19 → 18
