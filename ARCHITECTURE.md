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

## Concurrency Control

### Double-Booking Prevention

The platform uses a **three-layer defense** against double-booking (mission-critical for wedding business):

**Layer 1: Database Unique Constraint**
```prisma
model Booking {
  date DateTime @unique  // Enforces one booking per date
}
```
Primary defense: PostgreSQL ensures only one booking per date at database level.

**Layer 2: Pessimistic Locking**
```typescript
await prisma.$transaction(async (tx) => {
  // SELECT FOR UPDATE locks the row (or absence of row)
  const booking = await tx.$queryRaw`
    SELECT id FROM bookings
    WHERE date = ${new Date(date)}
    FOR UPDATE
  `;

  if (booking.length > 0) {
    throw new BookingConflictError(date);
  }

  // Create booking within same transaction
  await tx.booking.create({ data: { date, ... } });
});
```
Application-level defense: First request acquires lock, second request waits. See **DECISIONS.md ADR-001** for rationale.

**Layer 3: Graceful Error Handling**
```typescript
try {
  await bookingRepo.create(booking);
} catch (error) {
  if (error.code === 'P2002') {  // Unique constraint violation
    throw new BookingConflictError(date);
  }
}
```
Fallback defense: If both layers fail, catch Prisma error and convert to domain error.

### Race Condition Handling

**Problem:** Two users can both pass availability check, then both attempt booking.

**Solution:** Wrap availability check + booking creation in database transaction with row-level lock.

**Files:**
- `server/src/services/availability.service.ts` - Transaction-aware availability check
- `server/src/services/booking.service.ts` - Transaction wrapper
- `server/src/adapters/prisma/booking.repository.ts` - Transaction support

**See Also:** DECISIONS.md ADR-001 (Pessimistic Locking), IMPROVEMENT-ROADMAP.md P0-3

## Webhook Processing

### Idempotency Strategy

**Problem:** Stripe retries webhooks on failure. Duplicate webhooks could create duplicate bookings.

**Solution:** Database-based webhook event tracking with idempotency checks.

```prisma
model WebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique  // Stripe event ID
  eventType   String
  payload     Json
  status      String   // "pending", "processed", "failed"
  attempts    Int      @default(0)
  lastError   String?
  processedAt DateTime?
  createdAt   DateTime @default(now())

  @@index([status, createdAt])
}
```

**Webhook Handler Flow:**
1. Verify Stripe webhook signature (prevent fraud)
2. Store webhook event in database (with `eventId` unique constraint)
3. Check if already processed (idempotency)
4. Process webhook (create booking)
5. Mark as processed or failed
6. Return 200 (success) or 500 (retry)

**Error Handling:**
- Return 500 on failure → triggers Stripe retry
- Store error message in `lastError` for debugging
- Failed webhooks remain in database for manual recovery

**Files:**
- `server/src/routes/webhooks.routes.ts` - Webhook handler with DLQ logic
- `server/prisma/schema.prisma` - WebhookEvent model
- `server/src/adapters/prisma/webhook.repository.ts` - Webhook persistence

**See Also:** DECISIONS.md ADR-002 (Webhook DLQ), DECISIONS.md ADR-004 (Test Coverage)

### Transaction Safety

**BookingService.onPaymentCompleted()** uses transactions to ensure atomicity:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Check availability WITH lock
  const isAvailable = await availabilityService.isDateAvailableWithLock(date, tx);
  if (!isAvailable) throw new BookingConflictError(date);

  // 2. Create booking (within same transaction)
  await bookingRepo.createWithTransaction(booking, tx);

  // 3. Emit event for email notification
  eventEmitter.emit('BookingPaid', { ... });
});
```

**Guarantees:**
- Availability check and booking creation are atomic
- If either fails, entire transaction rolls back
- No partial state (booking created but date unavailable)

**See Also:** DECISIONS.md ADR-001 (Pessimistic Locking)

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
- **Real mode:**
  - **Database:** Supabase PostgreSQL with Prisma ORM (connection pooling, automatic backups)
  - **Payments:** Stripe Checkout + webhook signature verification
  - **Email:** Postmark (with file-sink fallback if token not configured)
  - **Calendar:** Google Calendar freeBusy API (with mock fallback if credentials not configured)

See `SUPABASE.md` for database setup details.
See `DECISIONS.md` for architectural decision records (ADRs) explaining key design choices.

## Migration History

**Phase 2B (2025-10-29)**: Integrated Supabase as production database:
- Added `directUrl` to Prisma schema for migration support
- Deployed schema with critical constraints (`Booking.date @unique`, `Payment.processorId @unique`)
- Configured connection pooling via Supabase
- Seeded production database with admin user and sample packages

**Phase 2A (2025-10-23)**: Restored core functionality post-migration:
- Fixed TypeScript errors from Phase 1 restructuring
- Restored Stripe payment integration
- Added `User.passwordHash` field for admin authentication

**Phase 1 (2025-10-23)**: Migrated from hexagonal to layered architecture:
- apps/api → server
- apps/web → client
- domains/ → services/
- http/v1/*.http.ts → routes/*.routes.ts
- Consolidated ports/entities/errors into lib/
- pnpm → npm workspaces
- Express 5 → 4, React 19 → 18
