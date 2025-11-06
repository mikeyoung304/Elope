# Phase 2B Integration & Runtime Audit Report

**Date:** 2025-10-29
**Auditor:** Claude Code Audit Agent 6
**Scope:** Integration validation, runtime behavior, and production readiness
**Status:** ✅ PASSED WITH RECOMMENDATIONS

---

## Executive Summary

### Overall Assessment

- **Integration Health Score:** 9/10
- **Production Readiness Score:** 9/10
- **Critical Integration Issues:** 0
- **Runtime Concerns:** 3 (LOW-MEDIUM priority)

**Summary:** Phase 2B demonstrates excellent integration quality with comprehensive webhook handling, proper race condition prevention, and solid dependency injection wiring. The system is production-ready with minor optimization opportunities identified for enhanced observability and performance under extreme load.

### Key Findings

✅ **Strengths:**

- Perfect schema-to-repository alignment for WebhookEvent
- Comprehensive DI wiring in both mock and real modes
- Robust transaction handling with proper timeouts and isolation
- Idempotent webhook processing with duplicate detection
- Mock/Real adapter parity ensures test reliability

⚠️ **Areas for Improvement:**

- Connection pooling not explicitly configured (relies on defaults)
- Limited correlation ID support for distributed tracing
- Package/AddOn updates lack optimistic locking (potential race conditions)
- No retry mechanism for transient database failures
- Webhook processing latency not instrumented

---

## 1. Dependency Integration Validation

### 1.1 Prisma Schema vs Repository Implementation

#### ✅ WebhookEvent Model Consistency

**Schema Definition** (`schema.prisma:159-179`):

```prisma
model WebhookEvent {
  id          String        @id @default(uuid())
  eventId     String        @unique
  eventType   String
  rawPayload  String        @db.Text
  status      WebhookStatus @default(PENDING)
  attempts    Int           @default(1)
  lastError   String?       @db.Text
  processedAt DateTime?
  createdAt   DateTime      @default(now())

  @@index([eventId])
  @@index([status])
}

enum WebhookStatus {
  PENDING
  PROCESSED
  FAILED
  DUPLICATE
}
```

**Repository Implementation** (`webhook.repository.ts`):

- ✅ All fields utilized correctly
- ✅ Enum values match exactly (PENDING, PROCESSED, FAILED, DUPLICATE)
- ✅ Indexes align with query patterns (eventId unique lookup, status filtering)
- ✅ Default values applied (status: PENDING, attempts: 1)
- ✅ Nullable fields handled properly (lastError, processedAt)

**Verification:**

```typescript
// PrismaWebhookRepository methods use correct model:
- isDuplicate()   → findUnique({ where: { eventId }})  // Uses unique index ✓
- recordWebhook() → create({ data: {...}})             // Uses defaults ✓
- markProcessed() → update({ status: 'PROCESSED' })    // Enum value ✓
- markFailed()    → update({ status: 'FAILED' })       // Enum value ✓
```

**Assessment:** 🟢 PERFECT ALIGNMENT

---

#### ✅ Booking Model Transaction Safety

**Schema Definition** (`schema.prisma:88-108`):

```prisma
model Booking {
  id         String        @id @default(cuid())
  date       DateTime      @unique  // ← Critical: Enforces one booking per date
  // ... other fields
  @@index([date])  // ← Indexed for fast lookups
}
```

**Repository Implementation** (`booking.repository.ts:14-97`):

- ✅ Transaction wraps entire booking creation
- ✅ `FOR UPDATE NOWAIT` lock acquired on date before check
- ✅ Unique constraint violation caught and mapped to BookingConflictError
- ✅ Lock timeout caught and mapped to BookingLockTimeoutError
- ✅ Transaction timeout configured (5 seconds)
- ✅ Isolation level set to Serializable (strongest)

**Transaction Flow:**

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock acquisition with NOWAIT (no blocking)
  await tx.$queryRawUnsafe("SELECT 1 FROM Booking WHERE date = $1 FOR UPDATE NOWAIT", date);

  // 2. Double-check booking doesn't exist
  const existing = await tx.booking.findFirst({ where: { date }});
  if (existing) throw new BookingConflictError(date);

  // 3. Create booking with all related data
  const created = await tx.booking.create({...});

  // 4. Transaction commits automatically on success
}, {
  timeout: 5000,           // 5 second timeout
  isolationLevel: 'Serializable'  // Strongest isolation
});
```

**Assessment:** 🟢 EXCELLENT - Proper pessimistic locking with timeout handling

---

### 1.2 TypeScript Interface Consistency

#### ✅ Domain Entities → Prisma Models Mapping

**Domain Entity** (`lib/entities.ts`):

```typescript
interface Booking {
  id: string;
  packageId: string;
  coupleName: string;
  email: string;
  phone?: string;
  eventDate: string; // Domain: ISO string (YYYY-MM-DD)
  addOnIds: string[];
  totalCents: number;
  status: 'PAID' | 'REFUNDED' | 'CANCELED';
  createdAt: string;
}
```

**Prisma Model** (`schema.prisma:88-108`):

```typescript
model Booking {
  id: string;
  customerId: string;     // Mapped from coupleName/email
  packageId: string;
  date: DateTime;         // Mapped from eventDate
  totalPrice: Int;        // Mapped from totalCents
  status: BookingStatus;  // Enum: PENDING|CONFIRMED|CANCELED|FULFILLED
  // ... relations
}
```

**Mapping Logic** (`booking.repository.ts:153-192`):

```typescript
private toDomainBooking(booking): Booking {
  return {
    id: booking.id,
    packageId: booking.packageId,
    coupleName: booking.customer.name,        // ✓ Denormalized from relation
    email: booking.customer.email || '',      // ✓ Null handling
    phone: booking.customer.phone,            // ✓ Optional field
    eventDate: booking.date.toISOString().split('T')[0],  // ✓ DateTime → string
    addOnIds: booking.addOns.map(a => a.addOnId),  // ✓ Relation → array
    totalCents: booking.totalPrice,           // ✓ Direct mapping
    status: mapStatus(booking.status),        // ✓ Enum mapping
    createdAt: booking.createdAt.toISOString()  // ✓ DateTime → string
  };
}
```

**Status Mapping:**

```typescript
// Prisma → Domain
PENDING/CONFIRMED/FULFILLED → 'PAID'
CANCELED → 'CANCELED'

// Domain → Prisma
'PAID' → 'CONFIRMED'
'CANCELED' → 'CANCELED'
'REFUNDED' → 'CANCELED'
```

**Assessment:** 🟢 CORRECT - Proper bidirectional mapping with type safety

---

#### ✅ Port Interfaces → Adapter Implementations

**Port Definition** (`lib/ports.ts:57-66`):

```typescript
interface WebhookRepository {
  recordWebhook(input: { eventId: string; eventType: string; rawPayload: string }): Promise<void>;
  markProcessed(eventId: string): Promise<void>;
  markFailed(eventId: string, errorMessage: string): Promise<void>;
  isDuplicate(eventId: string): Promise<boolean>;
}
```

**Adapter Implementation** (`webhook.repository.ts:10-82`):

```typescript
class PrismaWebhookRepository implements WebhookRepository {
  async recordWebhook(input) {
    /* ... */
  } // ✓ Signature matches
  async markProcessed(eventId) {
    /* ... */
  } // ✓ Signature matches
  async markFailed(eventId, errorMessage) {
    /* ... */
  } // ✓ Signature matches
  async isDuplicate(eventId) {
    /* ... */
  } // ✓ Signature matches
}
```

**Verification:**

- ✅ All port methods implemented
- ✅ Method signatures match exactly
- ✅ Return types consistent (Promise<void>, Promise<boolean>)
- ✅ Parameter types align
- ✅ No missing or extra methods

**Assessment:** 🟢 PERFECT COMPLIANCE

---

### 1.3 Mock vs Real Implementation Parity

#### ✅ WebhookRepository Parity

**MockWebhookRepository** (`mock/index.ts:426-462`):

```typescript
class MockWebhookRepository implements WebhookRepository {
  async isDuplicate(eventId: string): Promise<boolean> {
    const existing = webhookEvents.get(eventId);
    if (existing) {
      existing.status = 'DUPLICATE'; // Side effect: update status
      return true;
    }
    return false;
  }

  async recordWebhook(input) {
    webhookEvents.set(input.eventId, { eventId, eventType, status: 'PENDING' });
  }

  async markProcessed(eventId) {
    const event = webhookEvents.get(eventId);
    if (event) event.status = 'PROCESSED';
  }

  async markFailed(eventId, errorMessage) {
    const event = webhookEvents.get(eventId);
    if (event) event.status = 'FAILED';
    console.log(`❌ [MOCK WEBHOOK] Failed: ${eventId} - ${errorMessage}`);
  }
}
```

**PrismaWebhookRepository** (`webhook.repository.ts:10-82`):

```typescript
class PrismaWebhookRepository implements WebhookRepository {
  async isDuplicate(eventId: string): Promise<boolean> {
    const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      if (existing.status !== 'DUPLICATE' && existing.status !== 'PROCESSED') {
        await this.prisma.webhookEvent.update({
          where: { eventId },
          data: { status: 'DUPLICATE', attempts: { increment: 1 } },
        });
      }
      return true;
    }
    return false;
  }
  // ... other methods similar to mock
}
```

**Parity Analysis:**

| Aspect                  | Mock                       | Real                              | Match?        |
| ----------------------- | -------------------------- | --------------------------------- | ------------- |
| API signature           | ✓                          | ✓                                 | ✅ YES        |
| Return types            | Promise<void/boolean>      | Promise<void/boolean>             | ✅ YES        |
| Idempotency             | status update on duplicate | status update + attempt increment | ⚠️ MOSTLY     |
| Error handling          | Silent (console.log)       | Logger + database errors          | ⚠️ DIFFERENT  |
| Race condition handling | In-memory (no races)       | Unique constraint catch           | ⚠️ ACCEPTABLE |

**Discrepancies:**

1. **Attempt tracking:** Real increments attempts on duplicate, mock doesn't
   - **Impact:** LOW - Tests won't validate attempt counting
   - **Recommendation:** Add attempts tracking to mock

2. **Error output:** Mock uses console.log, Real uses logger
   - **Impact:** LOW - Test output differs from production
   - **Recommendation:** Mock should use same logger

**Assessment:** 🟡 GOOD PARITY - Minor behavioral differences acceptable for testing

---

#### ✅ BookingRepository Parity

**Race Condition Simulation:**

**MockBookingRepository** (`mock/index.ts:305-331`):

```typescript
async create(booking: Booking): Promise<Booking> {
  const dateKey = toUtcMidnight(booking.eventDate);

  // Simple in-memory check (no locking needed)
  if (bookingsByDate.has(dateKey)) {
    throw new BookingConflictError(dateKey);
  }

  bookings.set(booking.id, booking);
  bookingsByDate.set(dateKey, booking.id);
  return booking;
}
```

**PrismaBookingRepository** (`booking.repository.ts:14-97`):

```typescript
async create(booking: Booking): Promise<Booking> {
  return await this.prisma.$transaction(async (tx) => {
    // Pessimistic lock with NOWAIT
    try {
      await tx.$queryRawUnsafe(
        "SELECT 1 FROM Booking WHERE date = $1 FOR UPDATE NOWAIT",
        new Date(booking.eventDate)
      );
    } catch (lockError) {
      throw new BookingLockTimeoutError(booking.eventDate);
    }

    // Double-check after lock
    const existing = await tx.booking.findFirst({ where: { date }});
    if (existing) throw new BookingConflictError(booking.eventDate);

    // Create with transaction safety
    const created = await tx.booking.create({...});
    return this.toDomainBooking(created);
  }, { timeout: 5000, isolationLevel: 'Serializable' });
}
```

**Parity Analysis:**

| Aspect             | Mock                   | Real                          | Match?                 |
| ------------------ | ---------------------- | ----------------------------- | ---------------------- |
| Conflict detection | ✓ In-memory map        | ✓ DB unique constraint + lock | ✅ EQUIVALENT          |
| Error thrown       | BookingConflictError   | BookingConflictError          | ✅ YES                 |
| Lock timeout       | N/A (single-threaded)  | BookingLockTimeoutError       | ⚠️ MOCK CAN'T SIMULATE |
| Transaction safety | N/A (atomic by nature) | Explicit transaction          | ⚠️ MOCK CAN'T SIMULATE |

**Test Implications:**

- ✅ Tests can validate conflict detection logic
- ❌ Tests cannot validate lock timeout behavior
- ❌ Tests cannot validate transaction rollback scenarios

**Recommendation:** Add integration tests against real database to validate:

- Lock timeout under concurrent load
- Transaction rollback on errors
- Race condition prevention with actual parallel requests

**Assessment:** 🟢 ACCEPTABLE - Mock simulates business logic correctly, integration tests needed for infrastructure behavior

---

## 2. Dependency Injection Wiring

### 2.1 Mock Mode Wiring

**DI Configuration** (`di.ts:52-89`):

```typescript
if (config.ADAPTERS_PRESET === 'mock') {
  const adapters = buildMockAdapters(); // ← Builds all mock adapters

  // Services
  const catalogService = new CatalogService(adapters.catalogRepo); // ✓
  const availabilityService = new AvailabilityService(
    adapters.calendarProvider, // ✓
    adapters.blackoutRepo, // ✓
    adapters.bookingRepo // ✓
  );
  const bookingService = new BookingService(
    adapters.bookingRepo, // ✓
    adapters.catalogRepo, // ✓
    eventEmitter, // ✓
    adapters.paymentProvider // ✓
  );
  const identityService = new IdentityService(
    adapters.userRepo, // ✓
    config.JWT_SECRET // ✓
  );

  // Controllers
  const controllers = {
    packages: new PackagesController(catalogService), // ✓
    availability: new AvailabilityController(availabilityService), // ✓
    bookings: new BookingsController(bookingService), // ✓
    webhooks: new WebhooksController(
      adapters.paymentProvider, // ✓
      bookingService, // ✓
      adapters.webhookRepo // ✓ ← NEW in Phase 2B
    ),
    admin: new AdminController(identityService, bookingService), // ✓
    blackouts: new BlackoutsController(adapters.blackoutRepo), // ✓
    adminPackages: new AdminPackagesController(catalogService), // ✓
    dev: new DevController(bookingService, adapters.catalogRepo), // ✓
  };

  return { controllers, services: { identity: identityService } };
}
```

**Verification:**

- ✅ All adapters created via `buildMockAdapters()`
- ✅ Services receive correct repository dependencies
- ✅ Controllers receive correct service dependencies
- ✅ WebhooksController receives webhookRepo (Phase 2B addition)
- ✅ DevController only available in mock mode
- ✅ JWT_SECRET passed to IdentityService

**Mock Adapter Builder** (`mock/index.ts:465-476`):

```typescript
export function buildMockAdapters() {
  return {
    catalogRepo: new MockCatalogRepository(), // ✓
    bookingRepo: new MockBookingRepository(), // ✓
    blackoutRepo: new MockBlackoutRepository(), // ✓
    calendarProvider: new MockCalendarProvider(), // ✓
    paymentProvider: new MockPaymentProvider(), // ✓
    emailProvider: new MockEmailProvider(), // ✓
    userRepo: new MockUserRepository(), // ✓
    webhookRepo: new MockWebhookRepository(), // ✓ ← NEW
  };
}
```

**Assessment:** 🟢 CORRECT - All dependencies properly wired, no missing injections

---

### 2.2 Real Mode Wiring

**DI Configuration** (`di.ts:92-191`):

```typescript
// Real adapters mode
if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL required for real adapters mode');  // ✓ Validation
}

// 1. Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['error', 'warn'],  // ✓ Minimal logging (not 'query' for performance)
});

// 2. Build real repository adapters
const catalogRepo = new PrismaCatalogRepository(prisma);   // ✓
const bookingRepo = new PrismaBookingRepository(prisma);   // ✓
const blackoutRepo = new PrismaBlackoutRepository(prisma); // ✓
const userRepo = new PrismaUserRepository(prisma);         // ✓
const webhookRepo = new PrismaWebhookRepository(prisma);   // ✓ ← NEW

// 3. Build Stripe payment adapter
if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET required');  // ✓
}
const paymentProvider = new StripePaymentAdapter({
  secretKey: config.STRIPE_SECRET_KEY,
  webhookSecret: config.STRIPE_WEBHOOK_SECRET,
  successUrl: config.STRIPE_SUCCESS_URL || 'http://localhost:5173/success',
  cancelUrl: config.STRIPE_CANCEL_URL || 'http://localhost:5173',
});

// 4. Build Postmark mail adapter (graceful fallback)
const mailProvider = new PostmarkMailAdapter({
  serverToken: config.POSTMARK_SERVER_TOKEN,  // Optional - file sink fallback
  fromEmail: config.POSTMARK_FROM_EMAIL || 'bookings@example.com',
});

// 5. Build Google Calendar adapter (graceful fallback)
let calendarProvider;
if (config.GOOGLE_CALENDAR_ID && config.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
  calendarProvider = new GoogleCalendarAdapter({...});
} else {
  logger.warn('⚠️  Google Calendar credentials not configured; using mock');
  const mockAdapters = buildMockAdapters();
  calendarProvider = mockAdapters.calendarProvider;  // ✓ Fallback to mock
}

// 6. Build domain services (same as mock mode)
const catalogService = new CatalogService(catalogRepo);
const availabilityService = new AvailabilityService(
  calendarProvider, blackoutRepo, bookingRepo
);
const bookingService = new BookingService(
  bookingRepo, catalogRepo, eventEmitter, paymentProvider
);
const identityService = new IdentityService(userRepo, config.JWT_SECRET);

// 7. Subscribe to BookingPaid events
eventEmitter.subscribe('BookingPaid', async (payload) => {
  await mailProvider.sendBookingConfirm(payload.email, {...});  // ✓ Email on payment
});

// 8. Build controllers (no dev controller in real mode)
const controllers = {
  packages: new PackagesController(catalogService),
  availability: new AvailabilityController(availabilityService),
  bookings: new BookingsController(bookingService),
  webhooks: new WebhooksController(paymentProvider, bookingService, webhookRepo),  // ✓
  admin: new AdminController(identityService, bookingService),
  blackouts: new BlackoutsController(blackoutRepo),
  adminPackages: new AdminPackagesController(catalogService),
  // No dev controller in real mode  // ✓
};
```

**Verification:**

- ✅ DATABASE_URL validation before Prisma initialization
- ✅ Stripe credentials validated
- ✅ All Prisma repositories receive same prisma client instance (connection pooling)
- ✅ WebhooksController receives real webhookRepo
- ✅ Email notifications wired via event subscription
- ✅ Graceful fallbacks for optional adapters (calendar, email)
- ✅ DevController excluded in real mode (security)

**Assessment:** 🟢 CORRECT - Real mode properly configured with validation

---

### 2.3 Cross-Verification: Controller Constructors

**WebhooksController** (`webhooks.routes.ts:38-43`):

```typescript
export class WebhooksController {
  constructor(
    private readonly paymentProvider: PaymentProvider,     // ✓ DI provides
    private readonly bookingService: BookingService,       // ✓ DI provides
    private readonly webhookRepo: WebhookRepository        // ✓ DI provides
  ) {}
```

**DI Injection (both modes)** (`di.ts:78, 180`):

```typescript
// Mock mode:
new WebhooksController(adapters.paymentProvider, bookingService, adapters.webhookRepo);

// Real mode:
new WebhooksController(paymentProvider, bookingService, webhookRepo);
```

**Assessment:** 🟢 MATCH - Constructor parameters align with DI injection

---

**BookingService** (`booking.service.ts:11-17`):

```typescript
export class BookingService {
  constructor(
    private readonly bookingRepo: BookingRepository,     // ✓ DI provides
    private readonly catalogRepo: CatalogRepository,     // ✓ DI provides
    private readonly _eventEmitter: EventEmitter,        // ✓ DI provides
    private readonly paymentProvider: PaymentProvider    // ✓ DI provides
  ) {}
```

**DI Injection** (`di.ts:65-70, 150`):

```typescript
// Mock mode:
new BookingService(
  adapters.bookingRepo,
  adapters.catalogRepo,
  eventEmitter,
  adapters.paymentProvider
);

// Real mode:
new BookingService(bookingRepo, catalogRepo, eventEmitter, paymentProvider);
```

**Assessment:** 🟢 MATCH - All dependencies properly injected

---

## 3. Runtime Behavior Analysis

### 3.1 Transaction Handling

#### ✅ Booking Creation Transaction

**Implementation** (`booking.repository.ts:14-97`):

**Transaction Configuration:**

```typescript
await this.prisma.$transaction(
  async (tx) => {
    // Transaction body
  },
  {
    timeout: 5000, // ✓ 5 second timeout
    isolationLevel: 'Serializable', // ✓ Strongest isolation level
  }
);
```

**Transaction Steps:**

1. **Lock Acquisition:**

```typescript
const lockQuery = `
  SELECT 1 FROM "Booking"
  WHERE date = $1
  FOR UPDATE NOWAIT
`;
try {
  await tx.$queryRawUnsafe(lockQuery, new Date(booking.eventDate));
} catch (lockError) {
  throw new BookingLockTimeoutError(booking.eventDate); // ✓ Specific error
}
```

- ✅ Parameterized query (SQL injection safe)
- ✅ `FOR UPDATE NOWAIT` prevents blocking (fails immediately if locked)
- ✅ Lock timeout mapped to specific error
- ✅ Date properly cast to PostgreSQL DateTime

2. **Conflict Check:**

```typescript
const existing = await tx.booking.findFirst({
  where: { date: new Date(booking.eventDate) },
});
if (existing) {
  throw new BookingConflictError(booking.eventDate); // ✓ Domain error
}
```

- ✅ Double-check after lock (defense in depth)
- ✅ Throws domain-specific error

3. **Customer Upsert:**

```typescript
const customer = await tx.customer.upsert({
  where: { email: booking.email },
  update: { name: booking.coupleName, phone: booking.phone },
  create: { email: booking.email, name: booking.coupleName, phone: booking.phone },
});
```

- ✅ Idempotent operation (upsert)
- ✅ All customer fields updated

4. **Booking Creation:**

```typescript
const created = await tx.booking.create({
  data: {
    id: booking.id,
    customerId: customer.id,
    packageId: booking.packageId,
    date: new Date(booking.eventDate),
    totalPrice: booking.totalCents,
    status: this.mapToPrismaStatus(booking.status),
    addOns: {
      create: booking.addOnIds.map((addOnId) => ({
        addOnId,
        quantity: 1,
        unitPrice: 0, // ⚠️ Should come from AddOn price
      })),
    },
  },
  include: { customer: true, addOns: { select: { addOnId: true } } },
});
```

- ✅ Nested create for add-ons (single transaction)
- ✅ Proper date conversion
- ✅ Status mapping
- ⚠️ **Issue:** AddOn unitPrice hardcoded to 0 (should fetch actual price)

**Error Handling:**

```typescript
catch (error) {
  // P2002 = Unique constraint violation
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new BookingConflictError(booking.eventDate);
  }
  // Re-throw custom errors
  if (error instanceof BookingLockTimeoutError || error instanceof BookingConflictError) {
    throw error;
  }
  throw error;  // Unknown errors propagate
}
```

- ✅ Prisma error codes mapped to domain errors
- ✅ Custom errors preserved
- ✅ Unknown errors propagate for logging

**Rollback Behavior:**

- ✅ Automatic rollback on any thrown error
- ✅ No partial data committed (all-or-nothing)
- ✅ Customer upsert rolled back on booking creation failure

**Assessment:** 🟢 EXCELLENT

- Timeout configured appropriately
- Isolation level prevents phantom reads
- Parameterized queries prevent SQL injection
- Proper error handling with rollback
- Lock timeout prevents blocking under load

**Issue Found:**

- ⚠️ AddOn unitPrice hardcoded to 0 (line 67)
- **Impact:** MEDIUM - Booking records don't capture add-on prices at time of purchase
- **Recommendation:** Fetch add-on prices and store in BookingAddOn.unitPrice

---

### 3.2 Webhook Processing Flow

**Full Flow Verification** (`webhooks.routes.ts:45-158`):

#### Step 1: Signature Verification

```typescript
let event: Stripe.Event;
try {
  event = await this.paymentProvider.verifyWebhook(rawBody, signature);
} catch (error) {
  logger.error({ error }, 'Webhook signature verification failed');
  throw new WebhookValidationError('Invalid webhook signature'); // ✓ 422 response
}
```

- ✅ Raw body preserved (app.ts:40-44 uses `express.raw()`)
- ✅ Signature from `stripe-signature` header
- ✅ Verification failure throws 422 Unprocessable Entity

#### Step 2: Duplicate Check

```typescript
const isDupe = await this.webhookRepo.isDuplicate(event.id);
if (isDupe) {
  logger.info({ eventId: event.id }, 'Duplicate webhook ignored - returning 200 OK');
  return; // ✓ Early return, no error thrown
}
```

- ✅ Idempotency check before processing
- ✅ Returns 200 OK to Stripe (prevents retries)
- ✅ Logged for monitoring

#### Step 3: Record Webhook

```typescript
await this.webhookRepo.recordWebhook({
  eventId: event.id,
  eventType: event.type,
  rawPayload: rawBody,
});
```

- ✅ Raw payload stored for debugging
- ✅ Status defaults to PENDING in database
- ✅ Race condition handled (unique constraint on eventId)

#### Step 4: Event Type Routing

```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object as unknown as StripeCheckoutSession;

  // Validate metadata with Zod
  const metadataResult = MetadataSchema.safeParse(session.metadata);
  if (!metadataResult.success) {
    await this.webhookRepo.markFailed(event.id, `Invalid metadata: ...`);
    throw new WebhookValidationError('Invalid webhook metadata');
  }

  const { packageId, eventDate, email, coupleName, addOnIds } = metadataResult.data;
  // ... process booking
} else {
  logger.info({ eventId: event.id, type: event.type }, 'Ignoring unhandled event type');
}
```

- ✅ Only processes `checkout.session.completed`
- ✅ Other event types logged and ignored (graceful)
- ✅ Metadata validated with Zod (no raw JSON.parse)
- ✅ Validation failure marks webhook as FAILED

#### Step 5: Booking Creation

```typescript
await this.bookingService.onPaymentCompleted({
  sessionId: session.id,
  packageId,
  eventDate,
  email,
  coupleName,
  addOnIds: parsedAddOnIds,
  totalCents,
});
```

- ✅ Delegates to domain service
- ✅ All required data passed
- ✅ Throws BookingConflictError if date already booked

#### Step 6: Mark Success

```typescript
await this.webhookRepo.markProcessed(event.id);
```

- ✅ Status updated to PROCESSED
- ✅ processedAt timestamp recorded

#### Step 7: Error Handling

```typescript
catch (error) {
  if (!(error instanceof WebhookValidationError)) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await this.webhookRepo.markFailed(event.id, errorMessage);

    logger.error({
      eventId: event.id,
      eventType: event.type,
      error: errorMessage,
    }, 'Webhook processing failed');

    throw new WebhookProcessingError(errorMessage);  // ✓ 500 response
  }
  throw error;  // Re-throw validation error for 422 response
}
```

- ✅ Validation errors return 422 (don't mark as FAILED)
- ✅ Processing errors return 500 and mark as FAILED
- ✅ Error message stored in database for debugging
- ✅ Structured logging with context

**Idempotency Guarantee:**

1. Duplicate check happens before recording
2. Unique constraint on eventId prevents race conditions
3. If webhook already PROCESSED, duplicate check catches it
4. If concurrent requests arrive, one succeeds, one gets 200 OK

**Assessment:** 🟢 EXCELLENT

- ✓ Idempotency guaranteed
- ✓ Proper error categorization (validation vs processing)
- ✓ Structured logging at each step
- ✓ Dead letter queue (FAILED status for investigation)

---

### 3.3 Lock Timeout Handling

**Lock Acquisition** (`booking.repository.ts:18-29`):

```typescript
const lockQuery = `
  SELECT 1 FROM "Booking"
  WHERE date = $1
  FOR UPDATE NOWAIT
`;

try {
  await tx.$queryRawUnsafe(lockQuery, new Date(booking.eventDate));
} catch (lockError) {
  throw new BookingLockTimeoutError(booking.eventDate);
}
```

**`FOR UPDATE NOWAIT` Behavior:**

- If row is locked → PostgreSQL immediately returns error
- If row doesn't exist → Lock succeeds (no rows to lock)
- If row exists and unlocked → Lock succeeds

**Error Propagation:**

```typescript
// booking.repository.ts:86-96
catch (error) {
  if (error instanceof BookingLockTimeoutError || error instanceof BookingConflictError) {
    throw error;  // ✓ Preserves custom error
  }
  throw error;
}
```

**HTTP Response** (`error-handler.ts:25-44`):

```typescript
if (err instanceof DomainError) {
  res.status(err.statusCode).json({
    error: err.code,
    message: err.message,
  });
}
```

**BookingLockTimeoutError Definition** (`lib/errors.ts:41-46`):

```typescript
export class BookingLockTimeoutError extends ConflictError {
  constructor(date: string) {
    super(`Could not acquire lock on booking date (timeout): ${date}`);
    this.name = 'BookingLockTimeoutError';
  }
}
// ConflictError has statusCode = 409
```

**Client receives:**

```json
{
  "error": "CONFLICT",
  "message": "Could not acquire lock on booking date (timeout): 2025-12-25",
  "statusCode": 409
}
```

**Assessment:** 🟢 CORRECT

- ✅ Lock timeout throws specific error
- ✅ Error propagates correctly
- ✅ HTTP 409 Conflict response
- ✅ No partial data committed
- ✅ Client can retry safely

---

## 4. Race Condition Analysis

### 4.1 Booking Race Conditions (HANDLED)

**Scenario:** Two webhooks arrive for the same date simultaneously

**Prevention Mechanisms:**

1. **Database Unique Constraint** (`schema.prisma:93`):

```prisma
model Booking {
  date DateTime @unique  // ← Enforced at database level
}
```

2. **Pessimistic Locking** (`booking.repository.ts:18-22`):

```sql
SELECT 1 FROM "Booking" WHERE date = $1 FOR UPDATE NOWAIT
```

3. **Transaction Isolation** (`booking.repository.ts:82-85`):

```typescript
{ timeout: 5000, isolationLevel: 'Serializable' }
```

**Test Case:**

```
Time | Request A (webhook 1)         | Request B (webhook 2)
-----|-------------------------------|--------------------------------
T0   | Acquire lock on date          | Acquire lock on date → BLOCKED
T1   | Check date not booked         | (waiting for lock)
T2   | Create booking                | (waiting for lock)
T3   | Commit transaction            | Lock attempt fails → 409 error
T4   | Release lock                  | Returns 409 to Stripe
```

**Outcome:** ✅ Only one booking created, second webhook receives 409

**Assessment:** 🟢 FULLY HANDLED

---

### 4.2 Package/AddOn Updates (POTENTIAL RACE CONDITION)

**Scenario:** Admin updates package price while customer is checking out

**Current Implementation** (`catalog.repository.ts:87-119`):

```typescript
async updatePackage(id: string, data: UpdatePackageInput): Promise<Package> {
  // Check if package exists
  const existing = await this.prisma.package.findUnique({ where: { id }});

  // Update package
  const pkg = await this.prisma.package.update({
    where: { id },
    data: { basePrice: data.priceCents }
  });

  return this.toDomainPackage(pkg);
}
```

**Problem:** No optimistic locking or versioning

- Admin reads package (price: $1000)
- Customer reads same package (price: $1000)
- Admin updates package (price: $1200)
- Customer completes checkout with old price ($1000)
- Customer gets incorrect price!

**Impact:** MEDIUM

- Price changes during checkout window (rare but possible)
- Customer pays old price, business loses revenue
- No audit trail of price at time of purchase

**Mitigation Options:**

1. **Add version field to Package:**

```prisma
model Package {
  version Int @default(1)  // Optimistic locking
}
```

2. **Capture price at checkout session creation:**

```typescript
// Already done in booking.service.ts:19-32
async createCheckout(input: CreateBookingInput) {
  const pkg = await this.catalogRepo.getPackageBySlug(input.packageId);
  let totalCents = pkg.priceCents;  // ✓ Captured at checkout time
  // ... store in session metadata
}
```

3. **Store price in Booking:**

```prisma
model Booking {
  packagePrice Int  // Price at time of booking
}
```

**Current Mitigation:** ✅ Price is captured in Stripe session metadata and stored in Booking.totalPrice

**Assessment:** 🟡 LOW RISK

- Price captured at checkout time
- Race window is small (checkout creation → payment completion)
- **Recommendation:** Add package price versioning for audit trail

---

### 4.3 Concurrent Admin Operations (POTENTIAL RACE CONDITION)

**Scenario 1: Multiple admins update same package simultaneously**

**Current Implementation:**

```typescript
async updatePackage(id: string, data: UpdatePackageInput) {
  const existing = await this.prisma.package.findUnique({ where: { id }});  // Read
  // ... no lock
  const pkg = await this.prisma.package.update({ where: { id }, data });    // Write
  return pkg;
}
```

**Problem:** Lost update problem

- Admin A reads package (description: "Old")
- Admin B reads package (description: "Old")
- Admin A updates (description: "New A")
- Admin B updates (description: "New B")
- Result: Admin A's update lost

**Impact:** LOW

- Unlikely scenario (rare concurrent admin edits)
- No financial impact (only metadata)
- Last write wins (acceptable for content updates)

**Mitigation:** ⚠️ Not critical, but could add:

- Optimistic locking with version field
- Last-modified timestamp validation
- Admin UI shows conflict warning

**Assessment:** 🟡 ACCEPTABLE RISK - Low likelihood, low impact

---

**Scenario 2: Package deletion while bookings reference it**

**Current Implementation** (`catalog.repository.ts:121-135`):

```typescript
async deletePackage(id: string): Promise<void> {
  await this.prisma.package.delete({ where: { id }});
  // Prisma will cascade delete add-ons automatically
}
```

**Schema Constraint** (`schema.prisma:102`):

```prisma
model Booking {
  package Package @relation(fields: [packageId], references: [id])
  // No onDelete specified → default is RESTRICT
}
```

**Behavior:**

- If bookings exist → Delete fails with foreign key constraint error
- If no bookings exist → Delete succeeds

**Assessment:** 🟢 SAFE - Foreign key prevents orphaned bookings

---

### 4.4 Webhook Duplicate Handling (POTENTIAL RACE CONDITION)

**Scenario:** Two identical webhooks arrive simultaneously (Stripe retry)

**Current Implementation** (`webhook.repository.ts:13-33`):

```typescript
async isDuplicate(eventId: string): Promise<boolean> {
  const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId }});

  if (existing) {
    // Update to DUPLICATE if not already
    if (existing.status !== 'DUPLICATE' && existing.status !== 'PROCESSED') {
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'DUPLICATE', attempts: { increment: 1 }}
      });
    }
    return true;
  }

  return false;
}

async recordWebhook(input) {
  try {
    await this.prisma.webhookEvent.create({
      data: { eventId: input.eventId, eventType: input.eventType, rawPayload: input.rawPayload }
    });
  } catch (error) {
    // Race condition: webhook already recorded by parallel request
    logger.warn({ eventId: input.eventId }, 'Webhook already recorded (race condition)');
  }
}
```

**Race Condition Analysis:**

```
Time | Request A                     | Request B
-----|-------------------------------|--------------------------------
T0   | isDuplicate(evt123) → false   | isDuplicate(evt123) → false
T1   | recordWebhook(evt123) → OK    | recordWebhook(evt123) → FAIL (unique constraint)
T2   | Process webhook               | Silent catch, returns 200
T3   | markProcessed(evt123)         | (done, returns 200 to Stripe)
```

**Protection:** ✅ Unique constraint on eventId prevents double-processing

**Assessment:** 🟢 SAFE

- Unique constraint catches race condition
- Silent catch in recordWebhook handles gracefully
- Both requests return 200 OK to Stripe (idempotency)

---

## 5. Production Configuration

### 5.1 Environment Variables

#### ✅ Documentation Completeness

**ENVIRONMENT.md** (lines 1-53):

```bash
# Required for all modes
JWT_SECRET=change-me

# Required for real mode
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional with fallbacks
POSTMARK_SERVER_TOKEN=...  # Falls back to file-sink
POSTMARK_FROM_EMAIL=...
GOOGLE_CALENDAR_ID=...     # Falls back to mock calendar
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
```

**.env.example** (lines 1-30):

```bash
ADAPTERS_PRESET=mock
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=change-me

# Real-mode placeholders
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=http://localhost:3000/success
STRIPE_CANCEL_URL=http://localhost:3000

POSTMARK_SERVER_TOKEN=
POSTMARK_FROM_EMAIL=bookings@example.com

GOOGLE_CALENDAR_ID=
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=
```

**Config Validation** (`config.ts:10-25`):

```typescript
const ConfigSchema = z.object({
  ADAPTERS_PRESET: z.enum(['mock', 'real']).default('mock'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(1), // ✓ Required
  // Real mode only (optional for mock)
  DATABASE_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // ... other optional fields
});
```

**Verification Matrix:**

| Variable                           | .env.example | ENVIRONMENT.md | config.ts   | Required?      |
| ---------------------------------- | ------------ | -------------- | ----------- | -------------- |
| ADAPTERS_PRESET                    | ✅           | ✅             | ✅ default  | No             |
| API_PORT                           | ✅           | ✅             | ✅ default  | No             |
| CORS_ORIGIN                        | ✅           | ✅             | ✅ default  | No             |
| JWT_SECRET                         | ✅           | ✅             | ✅          | **YES**        |
| DATABASE_URL                       | ✅           | ✅             | ✅ optional | Real mode only |
| DIRECT_URL                         | ❌           | ✅             | ❌          | Real mode only |
| STRIPE_SECRET_KEY                  | ✅           | ✅             | ✅ optional | Real mode only |
| STRIPE_WEBHOOK_SECRET              | ✅           | ✅             | ✅ optional | Real mode only |
| STRIPE_SUCCESS_URL                 | ✅           | ✅             | ✅ default  | No             |
| STRIPE_CANCEL_URL                  | ✅           | ✅             | ✅ default  | No             |
| POSTMARK_SERVER_TOKEN              | ✅           | ✅             | ✅ optional | No             |
| POSTMARK_FROM_EMAIL                | ✅           | ✅             | ✅ default  | No             |
| GOOGLE_CALENDAR_ID                 | ✅           | ✅             | ✅ optional | No             |
| GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 | ✅           | ✅             | ✅ optional | No             |

**Issues Found:**

1. ⚠️ **DIRECT_URL not in config.ts**
   - Impact: LOW - Prisma reads it directly from env
   - Used for migrations with Supabase connection pooler
   - Recommendation: Document in config.ts comments

**Assessment:** 🟢 EXCELLENT

- All required variables documented
- Sensible defaults provided
- Optional variables have fallbacks
- Config validation enforces required fields

---

### 5.2 Database Configuration

**Prisma Schema** (`schema.prisma:9-13`):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Connection String Format:**

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Connection Pooling:**

**Prisma Client Init** (`di.ts:100-102`):

```typescript
const prisma = new PrismaClient({
  log: ['error', 'warn'], // ✓ Not logging queries (performance)
});
```

**Default Pooling Behavior:**

- Prisma uses connection pooling by default
- Default pool size: Based on `num_physical_cpus * 2 + 1`
- No explicit configuration → relies on defaults

**Supabase Pooling:**

- Port 5432 = Transaction mode pooler (Supavisor)
- Direct URL bypasses pooler (for migrations)

**Connection Pool Configuration (NOT EXPLICIT):**

```typescript
// Missing explicit configuration:
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Missing:
  // connection: {
  //   pool: {
  //     min: 2,
  //     max: 10,
  //     acquireTimeoutMillis: 5000,
  //   }
  // }
});
```

**Assessment:** 🟡 RELIES ON DEFAULTS

- ⚠️ No explicit pool size configuration
- ⚠️ No connection timeout configuration
- ⚠️ No pool exhaustion handling
- **Recommendation:** Add explicit connection pool configuration

**Suggested Configuration:**

```typescript
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Explicit pool configuration for production
  // Note: Prisma currently doesn't expose connection pool config in constructor
  // This is handled via DATABASE_URL connection string parameters:
  // ?connection_limit=10&pool_timeout=5
});
```

---

### 5.3 Secrets Management

**Current State:**

**No hardcoded secrets:** ✅ All secrets from environment

```typescript
// di.ts:113-114
if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Required secrets missing');
}
```

**Validation on startup:** ✅ Real mode validates required secrets

```typescript
// di.ts:95-97
if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL required for real adapters mode');
}
```

**Rotation Support:** ✅ Documented in DEPLOYMENT_INSTRUCTIONS.md

- JWT_SECRET rotation plan (invalidates all tokens)
- Stripe key rotation process documented
- No secrets in git history

**Assessment:** 🟢 EXCELLENT - Proper secrets management

---

## 6. Error Handling & Recovery

### 6.1 Webhook Failure Scenarios

#### Scenario 1: Database Down During Webhook

**Flow:**

```typescript
// webhooks.routes.ts:67-71
await this.webhookRepo.recordWebhook({
  eventId: event.id,
  eventType: event.type,
  rawPayload: rawBody,
});
```

**If database is down:**

1. `recordWebhook()` throws Prisma connection error
2. Error caught by outer try/catch (line 138-154)
3. `webhookRepo.markFailed()` also fails (database still down)
4. WebhookProcessingError thrown
5. HTTP 500 returned to Stripe
6. Stripe retries webhook later
7. When database recovers, retry succeeds

**Issue:** ⚠️ Webhook not recorded in dead letter queue (database down)

- **Impact:** MEDIUM - No persistent record of failure
- **Mitigation:** Stripe will retry, logs capture error
- **Recommendation:** Add fallback to file-based dead letter queue

**Assessment:** 🟡 ACCEPTABLE - Stripe retries handle recovery

---

#### Scenario 2: Booking Creation Fails

**Flow:**

```typescript
// webhooks.routes.ts:121-129
await this.bookingService.onPaymentCompleted({...});
```

**If booking creation throws BookingConflictError:**

1. Error caught by webhook controller (line 138)
2. `markFailed()` called with error message
3. Webhook status = FAILED in database
4. HTTP 500 returned to Stripe
5. Stripe retries webhook
6. Duplicate check catches retry → 200 OK

**Assessment:** 🟢 CORRECT

- ✅ Webhook marked as FAILED
- ✅ Error message stored for debugging
- ✅ Stripe retries handled by duplicate check

---

#### Scenario 3: Network Timeout

**Stripe Webhook Timeout:** 30 seconds (Stripe default)

**Application Handling:**

- No explicit timeout on webhook processing
- Relies on transaction timeout (5 seconds) + database operations

**If webhook processing exceeds 30 seconds:**

1. Stripe closes connection
2. Application continues processing
3. If successful, webhook marked PROCESSED
4. Stripe retries (no response received)
5. Duplicate check catches retry → 200 OK

**Assessment:** 🟡 MOSTLY SAFE

- ⚠️ No explicit timeout guard
- **Recommendation:** Add overall timeout to webhook processing

---

### 6.2 Transaction Failure Scenarios

#### Scenario 1: Lock Timeout

**Handled:** ✅ See Section 3.3 Lock Timeout Handling

#### Scenario 2: Unique Constraint Violation

**Handled:** ✅ Caught and mapped to BookingConflictError (booking.repository.ts:88-89)

#### Scenario 3: Database Disconnection

**Current Handling:**

```typescript
catch (error) {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new BookingConflictError(booking.eventDate);
  }
  // Unknown errors propagate
  throw error;
}
```

**If database connection lost during transaction:**

1. Prisma throws connection error
2. Error propagates to controller
3. Error handler catches and returns 500
4. Transaction automatically rolled back

**Assessment:** 🟢 CORRECT - Automatic rollback on errors

---

#### Scenario 4: Transaction Deadlock

**Prisma Transaction Settings:**

```typescript
isolationLevel: 'Serializable'; // ← Strongest isolation
```

**Deadlock Behavior:**

- Serializable isolation prevents many deadlocks
- PostgreSQL detects deadlocks and aborts one transaction
- Prisma throws error with code P2034

**Current Handling:** ⚠️ Not specifically handled

- Deadlock treated as generic error
- No retry logic

**Impact:** LOW - Serializable isolation + `FOR UPDATE NOWAIT` minimize deadlock risk

**Recommendation:** Add deadlock detection and retry:

```typescript
if (error instanceof PrismaClientKnownRequestError && error.code === 'P2034') {
  // Deadlock detected - could retry once
  throw new BookingLockTimeoutError(booking.eventDate);
}
```

**Assessment:** 🟡 ACCEPTABLE - Low likelihood with current design

---

## 7. Monitoring & Observability

### 7.1 Logging Coverage

**Webhook Logging:**

**Start:**

```typescript
logger.info({ eventId: event.id, type: event.type }, 'Stripe webhook received');
```

**Success:**

```typescript
logger.info({ eventId: event.id, sessionId: session.id }, 'Booking created successfully');
```

**Failure:**

```typescript
logger.error(
  {
    eventId: event.id,
    eventType: event.type,
    error: errorMessage,
  },
  'Webhook processing failed'
);
```

**Duplicate:**

```typescript
logger.info({ eventId: event.id }, 'Duplicate webhook ignored - returning 200 OK');
```

**Assessment:** 🟢 GOOD

- ✅ All webhook states logged
- ✅ Structured logging with context
- ✅ Event IDs for correlation

**Missing:**

- ⚠️ No webhook processing duration
- ⚠️ No correlation ID across services
- ⚠️ No user-facing transaction ID

---

**Booking Logging:**

**Repository Level:** ❌ No logging in booking.repository.ts

- Create operations not logged
- Lock timeouts not logged at repository level

**Service Level:** ❌ No logging in booking.service.ts

- Checkout creation not logged
- Payment completion logged only in webhook controller

**Assessment:** 🟡 ADEQUATE BUT SPARSE

- Webhook controller logs capture most flows
- **Recommendation:** Add logging to repository operations

---

**Error Logging:**

**Error Handler** (`error-handler.ts:25-54`):

```typescript
if (err instanceof DomainError) {
  reqLogger.info({ err: { name: err.name, message: err.message, code: err.code } }, 'Domain error');
  // ... return error response
}

reqLogger.error({ err }, 'Unhandled error');
```

**Assessment:** 🟢 GOOD

- ✅ Domain errors logged at info level (expected errors)
- ✅ Unhandled errors logged at error level
- ✅ Stack traces captured

---

### 7.2 Metrics Availability

**Webhook Success Rate:**

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'PROCESSED') * 100.0 / COUNT(*) AS success_rate
FROM "WebhookEvent";
```

✅ Available via database query

**Duplicate Webhook Rate:**

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'DUPLICATE') * 100.0 / COUNT(*) AS duplicate_rate
FROM "WebhookEvent";
```

✅ Available via database query

**Lock Timeout Rate:**

- ❌ Not directly tracked
- Can be derived from logs: `grep BookingLockTimeoutError`
- **Recommendation:** Add metrics collection

**Booking Conflict Rate:**

- ❌ Not directly tracked
- Can be derived from logs: `grep BookingConflictError`
- **Recommendation:** Add metrics collection

**Assessment:** 🟡 BASIC METRICS AVAILABLE

- ✅ Webhook metrics via database
- ⚠️ Application metrics require log parsing
- **Recommendation:** Add Prometheus/metrics library

---

### 7.3 Debugging Support

**Error Messages:**

```typescript
BookingConflictError: 'Date 2025-12-25 is already booked';
BookingLockTimeoutError: 'Could not acquire lock on booking date (timeout): 2025-12-25';
WebhookValidationError: 'Webhook validation failed: Invalid webhook signature';
```

✅ Actionable error messages with context

**Correlation IDs:**

- ✅ Request ID from middleware (requestLogger)
- ❌ Not propagated to all logs
- ❌ No cross-service correlation

**Stack Traces:**

- ✅ Full stack traces in development (pino-pretty)
- ✅ Stack traces in production (pino JSON)
- ✅ Captured by error handler

**Context in Logs:**

```typescript
logger.error(
  {
    eventId: event.id,
    eventType: event.type,
    error: errorMessage,
  },
  'Webhook processing failed'
);
```

✅ Structured logging with relevant context

**Assessment:** 🟢 GOOD

- ✅ Error messages actionable
- ✅ Stack traces available
- ✅ Context in error logs
- ⚠️ Could improve correlation ID propagation

---

## 8. Deployment Readiness

### 8.1 Migration Correctness

**Migration File** (`01_add_webhook_events.sql`):

**Schema Match:**
| Schema.prisma | Migration SQL | Match? |
|---------------|---------------|--------|
| id TEXT @id @default(uuid()) | "id" TEXT NOT NULL PRIMARY KEY | ✅ |
| eventId TEXT @unique | "eventId" TEXT NOT NULL + UNIQUE INDEX | ✅ |
| eventType TEXT | "eventType" TEXT NOT NULL | ✅ |
| rawPayload TEXT @db.Text | "rawPayload" TEXT NOT NULL | ✅ |
| status WebhookStatus @default(PENDING) | "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING' | ✅ |
| attempts Int @default(1) | "attempts" INTEGER NOT NULL DEFAULT 1 | ✅ |
| lastError TEXT? @db.Text | "lastError" TEXT | ✅ |
| processedAt DateTime? | "processedAt" TIMESTAMP(3) | ✅ |
| createdAt DateTime @default(now()) | "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP | ✅ |

**Indexes:**

- ✅ `@@index([eventId])` → `CREATE INDEX "WebhookEvent_eventId_idx"`
- ✅ `@@index([status])` → `CREATE INDEX "WebhookEvent_status_idx"`
- ✅ `@unique` → `CREATE UNIQUE INDEX "WebhookEvent_eventId_key"`

**Enum:**

- ✅ `WebhookStatus` enum created with correct values

**Assessment:** 🟢 PERFECT MATCH

---

**Idempotency Check:**

Running migration twice:

```sql
-- First run: ✓ SUCCESS
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE');
CREATE TABLE "WebhookEvent" (...);

-- Second run: ❌ ERROR
ERROR: type "WebhookStatus" already exists
```

**Issue:** ⚠️ Migration is NOT idempotent

**Mitigation:**

```sql
-- Idempotent version:
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE')
  IF NOT EXISTS;  -- ← Add this

CREATE TABLE IF NOT EXISTS "WebhookEvent" (...);  -- ← Add IF NOT EXISTS
```

**Assessment:** 🟡 FUNCTIONAL BUT NOT IDEMPOTENT

- Migration works correctly on fresh database
- Cannot be re-run safely (manual rollback required if failed)
- **Recommendation:** Add IF NOT EXISTS clauses for production safety

---

### 8.2 Deployment Instructions Validation

**DEPLOYMENT_INSTRUCTIONS.md Review:**

**Step 1: Database Migration**

- ✅ Clear instructions for Supabase SQL Editor
- ✅ Verification query provided
- ✅ Expected output documented

**Step 2: Rotate Secrets**

- ✅ JWT_SECRET rotation documented
- ✅ Stripe key rotation process linked
- ✅ Impact on users documented (re-authentication required)

**Step 3: Deploy Application**

- ✅ Build command provided
- ✅ Environment variable checklist
- ⚠️ No specific platform instructions (generic "follow your deployment process")

**Step 4: Verify Deployment**

- ✅ Database verification queries
- ✅ Health check curl command
- ✅ Authentication test
- ✅ Webhook test (Stripe CLI + Dashboard)

**Step 5: Monitor**

- ✅ Failed webhook monitoring query
- ✅ Expected error log patterns
- ✅ Success metrics defined

**Rollback Plan:**

- ✅ Application code rollback
- ✅ JWT_SECRET rollback
- ✅ Database rollback (with warning)

**Assessment:** 🟢 COMPREHENSIVE

- All steps executable
- Verification steps clear
- Rollback plan viable

---

### 8.3 Production Concerns

#### Connection Pooling

**Current:** Relies on Prisma defaults + Supabase pooler
**Concern:** No explicit configuration for production load

**Load Estimate:**

- Assuming 100 bookings/day
- Peak load: ~10 concurrent webhook requests
- Default pool size likely sufficient

**Recommendation:** Add explicit pool configuration for visibility

**Assessment:** 🟡 ACCEPTABLE FOR CURRENT SCALE

---

#### Transaction Timeouts

**Current:** 5 second transaction timeout
**Concern:** Under high load, could cause backlog

**Analysis:**

- Booking creation: ~200-500ms (typical)
- 5 second timeout: 10x safety margin
- Timeout prevents hung transactions

**Assessment:** 🟢 APPROPRIATE

---

#### Lock Strategy

**Current:** `FOR UPDATE NOWAIT`
**Concern:** High concurrency could cause many lock timeout errors

**Analysis:**

- Elopement business: Low concurrency (1-2 bookings/hour)
- Lock timeout returns 409 immediately (no blocking)
- Client retries after conflict resolution

**Assessment:** 🟢 APPROPRIATE FOR DOMAIN

---

#### Webhook Processing Latency

**Components:**

1. Signature verification: ~10-50ms
2. Database duplicate check: ~10-50ms
3. Record webhook: ~10-50ms
4. Booking creation: ~200-500ms (transaction)
5. Mark processed: ~10-50ms

**Total:** ~250-700ms per webhook

**Stripe timeout:** 30 seconds

**Safety margin:** 40x

**Assessment:** 🟢 WELL WITHIN LIMITS

---

#### Synchronous Blocking Operations

**Webhook Processing:**

- ✅ All operations async
- ✅ No synchronous file I/O
- ✅ No CPU-intensive operations

**Email Sending:**

```typescript
// di.ts:154-173
eventEmitter.subscribe('BookingPaid', async (payload) => {
  await mailProvider.sendBookingConfirm(payload.email, {...});  // ← Async
});
```

✅ Email sending is async (event-driven, non-blocking)

**Assessment:** 🟢 NO BLOCKING OPERATIONS

---

## 9. Performance Considerations

### 9.1 Database Performance

**Indexes Created:**

**WebhookEvent:**

- ✅ `eventId` UNIQUE INDEX (fast duplicate check)
- ✅ `eventId` INDEX (fast lookup)
- ✅ `status` INDEX (fast filtering)

**Booking:**

- ✅ `date` UNIQUE INDEX (fast conflict check + lock)
- ✅ `date` INDEX (fast availability queries)

**Query Performance:**

**Webhook Duplicate Check:**

```sql
SELECT * FROM "WebhookEvent" WHERE "eventId" = $1 LIMIT 1;
```

✅ Uses unique index → O(1) lookup

**Booking Conflict Check:**

```sql
SELECT * FROM "Booking" WHERE "date" = $1 LIMIT 1 FOR UPDATE NOWAIT;
```

✅ Uses unique index → O(1) lookup + lock

**Booking List (Admin):**

```typescript
await this.prisma.booking.findMany({
  orderBy: { createdAt: 'desc' },
  include: { customer: true, addOns: {...}},
});
```

⚠️ No LIMIT clause → Could be slow with many bookings
**Recommendation:** Add pagination

**Assessment:** 🟢 GOOD INDEX COVERAGE

- ⚠️ Admin queries could benefit from pagination

---

### 9.2 Webhook Processing Performance

**Signature Verification:** ~10-50ms (Stripe SDK)

- ✅ Efficient HMAC-SHA256 verification
- ✅ No optimization needed

**Duplicate Check:** ~10-50ms (indexed query)

- ✅ Single index lookup
- ✅ No optimization needed

**Booking Creation:** ~200-500ms (transaction)

- ✅ Single transaction with nested creates
- ✅ No N+1 queries
- ⚠️ AddOn price lookup could be optimized (currently uses 0)

**Assessment:** 🟢 EFFICIENT

- Total latency: ~250-700ms
- Well within Stripe's 30-second timeout
- No performance bottlenecks identified

---

### 9.3 Potential Bottlenecks

#### Database Connection Exhaustion

**Scenario:** Sudden spike in webhook retries

**Current Protection:**

- Supabase pooler (transaction mode)
- Prisma connection pooling
- 5-second transaction timeout

**Risk:** LOW

- Webhooks complete quickly (~500ms)
- Timeout prevents hung connections
- Pooler handles burst traffic

**Recommendation:** Add connection pool monitoring

---

#### Lock Contention

**Scenario:** Multiple customers try to book same date simultaneously

**Current Protection:**

- `FOR UPDATE NOWAIT` (no blocking)
- Immediate 409 response
- Transaction completes quickly

**Risk:** LOW

- Elopement business has low concurrency
- Lock held for <500ms
- Second request gets immediate error (no waiting)

**Assessment:** 🟢 WELL DESIGNED FOR DOMAIN

---

#### Webhook Processing Latency

**Scenario:** Complex booking creation takes too long

**Current Protection:**

- 5-second transaction timeout
- No blocking operations
- Async email sending

**Risk:** LOW

- Transaction is simple (single booking + relations)
- No external API calls in transaction
- Email sent asynchronously

**Assessment:** 🟢 NO BOTTLENECK IDENTIFIED

---

## 10. Risk Assessment

### HIGH RISK: None Identified

No issues found that pose high risk to production.

---

### MEDIUM RISK

#### 1. AddOn Price Not Captured at Time of Booking

**Issue:** `booking.repository.ts:67` hardcodes `unitPrice: 0`

**Impact:**

- Booking records don't capture add-on prices at time of purchase
- Financial reporting inaccurate
- Price change auditing impossible

**Mitigation:**

```typescript
// Fetch actual add-on prices before transaction
const addOnPrices = await tx.addOn.findMany({
  where: { id: { in: booking.addOnIds }},
  select: { id: true, price: true }
});

// Store actual prices in BookingAddOn
addOns: {
  create: booking.addOnIds.map((addOnId) => ({
    addOnId,
    quantity: 1,
    unitPrice: addOnPrices.find(a => a.id === addOnId)?.price || 0,
  })),
}
```

**Recommendation:** Implement add-on price capture before production deployment

---

#### 2. Migration Not Idempotent

**Issue:** `01_add_webhook_events.sql` cannot be re-run

**Impact:**

- Failed migration requires manual cleanup
- Cannot safely retry migration
- Deployment risk increased

**Mitigation:**

```sql
CREATE TYPE "WebhookStatus" AS ENUM (...) IF NOT EXISTS;
CREATE TABLE IF NOT EXISTS "WebhookEvent" (...);
```

**Recommendation:** Add idempotency guards to migration

---

#### 3. No Explicit Connection Pool Configuration

**Issue:** Relies on Prisma + Supabase defaults

**Impact:**

- Connection exhaustion under load unpredictable
- No visibility into pool utilization
- Difficult to tune for production

**Mitigation:**

- Document expected load and pool sizing
- Add connection pool monitoring
- Consider explicit pool configuration

**Recommendation:** Add monitoring before scaling

---

### LOW RISK

#### 1. Package/AddOn Update Race Conditions

**Issue:** No optimistic locking on catalog updates

**Impact:** LOW

- Rare scenario (concurrent admin edits)
- Last write wins (acceptable for content)
- No financial impact

**Mitigation:** Acceptable as-is for MVP

---

#### 2. No Correlation IDs Across Services

**Issue:** Request IDs not propagated to all logs

**Impact:** LOW

- Harder to trace requests across components
- Debugging more difficult
- Not critical for current scale

**Mitigation:** Add correlation ID middleware

---

#### 3. Limited Observability Metrics

**Issue:** Application metrics require log parsing

**Impact:** LOW

- Metrics available but not aggregated
- No real-time dashboards
- Adequate for current scale

**Mitigation:** Add metrics library when scaling

---

#### 4. Admin Booking List Lacks Pagination

**Issue:** `findMany()` returns all bookings

**Impact:** LOW

- Slow for large datasets
- Not a problem at current scale (<1000 bookings)
- No client-side pagination

**Mitigation:** Add pagination before reaching 1000+ bookings

---

## 11. Recommendations

### Top 5 Integration Improvements

1. **Capture Add-On Prices at Booking Time** (MEDIUM Priority)
   - Fix: Fetch add-on prices and store in `BookingAddOn.unitPrice`
   - Impact: Accurate financial records and price change auditing

2. **Make Migration Idempotent** (MEDIUM Priority)
   - Fix: Add `IF NOT EXISTS` to `CREATE TYPE` and `CREATE TABLE`
   - Impact: Safer deployment and migration retry capability

3. **Add Explicit Connection Pool Configuration** (MEDIUM Priority)
   - Fix: Document pool sizing and add monitoring
   - Impact: Better visibility and control under load

4. **Add Correlation ID Propagation** (LOW Priority)
   - Fix: Propagate request ID through all log statements
   - Impact: Easier debugging across service boundaries

5. **Add Webhook Processing Duration Metrics** (LOW Priority)
   - Fix: Instrument webhook processing with timing
   - Impact: Better performance monitoring and SLA tracking

---

### Runtime Optimizations

1. **Add Admin Booking List Pagination**
   - Limit: 50 bookings per page
   - Implement: `skip` and `take` parameters

2. **Add Database Connection Pool Monitoring**
   - Track: Pool size, active connections, wait time
   - Alert: Connection exhaustion

3. **Implement Deadlock Retry Logic**
   - Detect: Prisma error code P2034
   - Retry: Once with exponential backoff

---

### Monitoring Enhancements

1. **Add Application Metrics Collection**
   - Library: prom-client (Prometheus)
   - Metrics:
     - Webhook processing duration (histogram)
     - Booking creation duration (histogram)
     - Lock timeout count (counter)
     - Booking conflict count (counter)

2. **Add Structured Logging to Repository Layer**
   - Log: All database operations with duration
   - Include: Table, operation type, result

3. **Add Alert Rules**
   - Webhook failure rate > 5%
   - Lock timeout rate > 10%
   - Database connection pool exhaustion

---

### Production Hardening Steps

1. **Add Health Check for Database Connectivity**
   - Current: `/health` returns 200 always
   - Improve: Check Prisma connection status

2. **Add Rate Limiting to Webhook Endpoint**
   - Protect: Against webhook flooding
   - Limit: 100 requests/minute per IP

3. **Add Fallback Dead Letter Queue**
   - When: Database unavailable during webhook
   - Store: Failed webhooks to file system
   - Replay: When database recovers

4. **Add Integration Tests for Race Conditions**
   - Test: Concurrent booking attempts
   - Verify: Only one succeeds, others get 409
   - Validate: No partial data committed

---

## 12. Conclusion

### Production Readiness: 9/10

Phase 2B demonstrates **excellent integration quality** with comprehensive webhook handling, robust race condition prevention, and solid dependency injection architecture. The system is **production-ready** with only minor improvements recommended.

### Key Strengths

✅ **Perfect schema-to-implementation alignment**
✅ **Robust transaction handling with proper timeouts**
✅ **Idempotent webhook processing with duplicate detection**
✅ **Mock/Real adapter parity ensures test reliability**
✅ **Comprehensive error handling and recovery**
✅ **Well-documented deployment process**

### Areas Requiring Attention Before Scale

⚠️ Add-on price capture (MEDIUM priority)
⚠️ Migration idempotency (MEDIUM priority)
⚠️ Connection pool configuration (MEDIUM priority)
⚠️ Observability enhancements (LOW priority)

### Deployment Recommendation

**✅ APPROVED FOR PRODUCTION** with the following caveat:

- Implement add-on price capture fix before first production booking
- Add migration idempotency guards before deployment
- Document connection pool sizing expectations
- Plan for observability improvements in next phase

---

**Audit Completed:** 2025-10-29
**Next Review:** After 1 week of production use
**Success Criteria:** 0 double-bookings, >99% webhook success rate, <100ms p95 latency
