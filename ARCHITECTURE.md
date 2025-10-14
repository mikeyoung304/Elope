# Architecture

## Overview

Elope is a **modular monolith**: one API process with clear domain boundaries, a thin HTTP layer, and vendor integrations behind ports/adapters. The front‑end consumes a generated client from the contracts package. Internal events decouple modules without microservices.

## Components

### Frontend

React 19 + Vite, feature‑based (catalog, booking, admin). Uses a generated ts‑rest client and TanStack Query.

### Backend (apps/api)

- **http/** — controllers bound to contracts (@ts-rest/express), no business logic.
- **domains/** — pure TS: entities, services, ports, errors.
- **adapters/** — Prisma repos, Stripe, Postmark, Google Calendar, Storage. Also `adapters/mock/` for in‑memory.
- **core/** — config (zod‑parsed env), logger, error mapping, event bus.
- **di.ts** — composition root: choose mock vs real adapters via env and wire services.

### Contracts (packages/contracts)

Zod schemas + endpoint definitions.

### Shared (packages/shared)

DTOs, money/date helpers, small types.

## Domain map

- **Catalog** — packages & add‑ons. Port: `CatalogRepo`.
- **Availability** — `isDateAvailable`: bookings + blackout + Google busy. Ports: `BookingRepo`, `BlackoutRepo`, `CalendarPort`.
- **Booking** — create checkout, handle payment completion, unique‑per‑date guarantee. Ports: `PaymentPort`, `BookingRepo`, `MailPort`; emits `BookingPaid`, `BookingFailed`.
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

## Events (in‑proc)

- `BookingPaid { bookingId, eventDate, email, lineItems }`
- `BookingFailed { reason, eventDate, sessionId }`

## Data model (MVP)

- **Package**(id, slug*, title, description, priceCents, photoUrl)
- **AddOn**(id, packageId, title, priceCents, photoUrl?)
- **BlackoutDate**(id, date* [UTC midnight])
- **Booking**(id, packageId, coupleName, email, phone?, eventDate* [UTC midnight unique], addOnIds[], totalCents, status, stripeSession*)
- **AdminUser**(id, email*, passwordHash)

## Backing services

- **Mock mode:** in‑memory repos, console "emails", fake checkout URL.
- **Real mode:** Postgres (Prisma), Stripe Checkout + webhook, Postmark, Google Calendar freeBusy.
