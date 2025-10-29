# Elope Wedding Booking Platform - Improvement Roadmap

**Document Version**: 1.0
**Date**: October 24, 2025
**Target Audience**: Pre-Launch Wedding Booking Platform
**Current Status**: 90% Pre-Launch Ready (MVP Complete, Phase 2 Complete)
**System Version**: 0.2.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Purpose & Requirements](#application-purpose--requirements)
3. [Current Architecture Deep Dive](#current-architecture-deep-dive)
4. [Pre-Launch Readiness Assessment](#pre-launch-readiness-assessment)
5. [Booking-Specific Database Challenges](#booking-specific-database-challenges)
6. [Prioritized Improvements](#prioritized-improvements)
7. [Phased Implementation Plan](#phased-implementation-plan)
8. [Success Metrics](#success-metrics)
9. [Risk Assessment](#risk-assessment)
10. [Resource Requirements](#resource-requirements)

---

## Executive Summary

### Current State

Elope is a **micro-wedding booking platform** for a single wedding photographer business, currently 90% complete for pre-launch. The system has successfully completed:

- **MVP Phase (v0.1.0)**: Complete booking flow with mock adapters
- **Phase 2 (v0.2.0)**: Real adapters implemented (PostgreSQL, Stripe, Postmark, Google Calendar)
- **Clean Architecture**: Hexagonal/layered architecture with excellent separation of concerns
- **Type Safety**: Prisma ORM with generated types and domain mappers
- **Testing Infrastructure**: 7 integration tests passing with excellent fake implementations

### Business Context

Elope serves a **single wedding photographer** offering micro-weddings. The platform's primary value proposition is:

1. **Simple Booking Experience** - Customers browse packages, check date availability, book online
2. **Automated Confirmations** - Email confirmations with booking details and next steps
3. **Date Protection** - ZERO double-booking tolerance (mission-critical for wedding business)
4. **Admin Management** - Photographer manages bookings, packages, blackout dates
5. **Payment Processing** - Stripe Checkout for secure payment collection

### Critical Success Factors

**Reputation Protection**: Double-booking a wedding date would be catastrophic for business reputation. This is the HIGHEST priority concern.

**Launch Readiness**: System must be production-ready with robust error handling, payment webhook reliability, and comprehensive testing.

**Customer Experience**: Booking flow must be smooth, confirmations must be reliable, and calendar accuracy must be perfect.

### Priority Focus Areas

This roadmap addresses improvements in six critical domains prioritized by launch criticality:

1. **Double-Booking Prevention** - Database constraints, race condition handling, atomic operations
2. **Stripe Webhook Reliability** - Signature verification, retry logic, idempotency
3. **Launch Checklist Completion** - Production configuration, monitoring setup, error handling
4. **Customer Experience** - Email reliability, calendar integration, confirmation accuracy
5. **Booking Flow Atomicity** - Transaction safety, conflict resolution, rollback handling
6. **Add-On and Package Management** - Admin workflows, pricing updates, photo management

### Roadmap Structure

Improvements are **prioritized by launch criticality** using a severity-based system:

- **P0 (Launch Blockers)**: Must fix before launch - 0-2 weeks
- **P1 (Launch Readiness)**: Should fix before or immediately after launch - 2-4 weeks
- **P2 (Enhancement)**: Can fix within 60 days of launch - 4-8 weeks
- **P3 (Future Features)**: Nice-to-have improvements - 8+ weeks

Each improvement includes:
- **Business impact justification** (reputation, revenue, customer experience)
- **Technical implementation details** (file paths, code patterns)
- **Effort estimation** (hours/days)
- **Testing requirements** (unit, integration, E2E)
- **Rollback procedures** (safety nets)

---

## Application Purpose & Requirements

### Business Model

Elope is a **single-tenant booking platform** for a wedding photography business:

- **Services Offered**: Micro-wedding photography packages (elopements, intimate weddings)
- **Booking Model**: One photographer, one wedding per day, one location
- **Target Customers**: Couples planning micro-weddings (2-20 guests)
- **Revenue Model**: Package-based pricing + optional add-ons
- **Scale**: 50-100 weddings per year

### Core User Flows

#### Customer Booking Flow

1. **Browse Packages** - View available photography packages with descriptions, pricing, sample photos
2. **Select Add-Ons** - Choose optional add-ons (engagement shoot, photo album, extra hours)
3. **Check Availability** - Enter desired date, system checks three constraints:
   - No existing booking on that date
   - Date not in blackout list (photographer unavailable)
   - Date not busy in Google Calendar (personal conflicts)
4. **Enter Details** - Couple name, email, phone, event notes
5. **Payment** - Stripe Checkout for package + add-ons
6. **Confirmation** - Email with booking details, what to expect, next steps

#### Admin Management Flow

1. **View Bookings** - Dashboard showing all bookings (upcoming, past, cancelled)
2. **Manage Packages** - CRUD operations for photography packages
3. **Manage Add-Ons** - CRUD operations for optional add-ons
4. **Blackout Dates** - Mark dates as unavailable (vacations, personal events)
5. **Authentication** - Secure admin login with bcrypt-hashed passwords

### Operational Requirements

#### Booking Constraints (MISSION-CRITICAL)

- **Zero Double-Bookings**: ABSOLUTE requirement - one booking per date maximum
- **Atomic Booking Creation**: If payment succeeds but booking fails, no charge occurs
- **Calendar Accuracy**: Real-time availability checks must be reliable
- **Conflict Detection**: Handle race conditions when two users book same date simultaneously

#### Payment Reliability

- **Stripe Webhook Handling**: Payment confirmation must reliably trigger booking completion
- **Webhook Retry Logic**: Failed webhooks must retry with exponential backoff
- **Signature Verification**: All webhooks must verify signatures (prevent fraud)
- **Idempotency**: Duplicate webhooks must not create duplicate bookings

#### Customer Communication

- **Email Confirmations**: 100% delivery rate (mission-critical)
- **Booking Details Accuracy**: Confirmation emails must show correct package, date, price
- **Error Notifications**: Clear error messages for booking failures
- **Calendar Invites**: Automatic .ics file generation for customer calendars

### Technical Requirements

#### Stack Components

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express 4, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Payments**: Stripe Checkout + Webhooks
- **Email**: Postmark (with file-sink fallback for development)
- **Calendar**: Google Calendar API (with mock fallback for development)
- **Testing**: Vitest, Playwright, excellent fake implementations
- **Hosting**: TBD (likely Vercel frontend + Render/Fly.io backend + Supabase/Neon database)

#### Integration Points

- **Stripe**: Checkout session creation, webhook signature verification, payment status tracking
- **Postmark**: Transactional email delivery (booking confirmations, admin notifications)
- **Google Calendar**: FreeBusy API for availability checking
- **Browser APIs**: localStorage for dev mode configuration, fetch for API calls

---

## Current Architecture Deep Dive

### Architectural Pattern: Layered/Hexagonal

Elope uses a **ports and adapters (hexagonal) architecture** migrated to **layered architecture** in Phase 1 (October 2023):

**Before (Hexagonal)**:
```
apps/
  api/ (server)
  web/ (client)
domains/ (business logic)
  booking/, catalog/, identity/
```

**After (Layered)**:
```
server/
  src/
    routes/        (HTTP layer)
    services/      (business logic)
    adapters/      (infrastructure)
      prisma/      (database)
      postmark/    (email)
      stripe/      (payments)
      gcal/        (calendar)
      mock/        (in-memory for dev)
    lib/
      ports.ts     (interface definitions)
      entities.ts  (domain entities)
      errors.ts    (domain errors)
    di.ts          (dependency injection)
client/ (React frontend)
```

**Strengths of Current Architecture**:
- ✅ **Clean separation of concerns**: Business logic isolated from infrastructure
- ✅ **Testability**: Excellent fake implementations for all ports
- ✅ **Type safety**: Prisma-generated types + domain mappers
- ✅ **Flexibility**: Easy to swap PostgreSQL for another database
- ✅ **Mock mode**: Can develop end-to-end without external services

**Weaknesses**:
- ❌ **Incomplete Stripe integration**: Checkout returns placeholder URL (not wired)
- ❌ **Missing PaymentProvider injection**: BookingService doesn't receive payment provider
- ❌ **N+1 query issue**: CatalogService.getAllPackages() makes N+1 queries
- ❌ **Orphaned services**: webhook-handler.service.ts and catalog-optimized.service.ts unused
- ❌ **No persistent audit logging**: Event emitter only (no database persistence)

### Database Layer: Prisma + PostgreSQL

#### Schema Design

**File**: `/Users/mikeyoung/CODING/Elope/server/prisma/schema.prisma`

```prisma
model Booking {
  id          String   @id @default(cuid())
  customerId  String
  packageId   String
  date        DateTime @unique  // CRITICAL: Unique constraint prevents double-booking
  status      String
  totalPrice  Int
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  customer    Customer @relation(fields: [customerId], references: [id])
  package     Package  @relation(fields: [packageId], references: [id])
  addOns      BookingAddOn[]
}

model Customer {
  id       String    @id @default(cuid())
  email    String    @unique
  name     String
  phone    String?
  bookings Booking[]
}

model Package {
  id          String         @id @default(cuid())
  slug        String         @unique
  name        String
  description String?
  basePrice   Int
  active      Boolean        @default(true)
  photoUrl    String?
  addOns      PackageAddOn[]
  bookings    Booking[]
}

model BlackoutDate {
  id     String   @id @default(cuid())
  date   DateTime @unique
  reason String?
}
```

**Critical Constraint: `date DateTime @unique`**

This is the **PRIMARY defense** against double-bookings:
- Database-level constraint enforces one booking per date
- Prisma error code: `P2002` (unique constraint violation)
- Caught in repository layer and converted to `BookingConflictError`

**Strengths**:
- ✅ Database-enforced uniqueness (cannot be bypassed)
- ✅ Clean schema with proper relationships
- ✅ Prisma migrations for version control
- ✅ Generated types for compile-time safety

**Weaknesses**:
- ❌ No audit trail for booking changes
- ❌ No soft deletes (cancelled bookings lose history)
- ❌ No payment transaction linkage (stripe_payment_id missing)
- ❌ No booking state transitions logged

#### Repository Pattern

**File**: `/Users/mikeyoung/CODING/Elope/server/src/adapters/prisma/booking.repository.ts`

```typescript
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(booking: Booking): Promise<Booking> {
    try {
      // Upsert customer (idempotent)
      const customer = await this.prisma.customer.upsert({
        where: { email: booking.email },
        update: { name: booking.coupleName, phone: booking.phone },
        create: { email: booking.email, name: booking.coupleName, phone: booking.phone },
      });

      // Create booking (atomic with add-ons)
      const created = await this.prisma.booking.create({
        data: {
          id: booking.id,
          customerId: customer.id,
          packageId: booking.packageId,
          date: new Date(booking.eventDate),
          totalPrice: booking.totalCents,
          status: mapToPrismaStatus(booking.status),
          addOns: {
            create: booking.addOnIds.map((addOnId) => ({
              addOnId,
              quantity: 1,
              unitPrice: 0,  // BUG: Should fetch from add-on table
            })),
          },
        },
        include: { customer: true, addOns: { select: { addOnId: true } } },
      });

      return this.toDomainBooking(created);
    } catch (error) {
      // Convert Prisma errors to domain errors
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BookingConflictError(booking.eventDate);
      }
      throw error;
    }
  }

  async findByDate(date: string): Promise<Booking | null> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        date: new Date(date),
        status: { notIn: ['cancelled', 'refunded'] },  // Exclude cancelled
      },
      include: {
        customer: true,
        addOns: { select: { addOnId: true } },
      },
    });

    return booking ? this.toDomainBooking(booking) : null;
  }
}
```

**Strengths**:
- ✅ Error handling: Prisma errors converted to domain errors
- ✅ Idempotent customer creation (upsert pattern)
- ✅ Atomic creation: Booking + add-ons in single transaction
- ✅ Proper includes: Loads related data efficiently

**Weaknesses**:
- ❌ Add-on unit price hardcoded to 0 (should fetch from catalog)
- ❌ No explicit transaction wrapper (relies on Prisma implicit transactions)
- ❌ No retry logic for transient database errors
- ❌ Date conversion assumes UTC (could cause timezone issues)

### Service Layer: Business Logic

#### Booking Service

**File**: `/Users/mikeyoung/CODING/Elope/server/src/services/booking.service.ts`

```typescript
export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly eventEmitter: EventEmitter,
    // MISSING: private readonly paymentProvider: PaymentProvider
  ) {}

  async createCheckout(input: CreateCheckoutInput): Promise<{ checkoutUrl: string }> {
    // Validate date availability
    const isAvailable = await this.availabilityService.isDateAvailable(input.eventDate);
    if (!isAvailable) {
      throw new ConflictError(`Date ${input.eventDate} is not available`);
    }

    // Calculate total price
    const pkg = await this.catalogRepo.getPackageById(input.packageId);
    const addOns = await Promise.all(
      input.addOnIds.map(id => this.catalogRepo.getAddOnById(id))
    );
    const totalCents = pkg.priceCents + addOns.reduce((sum, a) => sum + a.priceCents, 0);

    // TODO: Create Stripe checkout session
    // BUG: Payment provider never called, returns placeholder
    const checkoutUrl = `https://checkout.stripe.com/placeholder`;

    return { checkoutUrl };
  }

  async onPaymentCompleted(payload: PaymentCompletedPayload): Promise<void> {
    // Create booking after payment succeeds
    const booking = new Booking({
      id: cuid(),
      packageId: payload.packageId,
      eventDate: payload.eventDate,
      coupleName: payload.coupleName,
      email: payload.email,
      phone: payload.phone,
      addOnIds: payload.addOnIds,
      totalCents: payload.totalCents,
      status: 'confirmed',
      stripeSessionId: payload.sessionId,
    });

    await this.bookingRepo.create(booking);

    // Emit event for email notification
    this.eventEmitter.emit('BookingPaid', {
      bookingId: booking.id,
      eventDate: booking.eventDate,
      email: booking.email,
      // ... booking details
    });
  }
}
```

**Critical Issue**: Payment provider NOT wired (documented in Phase 2 Assessment)

**Strengths**:
- ✅ Pre-validation of date availability
- ✅ Price calculation from catalog
- ✅ Event-driven architecture (booking → email)
- ✅ Domain entity pattern (Booking class)

**Weaknesses**:
- ❌ **Payment provider missing**: `createCheckout()` returns placeholder URL
- ❌ **No transaction wrapping**: `onPaymentCompleted()` has multiple operations
- ❌ **No idempotency check**: Duplicate webhooks could create duplicate bookings
- ❌ **No error recovery**: Payment succeeds but booking fails → customer charged, no booking

### Payment Integration: Stripe Adapter

**File**: `/Users/mikeyoung/CODING/Elope/server/src/adapters/stripe.adapter.ts`

```typescript
export class StripePaymentAdapter implements PaymentProvider {
  constructor(private readonly stripe: Stripe, private readonly config: Config) {}

  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ url: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${this.config.clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.config.clientUrl}/booking`,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: params.packageName },
            unit_amount: params.totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        packageId: params.packageId,
        eventDate: params.eventDate,
        coupleName: params.coupleName,
        email: params.email,
        phone: params.phone || '',
        addOnIds: JSON.stringify(params.addOnIds),
      },
    });

    return { url: session.url! };
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.stripeWebhookSecret
      );
      return true;
    } catch {
      return false;
    }
  }
}
```

**Strengths**:
- ✅ Complete implementation (not a stub)
- ✅ Metadata encoding for booking details
- ✅ Webhook signature verification
- ✅ Proper Stripe SDK usage

**Weaknesses**:
- ❌ **Not wired into BookingService**: Adapter exists but never called
- ❌ **No error handling**: Stripe API failures not caught
- ❌ **No retry logic**: Transient failures cause checkout to fail
- ❌ **Metadata size risk**: Large add-on lists could exceed 500-byte limit

### Webhook Handling

**File**: `/Users/mikeyoung/CODING/Elope/server/src/routes/webhooks.routes.ts`

```typescript
export class WebhooksController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly paymentProvider: PaymentProvider
  ) {}

  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.body;  // Must be raw buffer, not parsed JSON

    // Verify signature
    const isValid = this.paymentProvider.verifyWebhook(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse webhook
    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Extract booking details from metadata
      const payload = {
        sessionId: session.id,
        packageId: session.metadata.packageId,
        eventDate: session.metadata.eventDate,
        coupleName: session.metadata.coupleName,
        email: session.metadata.email,
        phone: session.metadata.phone,
        addOnIds: JSON.parse(session.metadata.addOnIds),
        totalCents: session.amount_total,
      };

      // Create booking
      await this.bookingService.onPaymentCompleted(payload);
    }

    res.status(200).json({ received: true });
  }
}
```

**Strengths**:
- ✅ Signature verification (prevents fraud)
- ✅ Metadata extraction and parsing
- ✅ Event type filtering (only checkout.session.completed)

**Weaknesses**:
- ❌ **No error handling**: If booking creation fails, returns 200 anyway
- ❌ **No retry logic**: Webhook failure loses payment → booking link
- ❌ **No idempotency**: Duplicate webhooks create duplicate bookings
- ❌ **No logging**: No audit trail of webhook attempts
- ❌ **Synchronous processing**: Long operations could cause timeout

### Email Notifications

**File**: `/Users/mikeyoung/CODING/Elope/server/src/adapters/postmark.adapter.ts`

```typescript
export class PostmarkMailAdapter implements EmailProvider {
  constructor(private readonly cfg: Config) {}

  async sendBookingConfirm(to: string, payload: BookingConfirmPayload): Promise<void> {
    const subject = `Your micro-wedding is booked for ${payload.eventDate}`;
    const body = [
      `Hi,`,
      `You're confirmed!`,
      `Package: ${payload.packageName}`,
      `Date: ${payload.eventDate}`,
      `Total: $${(payload.totalCents / 100).toFixed(2)}`,
      ``,
      `We'll be in touch soon with next steps.`,
    ].join('\n');

    // BUG: Template mixing with adapter
    // Should extract to separate template service

    if (!this.cfg.postmarkServerToken) {
      // Fallback: Write to file (dev mode)
      const dir = path.join(process.cwd(), 'tmp', 'emails');
      await fs.promises.mkdir(dir, { recursive: true });
      const fname = `${Date.now()}_${to.replace(/[^a-z0-9@._-]/gi, '_')}.eml`;
      await fs.promises.writeFile(path.join(dir, fname), `To: ${to}\nSubject: ${subject}\n\n${body}`, 'utf8');
      return;
    }

    // Production: Send via Postmark
    const client = new postmark.ServerClient(this.cfg.postmarkServerToken);
    await client.sendEmail({
      From: this.cfg.postmarkFromEmail,
      To: to,
      Subject: subject,
      TextBody: body,
    });
  }
}
```

**Strengths**:
- ✅ File-sink fallback for development
- ✅ Proper Postmark SDK usage
- ✅ Email formatting with booking details

**Weaknesses**:
- ❌ **Template mixing**: HTML generation in adapter (violates SRP)
- ❌ **Duplicate fallback logic**: Same file-sink code in `sendEmail()` and `sendBookingConfirm()`
- ❌ **No error handling**: Postmark failures not caught
- ❌ **No retry logic**: Transient email failures lose confirmation
- ❌ **No attachments**: Cannot send calendar .ics files

### Authentication & Authorization

**File**: `/Users/mikeyoung/CODING/Elope/server/src/services/identity.service.ts`

```typescript
export class IdentityService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtSecret: string
  ) {}

  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return { token };
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
```

**Strengths**:
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token generation with expiration
- ✅ Clean error handling (generic "Invalid credentials")

**Weaknesses**:
- ❌ **No rate limiting**: Brute force attacks possible
- ❌ **No session revocation**: Cannot logout users remotely
- ❌ **Long expiration**: 7-day tokens (should be shorter for admin)
- ❌ **No audit logging**: Login attempts not tracked

---

## Pre-Launch Readiness Assessment

### Current Status: 90% Pre-Launch Ready

The system has completed **MVP (v0.1.0)** and **Phase 2 (v0.2.0)**. Assessment based on:

1. **Phase 2 Assessment** (October 23, 2025) - Architecture and code quality review
2. **Database Communication Comparison** (October 23, 2025) - Prisma vs Supabase analysis
3. **Roadmap Status** (October 24, 2025) - MVP and Phase 2 complete

### Launch Blockers: IDENTIFIED

#### 1. Stripe Integration NOT Wired (CRITICAL)

**Status**: 0% complete
**Issue**: Payment provider exists but never called by BookingService
**Impact**: CRITICAL - No payments possible, system cannot generate revenue

**Evidence**:
```typescript
// File: server/src/services/booking.service.ts (lines 18-37)
async createCheckout() {
  // TODO: Create Stripe checkout session
  const checkoutUrl = `https://checkout.stripe.com/placeholder`;
  return { checkoutUrl };
}
```

**Fix Required**:
1. Inject `PaymentProvider` into `BookingService` constructor
2. Call `paymentProvider.createCheckoutSession()` with booking details
3. Return actual Stripe checkout URL
4. Handle Stripe API errors

**Effort**: 2-3 hours
**Priority**: P0 - Launch Blocker

---

#### 2. Webhook Error Handling Missing (CRITICAL)

**Status**: 0% complete
**Issue**: Webhook processing has no error handling or retry logic
**Impact**: CRITICAL - Failed webhooks = payments succeed but bookings never created

**Evidence**:
```typescript
// File: server/src/routes/webhooks.routes.ts
async handleStripeWebhook(req, res) {
  // ... signature verification ...

  // BUG: If booking creation fails, still returns 200
  await this.bookingService.onPaymentCompleted(payload);
  res.status(200).json({ received: true });
}
```

**Consequences**:
- Payment succeeds in Stripe
- Booking creation fails (database error, race condition, etc.)
- Webhook returns 200 (Stripe thinks it succeeded)
- Customer charged but no booking exists
- Stripe won't retry (got 200 response)

**Fix Required**:
1. Wrap `onPaymentCompleted()` in try-catch
2. Return 500 on error (triggers Stripe retry)
3. Add idempotency check (Stripe session ID)
4. Implement webhook queue with retry logic
5. Add webhook audit logging

**Effort**: 4-6 hours
**Priority**: P0 - Launch Blocker

---

#### 3. Double-Booking Race Condition (CRITICAL)

**Status**: 50% complete (database constraint exists, but race condition not handled)
**Issue**: Two users can pass availability check simultaneously, then both attempt booking
**Impact**: CRITICAL - Double-booking = catastrophic reputation damage

**Current Protection**:
- ✅ Database unique constraint on `booking.date`
- ❌ No application-level locking
- ❌ No optimistic locking (version field)
- ❌ No distributed lock (Redis)

**Race Condition Scenario**:
```
Time  | User A                    | User B
------|---------------------------|---------------------------
10:00 | Check availability (OK)   | Check availability (OK)
10:01 | Click "Book Now"          | Click "Book Now"
10:02 | Create Stripe session     | Create Stripe session
10:03 | Complete payment          | Complete payment
10:04 | Webhook: Create booking   | Webhook: Create booking (CONFLICT!)
```

**Fix Required**:
1. Add `SELECT FOR UPDATE` lock during availability check
2. Implement optimistic locking with version field
3. Handle `P2002` error gracefully in webhook handler
4. Add customer-facing error message ("Date just booked, please choose another")
5. Consider distributed lock (Redis) for high-traffic scenarios

**Effort**: 3-4 hours
**Priority**: P0 - Launch Blocker

---

### Pre-Launch Checklist

**MUST HAVE (Blockers)**:
- [ ] Stripe integration wired (P0-1)
- [ ] Webhook error handling (P0-2)
- [ ] Race condition handling (P0-3)
- [ ] Production database setup (PostgreSQL)
- [ ] Environment variables configured (Stripe keys, database URL, JWT secret)
- [ ] Postmark email delivery tested (real mode)
- [ ] Google Calendar integration tested (freeBusy API)
- [ ] End-to-end booking flow tested (real payment)
- [ ] Error monitoring setup (Sentry or similar)

**SHOULD HAVE (Strong Recommendation)**:
- [ ] Webhook idempotency implementation (P1-1)
- [ ] Email template extraction (P1-2)
- [ ] Add-on unit price fix (P1-3)
- [ ] N+1 query optimization (P1-4)
- [ ] Orphaned service cleanup (P1-5)
- [ ] Calendar .ics attachment generation (P1-6)
- [ ] Admin authentication rate limiting (P1-7)
- [ ] Booking audit logging (P1-8)

**NICE TO HAVE (Deferred)**:
- [ ] Session management improvements
- [ ] Advanced error recovery
- [ ] Performance optimizations
- [ ] Mobile responsive design
- [ ] Analytics integration

---

## Booking-Specific Database Challenges

### Challenge 1: Double-Booking Prevention (MISSION-CRITICAL)

**Problem**: A wedding photographer CANNOT double-book a date. This is the highest priority concern for the business.

**Current Implementation**: Three-layer defense

**Layer 1: Database Unique Constraint**
```prisma
model Booking {
  date DateTime @unique  // Enforces one booking per date
}
```

**Layer 2: Application Availability Check**
```typescript
// File: server/src/services/availability.service.ts
async isDateAvailable(date: string): Promise<boolean> {
  // Check 1: No existing booking
  const booking = await this.bookingRepo.findByDate(date);
  if (booking) return false;

  // Check 2: Not in blackout dates
  const blackout = await this.blackoutRepo.findByDate(date);
  if (blackout) return false;

  // Check 3: Not busy in Google Calendar
  const isBusy = await this.calendarProvider.isBusy(date);
  if (isBusy) return false;

  return true;
}
```

**Layer 3: Prisma Error Handling**
```typescript
// File: server/src/adapters/prisma/booking.repository.ts
try {
  await this.prisma.booking.create({ data: { date, ... } });
} catch (error) {
  if (error.code === 'P2002') {  // Unique constraint violation
    throw new BookingConflictError(date);
  }
}
```

**Identified Gaps**:

1. **Race Condition Window** (CRITICAL):
   - Time between availability check and booking creation
   - Two users can both get "available" result
   - Both proceed to payment
   - Both webhooks attempt booking creation
   - Second one fails with P2002, but webhook already returned 200

2. **No Transaction Lock**:
   - Availability check and booking creation are separate operations
   - Need `SELECT FOR UPDATE` to lock date during check

3. **No Optimistic Locking**:
   - Cannot detect if another process modified data
   - No version field to check

**Solutions** (See Prioritized Improvements):
- P0: Add webhook idempotency check (prevent duplicate attempts)
- P0: Handle P2002 gracefully in webhook handler (return error, trigger Stripe retry)
- P1: Implement `SELECT FOR UPDATE` lock during availability check
- P1: Add optimistic locking with version field
- P2: Consider distributed lock (Redis) for ultimate safety

---

### Challenge 2: Payment-to-Booking Atomicity

**Problem**: Payment success and booking creation must be atomic. If payment succeeds but booking fails, customer is charged with no booking.

**Current Flow**:
1. Customer completes Stripe Checkout
2. Stripe sends webhook: `checkout.session.completed`
3. Webhook handler creates booking
4. If booking creation fails (database error, race condition), customer is charged but no booking exists

**Current Issues**:

1. **No Rollback Mechanism**:
   - Stripe payment cannot be automatically refunded if booking fails
   - Manual intervention required to reconcile payments and bookings

2. **No Idempotency**:
   - Duplicate webhooks (Stripe retries) create duplicate bookings
   - No check for existing booking with same session ID

3. **No Error Recovery**:
   - If webhook processing fails, no retry mechanism
   - Payment → booking link is permanently lost

**Solutions** (See Prioritized Improvements):
- P0: Webhook error handling (return 500 on error, trigger Stripe retry)
- P0: Idempotency check (Stripe session ID → prevent duplicates)
- P1: Webhook audit logging (track all attempts, success/failure)
- P1: Automatic reconciliation job (match Stripe payments to bookings)
- P2: Dead letter queue for failed webhooks (manual recovery process)

---

### Challenge 3: Calendar Synchronization Accuracy

**Problem**: Google Calendar integration must accurately reflect availability. If calendar shows busy but system shows available (or vice versa), double-booking risk increases.

**Current Implementation**:

```typescript
// File: server/src/adapters/gcal.adapter.ts
async isBusy(date: string): Promise<boolean> {
  const timeMin = new Date(date + 'T00:00:00Z').toISOString();
  const timeMax = new Date(date + 'T23:59:59Z').toISOString();

  const response = await this.calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: this.calendarId }],
    },
  });

  const busy = response.data.calendars?.[this.calendarId]?.busy || [];
  return busy.length > 0;
}
```

**Issues**:

1. **No Error Handling**:
   - Google API failures silently fail
   - Falls back to mock (always returns false)
   - Could cause double-booking if API is down

2. **No Caching**:
   - Every availability check hits Google API
   - Rate limiting risk for high traffic

3. **Timezone Assumptions**:
   - Assumes UTC (may not match photographer's timezone)
   - Could cause off-by-one-day errors

**Solutions** (See Prioritized Improvements):
- P1: Add error handling and retry logic for Google Calendar API
- P1: Cache freeBusy results (5-minute TTL)
- P1: Timezone configuration (photographer's local timezone)
- P2: Manual override (admin can mark date as available even if calendar is busy)

---

### Challenge 4: Email Delivery Reliability

**Problem**: Booking confirmation emails are mission-critical. If email fails to send, customer has no confirmation details.

**Current Implementation**:

```typescript
// File: server/src/di.ts (lines 150-170)
eventEmitter.on('BookingPaid', async (payload) => {
  try {
    await emailProvider.sendBookingConfirm(payload.email, payload);
  } catch (error) {
    logger.error('Failed to send booking confirmation', { error, payload });
    // BUG: Email failure is logged but booking still succeeds
  }
});
```

**Issues**:

1. **Fire-and-Forget**:
   - Email sent asynchronously in event handler
   - Failure doesn't block booking creation
   - Customer charged but no confirmation received

2. **No Retry Logic**:
   - Transient email failures (Postmark API down) are not retried
   - Customer never receives confirmation

3. **No Audit Trail**:
   - No database record of email attempts
   - Cannot track delivery failures

**Solutions** (See Prioritized Improvements):
- P1: Email retry queue (exponential backoff)
- P1: Email audit logging (track attempts, success/failure)
- P1: Admin dashboard showing failed emails
- P2: Customer self-service ("Resend confirmation email" button)

---

## Prioritized Improvements

### Priority Matrix

| Severity | Count | Total Effort | Impact |
|----------|-------|--------------|--------|
| P0 (Launch Blockers) | 3 | 9-13 hours | CRITICAL - Revenue & Reputation |
| P1 (Launch Readiness) | 8 | 22-32 hours | HIGH - Reliability & UX |
| P2 (Enhancement) | 10 | 30-45 hours | MEDIUM - Performance & Features |
| P3 (Future Features) | 6 | 40-60 hours | LOW - Nice to Have |

---

### P0: Launch Blockers (0-2 weeks)

These issues MUST be fixed before production launch.

---

#### P0-1: Wire Stripe Integration into BookingService

**Severity**: P0 - Launch Blocker
**Category**: Payment Integration
**Effort**: 2-3 hours
**Owner**: Backend Team

**Business Impact**:
- **Revenue**: ZERO revenue possible without payment integration
- **Launch**: Cannot launch without working payments
- **Customer Experience**: Booking flow broken at checkout step

**Problem**: `BookingService.createCheckout()` returns placeholder URL instead of real Stripe checkout session.

**Root Cause**: `PaymentProvider` not injected into `BookingService` (documented in Phase 2 Assessment, issue #1).

**Implementation**:

**Step 1: Update DI Container**

**File**: `server/src/di.ts` (line 147)

```typescript
// BEFORE
const bookingService = new BookingService(
  bookingRepo,
  catalogRepo,
  eventEmitter
  // Missing: paymentProvider
);

// AFTER
const bookingService = new BookingService(
  bookingRepo,
  catalogRepo,
  eventEmitter,
  paymentProvider  // ADD THIS
);
```

**Step 2: Update BookingService Constructor**

**File**: `server/src/services/booking.service.ts` (lines 11-16)

```typescript
// BEFORE
export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly eventEmitter: EventEmitter
  ) {}
}

// AFTER
export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly eventEmitter: EventEmitter,
    private readonly paymentProvider: PaymentProvider  // ADD THIS
  ) {}
}
```

**Step 3: Replace Placeholder with Real Stripe Call**

**File**: `server/src/services/booking.service.ts` (lines 18-37)

```typescript
// BEFORE
async createCheckout(input: CreateCheckoutInput): Promise<{ checkoutUrl: string }> {
  // ... validation and price calculation ...

  // TODO: Create Stripe checkout session
  const checkoutUrl = `https://checkout.stripe.com/placeholder`;

  return { checkoutUrl };
}

// AFTER
async createCheckout(input: CreateCheckoutInput): Promise<{ checkoutUrl: string }> {
  // Validate date availability
  const isAvailable = await this.availabilityService.isDateAvailable(input.eventDate);
  if (!isAvailable) {
    throw new ConflictError(`Date ${input.eventDate} is not available`);
  }

  // Get package and add-ons
  const pkg = await this.catalogRepo.getPackageById(input.packageId);
  const addOns = await Promise.all(
    input.addOnIds.map(id => this.catalogRepo.getAddOnById(id))
  );

  // Calculate total
  const totalCents = pkg.priceCents + addOns.reduce((sum, a) => sum + a.priceCents, 0);

  // Create Stripe checkout session
  try {
    const { url } = await this.paymentProvider.createCheckoutSession({
      packageId: input.packageId,
      packageName: pkg.title,
      eventDate: input.eventDate,
      coupleName: input.coupleName,
      email: input.email,
      phone: input.phone,
      addOnIds: input.addOnIds,
      totalCents,
    });

    return { checkoutUrl: url };
  } catch (error) {
    // Handle Stripe API errors
    if (error instanceof Error) {
      throw new Error(`Payment setup failed: ${error.message}`);
    }
    throw new Error('Payment setup failed');
  }
}
```

**Testing**:

```typescript
// File: server/tests/integration/booking-flow.test.ts
describe('Booking Flow', () => {
  it('creates real Stripe checkout session', async () => {
    const response = await request(app)
      .post('/api/v1/bookings/checkout')
      .send({
        packageId: testPackage.id,
        eventDate: '2025-12-01',
        coupleName: 'John & Jane',
        email: 'test@example.com',
        phone: '555-1234',
        addOnIds: [],
      })
      .expect(200);

    expect(response.body.checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\/c\/pay\//);
    expect(response.body.checkoutUrl).not.toContain('placeholder');
  });

  it('handles Stripe API errors gracefully', async () => {
    // Mock Stripe API failure
    jest.spyOn(stripeClient.checkout.sessions, 'create')
      .mockRejectedValueOnce(new Error('Stripe API down'));

    const response = await request(app)
      .post('/api/v1/bookings/checkout')
      .send(validBookingData)
      .expect(500);

    expect(response.body.error).toContain('Payment setup failed');
  });
});
```

**Success Criteria**:
- [ ] Payment provider injected into BookingService
- [ ] `createCheckout()` returns real Stripe checkout URL
- [ ] Stripe API errors handled gracefully
- [ ] Integration tests pass (real Stripe call in test mode)
- [ ] End-to-end booking flow tested with real payment

**Rollback**: Revert to placeholder URL (system still works in mock mode)

---

#### P0-2: Implement Webhook Error Handling and Retry Logic

**Severity**: P0 - Launch Blocker
**Category**: Payment Reliability
**Effort**: 4-6 hours
**Owner**: Backend Team

**Business Impact**:
- **Financial**: Failed webhooks = payments succeed but bookings never created = revenue loss
- **Reputation**: Customers charged but no booking = complaints and refunds
- **Operational**: Manual reconciliation required to fix orphaned payments

**Problem**: Webhook handler has no error handling. If booking creation fails, webhook returns 200 anyway, so Stripe won't retry.

**Implementation**:

**Step 1: Add Webhook Error Handling**

**File**: `server/src/routes/webhooks.routes.ts`

```typescript
// BEFORE
async handleStripeWebhook(req: Request, res: Response): Promise<void> {
  // ... signature verification ...

  if (event.type === 'checkout.session.completed') {
    const payload = extractPayload(session);
    await this.bookingService.onPaymentCompleted(payload);
  }

  res.status(200).json({ received: true });
}

// AFTER
async handleStripeWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Verify signature
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.body;

    const isValid = this.paymentProvider.verifyWebhook(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse event
    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Check idempotency (prevent duplicate bookings)
      const existing = await this.bookingService.findByStripeSessionId(session.id);
      if (existing) {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      // Extract booking details
      const payload = {
        sessionId: session.id,
        packageId: session.metadata.packageId,
        eventDate: session.metadata.eventDate,
        coupleName: session.metadata.coupleName,
        email: session.metadata.email,
        phone: session.metadata.phone,
        addOnIds: JSON.parse(session.metadata.addOnIds),
        totalCents: session.amount_total,
      };

      // Create booking (may throw)
      await this.bookingService.onPaymentCompleted(payload);

      // Success
      res.status(200).json({ received: true });
    } else {
      // Unhandled event type
      res.status(200).json({ received: true, unhandled: event.type });
    }
  } catch (error) {
    // Log error
    logger.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 500 (triggers Stripe retry)
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

**Step 2: Add Idempotency Check to BookingService**

**File**: `server/src/services/booking.service.ts`

```typescript
async findByStripeSessionId(sessionId: string): Promise<Booking | null> {
  return this.bookingRepo.findByStripeSessionId(sessionId);
}

async onPaymentCompleted(payload: PaymentCompletedPayload): Promise<void> {
  // Double-check idempotency (defense in depth)
  const existing = await this.bookingRepo.findByStripeSessionId(payload.sessionId);
  if (existing) {
    logger.warn('Duplicate webhook detected', { sessionId: payload.sessionId });
    return;
  }

  // Create booking
  const booking = new Booking({
    id: cuid(),
    packageId: payload.packageId,
    eventDate: payload.eventDate,
    coupleName: payload.coupleName,
    email: payload.email,
    phone: payload.phone,
    addOnIds: payload.addOnIds,
    totalCents: payload.totalCents,
    status: 'confirmed',
    stripeSessionId: payload.sessionId,
  });

  await this.bookingRepo.create(booking);

  // Emit event for email notification
  this.eventEmitter.emit('BookingPaid', {
    bookingId: booking.id,
    eventDate: booking.eventDate,
    email: booking.email,
    // ... booking details
  });
}
```

**Step 3: Add Stripe Session ID to Schema**

**File**: `server/prisma/schema.prisma`

```prisma
model Booking {
  id               String   @id @default(cuid())
  customerId       String
  packageId        String
  date             DateTime @unique
  status           String
  totalPrice       Int
  notes            String?
  stripeSessionId  String?  @unique  // ADD THIS
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // ... relations
}
```

**Step 4: Run Migration**

```bash
cd server
npx prisma migrate dev --name add_stripe_session_id
npx prisma generate
```

**Step 5: Update Repository**

**File**: `server/src/adapters/prisma/booking.repository.ts`

```typescript
async findByStripeSessionId(sessionId: string): Promise<Booking | null> {
  const booking = await this.prisma.booking.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      customer: true,
      addOns: { select: { addOnId: true } },
    },
  });

  return booking ? this.toDomainBooking(booking) : null;
}
```

**Testing**:

```typescript
describe('Webhook Error Handling', () => {
  it('returns 500 on booking creation failure', async () => {
    // Mock booking repository to fail
    jest.spyOn(bookingRepo, 'create').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', validSignature)
      .send(testWebhookPayload)
      .expect(500);

    expect(response.body.error).toBe('Webhook processing failed');
  });

  it('handles duplicate webhooks gracefully', async () => {
    // First webhook succeeds
    await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', validSignature)
      .send(testWebhookPayload)
      .expect(200);

    // Second webhook (duplicate) returns 200 but doesn't create booking
    const response = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', validSignature)
      .send(testWebhookPayload)
      .expect(200);

    expect(response.body.duplicate).toBe(true);

    // Verify only one booking created
    const bookings = await bookingRepo.findAll();
    expect(bookings.length).toBe(1);
  });
});
```

**Success Criteria**:
- [ ] Webhook errors return 500 (trigger Stripe retry)
- [ ] Duplicate webhooks detected and skipped (idempotency)
- [ ] Stripe session ID stored in database
- [ ] Integration tests pass (error handling, idempotency)
- [ ] End-to-end tested with real webhook (Stripe CLI)

**Rollback**: Revert webhook handler, remove Stripe session ID field

---

#### P0-3: Handle Double-Booking Race Condition

**Severity**: P0 - Launch Blocker
**Category**: Data Integrity
**Effort**: 3-4 hours
**Owner**: Backend Team

**Business Impact**:
- **Reputation**: CATASTROPHIC - Double-booking a wedding = business-ending reputation damage
- **Customer Trust**: Couples planning wedding = highest stakes customers
- **Financial**: Refunds, compensation, potential lawsuits

**Problem**: Race condition between availability check and booking creation. Two users can both see "available" and proceed to book.

**Implementation**:

**Step 1: Add Version Field to Booking (Optimistic Locking)**

**File**: `server/prisma/schema.prisma`

```prisma
model Booking {
  id               String   @id @default(cuid())
  customerId       String
  packageId        String
  date             DateTime @unique
  status           String
  totalPrice       Int
  notes            String?
  stripeSessionId  String?  @unique
  version          Int      @default(1)  // ADD THIS
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // ... relations
}
```

**Step 2: Implement Transaction Lock**

**File**: `server/src/services/availability.service.ts`

```typescript
// BEFORE
async isDateAvailable(date: string): Promise<boolean> {
  const booking = await this.bookingRepo.findByDate(date);
  if (booking) return false;

  const blackout = await this.blackoutRepo.findByDate(date);
  if (blackout) return false;

  const isBusy = await this.calendarProvider.isBusy(date);
  if (isBusy) return false;

  return true;
}

// AFTER
async isDateAvailableWithLock(date: string, transaction?: PrismaTransaction): Promise<boolean> {
  // Use transaction if provided (for atomic check + create)
  const prisma = transaction || this.prisma;

  // SELECT FOR UPDATE (lock row if exists)
  const booking = await prisma.$queryRaw`
    SELECT id FROM bookings
    WHERE date = ${new Date(date)}
    AND status NOT IN ('cancelled', 'refunded')
    FOR UPDATE
  `;

  if (booking.length > 0) return false;

  // Check blackout dates
  const blackout = await this.blackoutRepo.findByDate(date);
  if (blackout) return false;

  // Check Google Calendar
  const isBusy = await this.calendarProvider.isBusy(date);
  if (isBusy) return false;

  return true;
}
```

**Step 3: Wrap Booking Creation in Transaction**

**File**: `server/src/services/booking.service.ts`

```typescript
async onPaymentCompleted(payload: PaymentCompletedPayload): Promise<void> {
  // Double-check idempotency
  const existing = await this.bookingRepo.findByStripeSessionId(payload.sessionId);
  if (existing) {
    logger.warn('Duplicate webhook detected', { sessionId: payload.sessionId });
    return;
  }

  // Use transaction for atomic check + create
  try {
    await this.prisma.$transaction(async (tx) => {
      // Check availability WITH lock
      const isAvailable = await this.availabilityService.isDateAvailableWithLock(
        payload.eventDate,
        tx
      );

      if (!isAvailable) {
        throw new BookingConflictError(payload.eventDate);
      }

      // Create booking (within same transaction)
      const booking = new Booking({
        id: cuid(),
        packageId: payload.packageId,
        eventDate: payload.eventDate,
        coupleName: payload.coupleName,
        email: payload.email,
        phone: payload.phone,
        addOnIds: payload.addOnIds,
        totalCents: payload.totalCents,
        status: 'confirmed',
        stripeSessionId: payload.sessionId,
      });

      await this.bookingRepo.createWithTransaction(booking, tx);

      // Emit event for email notification
      this.eventEmitter.emit('BookingPaid', {
        bookingId: booking.id,
        eventDate: booking.eventDate,
        email: booking.email,
        // ... booking details
      });
    });
  } catch (error) {
    // Handle booking conflict
    if (error instanceof BookingConflictError) {
      // Log conflict for investigation
      logger.error('CRITICAL: Double-booking attempt detected', {
        date: payload.eventDate,
        sessionId: payload.sessionId,
        error: error.message,
      });

      // TODO: Initiate automatic refund
      // TODO: Send apology email to customer

      throw error;
    }

    throw error;
  }
}
```

**Step 4: Handle P2002 Gracefully in Repository**

**File**: `server/src/adapters/prisma/booking.repository.ts`

```typescript
async create(booking: Booking, transaction?: PrismaTransaction): Promise<Booking> {
  try {
    const prisma = transaction || this.prisma;

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: { email: booking.email },
      update: { name: booking.coupleName, phone: booking.phone },
      create: { email: booking.email, name: booking.coupleName, phone: booking.phone },
    });

    // Create booking
    const created = await prisma.booking.create({
      data: {
        id: booking.id,
        customerId: customer.id,
        packageId: booking.packageId,
        date: new Date(booking.eventDate),
        totalPrice: booking.totalCents,
        status: mapToPrismaStatus(booking.status),
        stripeSessionId: booking.stripeSessionId,
        version: 1,
        addOns: {
          create: booking.addOnIds.map((addOnId) => ({
            addOnId,
            quantity: 1,
            unitPrice: 0,  // TODO: Fix in P1-3
          })),
        },
      },
      include: { customer: true, addOns: { select: { addOnId: true } } },
    });

    return this.toDomainBooking(created);
  } catch (error) {
    // Convert Prisma errors to domain errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique constraint violation (date or stripeSessionId)
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('date')) {
          throw new BookingConflictError(booking.eventDate);
        }
        if (target.includes('stripeSessionId')) {
          throw new DuplicateWebhookError(booking.stripeSessionId);
        }
      }
    }
    throw error;
  }
}
```

**Testing**:

```typescript
describe('Race Condition Handling', () => {
  it('prevents double-booking with concurrent webhooks', async () => {
    // Simulate two webhooks for same date arriving simultaneously
    const webhook1 = request(app)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', validSignature1)
      .send({ ...testWebhookPayload, sessionId: 'session_1' });

    const webhook2 = request(app)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', validSignature2)
      .send({ ...testWebhookPayload, sessionId: 'session_2' });

    // Fire both simultaneously
    const [response1, response2] = await Promise.all([webhook1, webhook2]);

    // One succeeds, one fails with conflict
    const success = [response1, response2].filter(r => r.status === 200);
    const conflict = [response1, response2].filter(r => r.status === 500);

    expect(success.length).toBe(1);
    expect(conflict.length).toBe(1);

    // Verify only one booking created
    const bookings = await bookingRepo.findAll();
    expect(bookings.length).toBe(1);
  });
});
```

**Success Criteria**:
- [ ] Version field added to booking table
- [ ] `SELECT FOR UPDATE` lock implemented
- [ ] Transaction wraps availability check + booking creation
- [ ] P2002 error handled gracefully
- [ ] Race condition test passes
- [ ] End-to-end tested with concurrent bookings

**Rollback**: Revert transaction logic, remove version field

---

### P1: Launch Readiness (2-4 weeks)

These issues SHOULD be fixed before or immediately after launch.

[Due to length constraints, I'll summarize the P1 items concisely]

#### P1-1 through P1-8: Additional Launch Readiness Items

- **P1-1**: Email Template Extraction from Adapter (2-3 hours)
- **P1-2**: Add-On Unit Price Fix in Repository (1-2 hours)
- **P1-3**: N+1 Query Optimization in CatalogService (2-3 hours)
- **P1-4**: Orphaned Service Cleanup (1 hour)
- **P1-5**: Calendar .ics Attachment Generation (2-3 hours)
- **P1-6**: Admin Authentication Rate Limiting (2-3 hours)
- **P1-7**: Booking Audit Logging (3-4 hours)
- **P1-8**: Google Calendar Error Handling (2-3 hours)

**Total P1 Effort**: 17-24 hours

---

### P2: Enhancement (4-8 weeks)

[Summarized for length]

- **P2-1**: Email Retry Queue (3-4 hours)
- **P2-2**: Webhook Audit Logging (2-3 hours)
- **P2-3**: Automatic Payment Reconciliation Job (4-6 hours)
- **P2-4**: Redis Distributed Lock for Ultimate Safety (4-6 hours)
- **P2-5**: Customer Self-Service Features (6-8 hours)
- **P2-6**: Admin Dashboard Enhancements (6-8 hours)
- **P2-7**: Performance Optimizations (4-6 hours)
- **P2-8**: Mobile Responsive Design (6-8 hours)
- **P2-9**: Analytics Integration (3-4 hours)
- **P2-10**: Comprehensive API Documentation (4-6 hours)

**Total P2 Effort**: 42-59 hours

---

### P3: Future Features (8+ weeks)

[Summarized for length]

- **P3-1**: Session Management Improvements (4-6 hours)
- **P3-2**: Advanced Error Recovery (6-8 hours)
- **P3-3**: Multi-Package Bookings (8-12 hours)
- **P3-4**: Customer Reviews and Testimonials (6-8 hours)
- **P3-5**: Photo Gallery Management (8-12 hours)
- **P3-6**: Marketing Integration (4-6 hours)

**Total P3 Effort**: 36-52 hours

---

## Phased Implementation Plan

### Phase 1: Launch Preparation (Weeks 1-2)

**Goal**: Fix P0 blockers and launch to production

**Duration**: 2 weeks
**Effort**: 9-13 hours
**Team**: Backend (2), Frontend (1), DevOps (1)

**Deliverables**:
1. Stripe integration wired (P0-1)
2. Webhook error handling (P0-2)
3. Race condition handling (P0-3)
4. Production environment configured
5. End-to-end booking flow tested with real payment

**Success Metrics**:
- Booking completion rate >95%
- Zero double-bookings
- Email delivery rate >98%
- Payment success rate >99%

**Go/No-Go Decision**: End of Week 2
- ✅ GO if all P0 items complete + successful test booking
- ❌ NO-GO if any P0 issues remain

---

### Phase 2: Launch Hardening (Weeks 3-4)

**Goal**: Complete P1 items to ensure production reliability

**Duration**: 2 weeks
**Effort**: 17-24 hours
**Team**: Backend (2), Frontend (1)

**Focus Areas**:
- Email template extraction
- Add-on unit price fix
- N+1 query optimization
- Calendar .ics attachments
- Rate limiting
- Audit logging

**Success Metrics**:
- Email delivery rate >99%
- Calendar integration reliability >98%
- API performance <200ms P99
- Admin security hardened

---

### Phase 3: Post-Launch Monitoring (Weeks 5-8)

**Goal**: Complete P2 items for enhanced reliability

**Duration**: 4 weeks
**Effort**: 42-59 hours
**Team**: Backend (2), Frontend (1)

**Focus Areas**:
- Email retry queue
- Webhook audit logging
- Payment reconciliation
- Redis distributed lock
- Customer self-service
- Admin dashboard enhancements

**Success Metrics**:
- Email retry success >99%
- Payment reconciliation 100%
- Customer satisfaction >4.5/5
- Admin efficiency +20%

---

### Phase 4: Growth Features (Weeks 9+)

**Goal**: Complete P3 items for competitive differentiation

**Duration**: Ongoing
**Effort**: 36-52 hours
**Team**: Full team

**Focus Areas**:
- Session management
- Error recovery
- Multi-package bookings
- Customer reviews
- Photo gallery
- Marketing integration

**Success Metrics**:
- Booking conversion rate +15%
- Customer lifetime value +20%
- Referral rate >30%
- Revenue per wedding +25%

---

## Success Metrics

[Tables showing metrics for each phase]

### Phase 1: Launch

| Metric | Target | Measurement |
|--------|--------|-------------|
| Booking completion rate | >95% | Completed bookings / checkout attempts |
| Zero double-bookings | 100% | No date conflicts |
| Email delivery rate | >98% | Emails delivered / sent |
| Payment success rate | >99% | Successful payments / attempts |

### Phase 2: Hardening

| Metric | Target | Measurement |
|--------|--------|-------------|
| Email delivery rate | >99% | With retry logic |
| Calendar integration | >98% | Successful API calls |
| API performance | <200ms | P99 response time |
| Admin security | 100% | Zero unauthorized access |

### Phase 3: Post-Launch

| Metric | Target | Measurement |
|--------|--------|-------------|
| Email retry success | >99% | Retries delivered / failed |
| Payment reconciliation | 100% | Matched payments / total |
| Customer satisfaction | >4.5/5 | Average rating |
| Admin efficiency | +20% | Time saved |

### Phase 4: Growth

| Metric | Target | Measurement |
|--------|--------|-------------|
| Booking conversion | +15% | Bookings / visitors |
| Customer LTV | +20% | Average revenue per customer |
| Referral rate | >30% | Referral bookings / total |
| Revenue per wedding | +25% | Average package + add-ons |

---

## Risk Assessment

[Comprehensive risk analysis for wedding booking platform]

### Critical Risks (High Impact, High Probability)

#### Risk 1: Double-Booking Occurs

**Impact**: CATASTROPHIC - Business reputation destroyed, potential lawsuits
**Probability**: MEDIUM (race condition exists until P0-3 complete)
**Mitigation**:
- Database unique constraint (defense #1)
- Transaction lock (P0-3)
- Optimistic locking (P0-3)
- Redis distributed lock (P2-4)
- Manual testing before each wedding season

**Contingency**:
- Immediate refund to affected customer
- Apology letter with compensation offer
- Assist customer in finding alternative photographer
- Document incident for legal protection

---

#### Risk 2: Payment Succeeds but Booking Fails

**Impact**: CRITICAL - Customer charged with no booking, reputation damage
**Probability**: MEDIUM (webhook errors until P0-2 complete)
**Mitigation**:
- Webhook error handling (P0-2)
- Idempotency checks (P0-2)
- Automatic reconciliation job (P2-3)
- Daily payment → booking verification

**Contingency**:
- Automatic refund process
- Manual booking creation
- Customer notification
- Reconciliation report

---

### High Risks (High Impact, Medium Probability)

#### Risk 3: Email Confirmations Fail

**Impact**: HIGH - Customer has no booking details, unprofessional experience
**Mitigation**:
- File-sink fallback (already implemented)
- Email retry queue (P2-1)
- Audit logging (P1-7)
- Customer self-service resend (P2-5)

---

#### Risk 4: Stripe Webhook Delivery Failure

**Impact**: HIGH - Payments succeed but no bookings created
**Mitigation**:
- Webhook error handling (P0-2)
- Retry logic (Stripe built-in + custom)
- Webhook audit logging (P2-2)
- Manual reconciliation (P2-3)

---

### Medium Risks

- **Risk 5**: Google Calendar API failure → Mitigation: Fallback to mock, manual override
- **Risk 6**: Admin account compromise → Mitigation: Rate limiting, 2FA (future)
- **Risk 7**: Database performance degradation → Mitigation: Connection pooling, query optimization

---

### Low Risks

- **Risk 8**: Developer onboarding → Mitigation: Excellent documentation, clean architecture
- **Risk 9**: Deployment failures → Mitigation: Automated deployment, rollback procedures
- **Risk 10**: Scope creep → Mitigation: Phased roadmap, clear priorities

---

## Resource Requirements

[Team, infrastructure, and timeline details]

### Team Composition

**Phase 1: Launch Prep (2 weeks)**
- Backend Engineers: 2 FTE
- Frontend Engineer: 1 FTE
- DevOps Engineer: 1 FTE (part-time)

**Phase 2: Launch Hardening (2 weeks)**
- Backend Engineers: 2 FTE
- Frontend Engineer: 1 FTE

**Phase 3: Post-Launch (4 weeks)**
- Backend Engineers: 2 FTE
- Frontend Engineer: 1 FTE

**Phase 4: Growth (Ongoing)**
- Full Stack Engineer: 1 FTE
- Designer: 0.5 FTE (contract)

---

### Infrastructure Costs

**Production Environment** (Monthly):
- Vercel (Frontend): $20/month (Pro plan)
- Render/Fly.io (Backend): $7-20/month (Starter/Hobby)
- Neon/Supabase (Database): $25/month (Pro)
- Postmark (Email): $15/month (100 emails/day)
- Stripe: 2.9% + $0.30 per transaction
- Monitoring: $0 (free tier)
- **Total**: ~$67-80/month + transaction fees

---

### Timeline Summary

| Phase | Duration | Effort | Completion |
|-------|----------|--------|------------|
| Phase 1: Launch Prep | 2 weeks | 9-13 hours | Week 2 |
| Phase 2: Hardening | 2 weeks | 17-24 hours | Week 4 |
| Phase 3: Post-Launch | 4 weeks | 42-59 hours | Week 8 |
| Phase 4: Growth | Ongoing | 36-52 hours | Continuous |

**Total to Launch**: 2 weeks (P0 complete)
**Total to Stable**: 4 weeks (P0 + P1 complete)
**Total to Enhanced**: 8 weeks (P0 + P1 + P2 complete)

---

## Conclusion

Elope is a well-architected wedding booking platform with 90% pre-launch readiness. The system demonstrates excellent engineering fundamentals:

- ✅ **Clean architecture**: Ports/adapters with clear separation of concerns
- ✅ **Type safety**: Prisma-generated types with domain mappers
- ✅ **Testability**: Excellent fake implementations and mock mode
- ✅ **Double-booking protection**: Database unique constraint (primary defense)

**Remaining Launch Blockers** (P0): 3 items, 9-13 hours
1. Wire Stripe integration into BookingService
2. Implement webhook error handling and retry logic
3. Handle double-booking race condition

**Recommended Launch Timeline**: 2 weeks from P0 completion

**Post-Launch Priorities**: Focus on P1 launch hardening (email reliability, audit logging, calendar integration, rate limiting) within 30 days of launch.

**Long-Term Success Factors**:
- ZERO tolerance for double-bookings (mission-critical for reputation)
- Comprehensive webhook error handling (payment → booking atomicity)
- Reliable email confirmations (customer experience)
- Robust calendar integration (availability accuracy)

This roadmap provides a clear path from current 90% readiness to production launch and beyond, with detailed implementation guidance tailored to the unique challenges of a wedding booking platform.

---

**Document Maintained By**: Engineering Team
**Last Updated**: October 24, 2025
**Next Review**: Post-Phase 1 Launch (estimated 2 weeks)
**Questions**: Reference specific improvement IDs in team discussions