# Test Documentation

This document provides comprehensive guidance for testing in the Elope server application.

## Test Structure

The test suite is organized into three main categories:

### 1. Unit Tests (`test/`)

**Location:** `/Users/mikeyoung/CODING/Elope/server/test/`

Unit tests verify individual components (services, utilities) in isolation using fake implementations.

**Key Files:**
- `*.service.spec.ts` - Service layer unit tests
- `*.spec.ts` - General unit tests
- `helpers/fakes.ts` - Fake implementations of repositories and providers

**Example Files:**
- `test/booking.service.spec.ts`
- `test/catalog.service.spec.ts`
- `test/availability.service.spec.ts`

### 2. Integration Tests (`test/integration/`)

**Location:** `/Users/mikeyoung/CODING/Elope/server/test/integration/`

Integration tests verify database interactions, transactions, race conditions, and multi-tenancy isolation using a real test database.

**Key Files:**
- `*repository.integration.spec.ts` - Repository tests with real database
- `*race-conditions.spec.ts` - Concurrent operation tests
- `cache-isolation.integration.spec.ts` - Multi-tenant cache isolation

**Example Files:**
- `test/integration/booking-repository.integration.spec.ts`
- `test/integration/catalog.repository.integration.spec.ts`
- `test/integration/webhook-repository.integration.spec.ts`

### 3. E2E Tests (`../e2e/`)

**Location:** `/Users/mikeyoung/CODING/Elope/e2e/`

End-to-end tests verify complete user flows using Playwright, simulating real browser interactions.

**Key Files:**
- `tests/booking-flow.spec.ts` - Customer booking journey
- `tests/admin-flow.spec.ts` - Admin management workflows
- `tests/booking-mock.spec.ts` - Mock adapter testing

## Running Tests

### All Tests (Unit + Integration)
```bash
# From server directory
cd /Users/mikeyoung/CODING/Elope/server
npm test

# From root directory
cd /Users/mikeyoung/CODING/Elope
npm test
```

### Unit Tests Only
```bash
# Run unit tests, excluding integration tests
npm test -- test/ --exclude="test/integration/**"
```

### Integration Tests Only
```bash
# Requires test database to be configured
npm run test:integration

# Watch mode for integration tests
npm run test:integration:watch
```

### E2E Tests
```bash
# From root directory
cd /Users/mikeyoung/CODING/Elope
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed
```

### Watch Mode
```bash
# Watch mode for unit tests
npm run test:watch

# Watch mode for integration tests
npm run test:integration:watch
```

### Coverage Reports
```bash
# Generate coverage report
npm run coverage
```

## Test Patterns

### Multi-Tenancy

**Critical Rule:** All service and repository methods require `tenantId` as the **first parameter**.

#### Example - Service Method
```typescript
// CORRECT
await bookingService.createCheckout('test-tenant', {
  packageId: 'basic',
  coupleName: 'John & Jane',
  email: 'couple@example.com',
  eventDate: '2025-07-01'
});

// INCORRECT - Missing tenantId
await bookingService.createCheckout({
  packageId: 'basic',
  coupleName: 'John & Jane',
  email: 'couple@example.com',
  eventDate: '2025-07-01'
});
```

#### Example - Repository Method
```typescript
// CORRECT
const packages = await catalogRepo.getAllPackages('test-tenant');

// INCORRECT - Missing tenantId
const packages = await catalogRepo.getAllPackages();
```

### Fake Implementations

Location: `test/helpers/fakes.ts`

Fake implementations provide in-memory versions of repositories and providers for unit testing.

#### Available Fakes
- `FakeBookingRepository` - In-memory booking storage
- `FakeCatalogRepository` - In-memory package/add-on storage
- `FakeBlackoutRepository` - In-memory blackout dates
- `FakeCalendarProvider` - Mock calendar integration
- `FakePaymentProvider` - Mock Stripe checkout
- `FakeEmailProvider` - Mock email sending
- `FakeUserRepository` - In-memory user storage
- `FakeWebhookRepository` - In-memory webhook tracking
- `FakeEventEmitter` - Mock event bus

#### Example Usage
```typescript
import {
  FakeBookingRepository,
  FakeCatalogRepository,
  FakeEventEmitter,
  buildPackage,
  buildBooking
} from './helpers/fakes';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: FakeBookingRepository;
  let catalogRepo: FakeCatalogRepository;

  beforeEach(() => {
    // Create fresh instances for each test
    bookingRepo = new FakeBookingRepository();
    catalogRepo = new FakeCatalogRepository();

    service = new BookingService(
      bookingRepo,
      catalogRepo,
      // ... other dependencies
    );
  });

  it('creates a booking', async () => {
    // Arrange
    const pkg = buildPackage({ id: 'pkg_1', priceCents: 100000 });
    catalogRepo.addPackage(pkg);

    // Act
    const result = await service.createCheckout('test-tenant', {
      packageId: 'pkg_1',
      // ... booking data
    });

    // Assert
    expect(result.checkoutUrl).toBeDefined();
  });
});
```

### Test Setup

Use `beforeEach` for fresh instances to ensure test isolation:

```typescript
beforeEach(() => {
  // Create new instances for each test
  bookingRepo = new FakeBookingRepository();
  catalogRepo = new FakeCatalogRepository();
  eventEmitter = new FakeEventEmitter();

  // Clear any state
  bookingRepo.clear();
  catalogRepo.clear();

  service = new BookingService(
    bookingRepo,
    catalogRepo,
    eventEmitter,
    // ... other deps
  );
});
```

### Mocking Services

For complex services like `commissionService` and `tenantRepo`, use Vitest mocks:

```typescript
import { vi } from 'vitest';

let commissionService: any;
let tenantRepo: any;

beforeEach(() => {
  commissionService = {
    calculateCommission: vi.fn().mockReturnValue({
      platformFeeCents: 500,
      vendorPayoutCents: 99500
    }),
    calculateBookingTotal: vi.fn().mockResolvedValue({
      basePrice: 100000,
      addOnsTotal: 50000,
      subtotal: 150000,
      platformFeeCents: 7500,
      vendorPayoutCents: 142500,
      customerTotalCents: 150000
    })
  };

  tenantRepo = {
    findById: vi.fn().mockResolvedValue({
      id: 'test-tenant',
      stripeConnectedAccountId: 'acct_test123',
      name: 'Test Tenant'
    })
  };

  service = new BookingService(
    bookingRepo,
    catalogRepo,
    eventEmitter,
    paymentProvider,
    commissionService,  // Mock
    tenantRepo          // Mock
  );
});
```

### HTTP/API Tests

For HTTP endpoint testing, use Supertest with the Express app:

```typescript
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';

describe('GET /v1/packages', () => {
  let app: Express;
  let testTenantApiKey: string;

  beforeAll(async () => {
    // Setup test tenant with known API key
    const prisma = new PrismaClient();
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'elope' },
      update: {
        apiKeyPublic: 'pk_live_elope_0123456789abcdef',
        isActive: true,
      },
      create: {
        id: 'tenant_default_legacy',
        slug: 'elope',
        name: 'Elope (Test)',
        apiKeyPublic: 'pk_live_elope_0123456789abcdef',
        // ... other fields
      },
    });

    testTenantApiKey = tenant.apiKeyPublic;
    await prisma.$disconnect();

    // Create app with mock adapters
    const config = loadConfig();
    app = createApp({ ...config, ADAPTERS_PRESET: 'mock' });
  });

  it('returns packages list', async () => {
    const res = await request(app)
      .get('/v1/packages')
      .set('X-Tenant-Key', testTenantApiKey)  // REQUIRED for multi-tenancy
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### Integration Test Patterns

Integration tests use real database connections and test helpers:

```typescript
import { setupCompleteIntegrationTest } from '../helpers/integration-setup';

describe.sequential('PrismaBookingRepository - Integration Tests', () => {
  const ctx = setupCompleteIntegrationTest('booking-repository');
  let repository: PrismaBookingRepository;
  let testTenantId: string;

  beforeEach(async () => {
    // Setup tenant
    await ctx.tenants.cleanupTenants();
    await ctx.tenants.tenantA.create();
    testTenantId = ctx.tenants.tenantA.id;

    // Initialize repository
    repository = new PrismaBookingRepository(ctx.prisma);
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('creates booking with database transaction', async () => {
    const booking = ctx.factories.booking.create({
      eventDate: '2025-12-25'
    });

    const created = await repository.create(testTenantId, booking);
    expect(created.id).toBe(booking.id);
  });
});
```

## Common Issues

### Issue: Missing `tenantId` Parameter

**Symptom:**
```
TypeError: Cannot read property 'id' of undefined
```

**Solution:**
Add `'test-tenant'` as the first parameter to all service/repository method calls:

```typescript
// BEFORE (broken)
await service.createBooking({ ... });

// AFTER (fixed)
await service.createBooking('test-tenant', { ... });
```

### Issue: 401 Unauthorized in HTTP Tests

**Symptom:**
```
Expected status 200, received 401
```

**Solution:**
Add the `X-Tenant-Key` header with a valid tenant API key:

```typescript
await request(app)
  .get('/v1/packages')
  .set('X-Tenant-Key', testTenantApiKey)  // Add this line
  .expect(200);
```

### Issue: Repository Method Signature Mismatch

**Symptom:**
```
Expected 2 arguments, but got 1
```

**Solution:**
Check `test/helpers/fakes.ts` for the current interface. All repository methods follow this pattern:

```typescript
// Fake repository interface
async methodName(tenantId: string, ...otherParams): Promise<Result>

// Usage
await repo.findById('test-tenant', 'booking-123');
await repo.create('test-tenant', bookingData);
await repo.findAll('test-tenant');
```

### Issue: Test Database Not Configured

**Symptom:**
```
Error: DATABASE_URL_TEST environment variable not set
```

**Solution:**
1. Copy `.env.example` to `.env.test`
2. Set `DATABASE_URL_TEST` to your test database connection string
3. Run `npm run test:integration`

### Issue: Stale Test Data

**Symptom:**
Tests pass individually but fail when run together

**Solution:**
Ensure proper cleanup in `beforeEach` and `afterEach` hooks:

```typescript
beforeEach(() => {
  fakeRepo.clear();  // Clear fake repository state
});

afterEach(async () => {
  await ctx.cleanup();  // Clean up integration test database
});
```

## Builder Functions

Location: `test/helpers/fakes.ts`

Builder functions create test entities with sensible defaults:

```typescript
// Build a package with defaults
const pkg = buildPackage();
// Result: { id: 'pkg_1', slug: 'basic-package', priceCents: 100000, ... }

// Build with overrides
const customPkg = buildPackage({
  id: 'pkg_custom',
  priceCents: 200000
});

// Available builders
buildPackage(overrides?: Partial<Package>): Package
buildAddOn(overrides?: Partial<AddOn>): AddOn
buildBooking(overrides?: Partial<Booking>): Booking
buildUser(overrides?: Partial<User>): User
```

## Test Organization

### File Naming Conventions
- Unit tests: `*.spec.ts`
- Integration tests: `*.integration.spec.ts`
- HTTP tests: `*.test.ts`
- E2E tests: `*.spec.ts` (in `e2e/tests/`)

### Directory Structure
```
server/test/
├── README.md                          # This file
├── helpers/
│   ├── fakes.ts                       # Fake implementations
│   └── integration-setup.ts           # Integration test utilities
├── http/
│   └── packages.test.ts               # HTTP endpoint tests
├── integration/
│   ├── booking-repository.integration.spec.ts
│   ├── catalog.repository.integration.spec.ts
│   └── webhook-repository.integration.spec.ts
├── middleware/
│   └── tenant-middleware.spec.ts
├── repositories/
│   └── *.spec.ts
├── controllers/
│   └── *.spec.ts
├── booking.service.spec.ts            # Service unit tests
├── catalog.service.spec.ts
└── availability.service.spec.ts

../e2e/
├── playwright.config.ts
└── tests/
    ├── booking-flow.spec.ts           # E2E user flows
    ├── admin-flow.spec.ts
    └── booking-mock.spec.ts
```

## Best Practices

### 1. Test Isolation
Each test should be independent and not rely on state from other tests.

```typescript
// GOOD - Fresh state for each test
beforeEach(() => {
  repo = new FakeBookingRepository();
  service = new BookingService(repo, ...);
});

// BAD - Shared state across tests
const repo = new FakeBookingRepository();
```

### 2. Descriptive Test Names
Use clear, behavior-focused test descriptions:

```typescript
// GOOD
it('throws NotFoundError when package does not exist', async () => { ... });

// BAD
it('test package', async () => { ... });
```

### 3. Arrange-Act-Assert Pattern
Structure tests clearly:

```typescript
it('calculates total with add-ons', async () => {
  // Arrange - Setup test data
  const pkg = buildPackage({ priceCents: 100000 });
  catalogRepo.addPackage(pkg);

  // Act - Execute the operation
  const result = await service.createCheckout('test-tenant', {
    packageId: pkg.id,
    addOnIds: ['addon_1']
  });

  // Assert - Verify the result
  expect(result.totalCents).toBe(150000);
});
```

### 4. Multi-Tenancy Testing
Always test tenant isolation for repository operations:

```typescript
it('isolates data by tenant', async () => {
  await repo.create('tenant-a', bookingA);
  await repo.create('tenant-b', bookingB);

  const tenantABookings = await repo.findAll('tenant-a');
  expect(tenantABookings).toHaveLength(1);
  expect(tenantABookings[0].id).toBe(bookingA.id);
});
```

### 5. Error Cases
Always test both success and error scenarios:

```typescript
describe('createBooking', () => {
  it('creates booking successfully', async () => { ... });

  it('throws NotFoundError for invalid package', async () => { ... });

  it('throws BookingConflictError for duplicate date', async () => { ... });
});
```

## Debugging Tests

### Run Single Test
```bash
# Run specific test file
npm test -- booking.service.spec.ts

# Run specific test by name pattern
npm test -- -t "creates booking successfully"
```

### Enable Verbose Output
```bash
# Already enabled by default in package.json
npm test  # Uses --reporter=verbose
```

### Debug Integration Tests
```bash
# Run single integration test file
npm run test:integration -- booking-repository.integration.spec.ts

# Watch mode for debugging
npm run test:integration:watch
```

## CI/CD Integration

Tests are automatically run in CI/CD pipelines. See `docs/TESTING.md` for CI configuration.

### Pre-Commit Recommendations
```bash
# Run fast unit tests before committing
npm test -- test/ --exclude="test/integration/**"

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## Further Reading

- `/Users/mikeyoung/CODING/Elope/docs/TESTING.md` - High-level testing philosophy and strategy
- `/Users/mikeyoung/CODING/Elope/docs/architecture/MULTI_TENANT_ISOLATION.md` - Multi-tenancy architecture
- `/Users/mikeyoung/CODING/Elope/e2e/playwright.config.ts` - Playwright configuration
- [Vitest Documentation](https://vitest.dev/) - Test runner reference
- [Playwright Documentation](https://playwright.dev/) - E2E testing reference
