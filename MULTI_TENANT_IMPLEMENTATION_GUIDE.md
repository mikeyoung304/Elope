# Multi-Tenant Embeddable Platform Implementation Guide

**Project:** MAIS - Transform Elope into multi-tenant embeddable wedding booking platform
**Timeline:** 6 months (24 weeks)
**Current Phase:** Phase 1 - Foundation (In Progress)
**Branch:** `multi-tenant-embeddable`

---

## Executive Summary

This guide consolidates all implementation plans, research, and architecture decisions into a single actionable document. The transformation enables up to 50 independent wedding businesses to embed our booking widget on their websites, each with variable commission rates and isolated data.

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Embedding Strategy** | Hybrid (JavaScript SDK + iframe) | Best security + compatibility |
| **Tenant Identification** | API keys (`pk_live_*`) | Client-safe, industry standard |
| **Data Isolation** | Row-level with `tenantId` | Optimal for 50-tenant scale |
| **Commission Model** | Server-side calculation | Stripe Connect limitation |
| **Deployment** | Render (backend) + Vercel (widget) | Persistent server + CDN |
| **Secrets Management** | Database-encrypted | Scales beyond env vars |

---

## Current Status

### ✅ Completed (Branch: multi-tenant-embeddable)

#### 1. Database Schema (`server/prisma/schema.prisma`)
- [x] Tenant model with API keys, commission rates, Stripe Connect, encrypted secrets
- [x] Multi-tenant fields added to: Package, AddOn, Booking, BlackoutDate, WebhookEvent
- [x] Composite unique constraints: `[tenantId, slug]`, `[tenantId, date]`
- [x] Performance indexes for tenant-scoped queries
- [x] Commission tracking fields in Booking model

#### 2. Migration Script (`server/prisma/migrations/03_add_multi_tenancy.sql`)
- [x] Creates Tenant table
- [x] Migrates existing data to default "elope" tenant
- [x] Adds foreign keys and constraints
- [x] **Status:** Ready to apply when database is accessible

#### 3. Core Services Created
| Service | File | Purpose |
|---------|------|---------|
| **Encryption** | `src/lib/encryption.service.ts` | AES-256-GCM for tenant secrets |
| **API Keys** | `src/lib/api-key.service.ts` | Generate/validate tenant keys |
| **Tenant Middleware** | `src/middleware/tenant.ts` | Resolve tenant from X-Tenant-Key header |
| **Commission** | `src/services/commission.service.ts` | Calculate variable commission rates |

#### 4. Service Updates Started
- [x] Catalog service: Added tenantId parameters, updated cache keys

### 🚧 In Progress

- [ ] Complete service layer updates (booking, availability)
- [ ] Update API routes with tenant middleware
- [ ] Update DI container
- [ ] Apply database migration
- [ ] Generate new Prisma client

### 📋 Phase 1 Remaining (Weeks 1-4)

**Week 1-2: Foundation**
- [x] Database schema & migration
- [x] Encryption & API key services
- [x] Tenant middleware
- [x] Commission service
- [ ] Apply migration: `pnpm exec prisma migrate dev --name add_multi_tenancy`
- [ ] Generate client: `pnpm exec prisma generate`

**Week 3: Service Layer**
- [ ] Update booking.service.ts with commission integration
- [ ] Update availability.service.ts with tenant scoping
- [ ] Update all repository interfaces for tenantId
- [ ] Update adapters (Prisma repositories)

**Week 4: API Routes**
- [ ] Apply tenant middleware to catalog routes
- [ ] Apply tenant middleware to booking routes
- [ ] Apply tenant middleware to availability routes
- [ ] Update CORS for multi-origin support
- [ ] Update DI container with new services

---

## Quick Start: Applying the Migration

Once database is accessible:

```bash
cd server

# 1. Verify schema is correct
pnpm exec prisma format

# 2. Apply migration
pnpm exec prisma migrate dev --name add_multi_tenancy

# 3. Generate Prisma client
pnpm exec prisma generate

# 4. Verify migration
pnpm exec prisma migrate status

# 5. Generate master encryption key (save securely!)
openssl rand -hex 32

# 6. Add to .env
echo "TENANT_SECRETS_ENCRYPTION_KEY=<your_64_char_hex_key>" >> .env
```

---

## Phase-by-Phase Implementation

### Phase 1: Multi-Tenant Foundation (Weeks 1-4) 🚧

**Goal:** Database isolation, tenant resolution, commission calculation

**Deliverables:**
- [x] Tenant model in database
- [x] API key generation/validation
- [x] Encryption service for secrets
- [x] Commission calculation engine
- [ ] All services tenant-scoped
- [ ] Migration applied successfully

**Validation:**
```bash
# Create test tenant
pnpm --filter @elope/api exec tsx scripts/create-test-tenant.ts

# Test API key validation
curl -H "X-Tenant-Key: pk_live_test_xxx" http://localhost:3000/api/v1/catalog/packages
```

---

### Phase 2: Embeddable Widget Core (Weeks 5-8)

**Goal:** JavaScript SDK loader, iframe widget, postMessage communication

**Key Files to Create:**

#### 1. SDK Loader (`client/public/mais-sdk.js`)
```javascript
// Lightweight (<3KB) vanilla JS loader
// Creates iframe, handles postMessage, auto-resize
// Deploys to: https://widget.mais.com/sdk/mais-sdk.js
```

#### 2. Widget Application (`client/src/widget/`)
```
widget/
├── WidgetApp.tsx        # Main widget component
├── WidgetMessenger.ts   # postMessage wrapper
└── widget-main.tsx      # Entry point
```

**Tenant Integration:**
```html
<!-- Tenant embeds on their website -->
<script src="https://widget.mais.com/sdk/mais-sdk.js"
        data-tenant="bellaweddings"
        data-api-key="pk_live_bellaweddings_xxx">
</script>
<div id="mais-widget"></div>
```

**Deliverables:**
- [ ] SDK loader with iframe creation
- [ ] Widget React app with branding API
- [ ] postMessage security (origin validation)
- [ ] Auto-resize iframe based on content
- [ ] Event system (ready, booking_created, booking_completed)

---

### Phase 3: Stripe Connect & Payments (Weeks 9-12)

**Goal:** Variable commission payments via Stripe Connect

**Stripe Connect Flow:**
1. Admin creates tenant → Generate Stripe Express account
2. Tenant completes onboarding (KYC, banking)
3. Booking created → Calculate commission server-side
4. Payment processed → Charge goes to tenant's account
5. Platform takes commission via `application_fee_amount`

**Key Services to Create:**

#### 1. Stripe Connect Service (`src/services/stripe-connect.service.ts`)
```typescript
class StripeConnectService {
  async createConnectedAccount(tenantId, email, businessName)
  async createOnboardingLink(tenantId, refreshUrl, returnUrl)
  async checkOnboardingStatus(tenantId)
  async storeRestrictedKey(tenantId, restrictedKey)
}
```

#### 2. Update Booking Service
```typescript
async createPaymentIntent(tenantId, bookingId) {
  const booking = await prisma.booking.findUnique({ ... });
  const commission = await commissionService.calculateCommission(...);

  // Create PaymentIntent on Connected Account
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: booking.totalPrice,
      application_fee_amount: commission.amount, // Platform commission
      currency: 'usd',
    },
    { stripeAccount: tenant.stripeAccountId } // Connected Account
  );
}
```

**Deliverables:**
- [ ] Stripe Connect account creation
- [ ] Onboarding link generation
- [ ] Payment intent with commission
- [ ] Webhook handler for payment events
- [ ] Refund handling with commission reversal

---

### Phase 4: Admin Tools (Weeks 13-16)

**Goal:** Tenant provisioning UI for platform admin

**Admin Dashboard Features:**

#### 1. Tenant Management
```
GET    /api/v1/admin/tenants           # List all tenants
POST   /api/v1/admin/tenants           # Create new tenant
PATCH  /api/v1/admin/tenants/:id       # Update commission, branding
GET    /api/v1/admin/tenants/:id/stats # Revenue, bookings
```

#### 2. Tenant Onboarding Workflow
```
1. Admin creates tenant (name, slug, email, commission %)
2. System generates API keys (public + secret)
3. System creates Stripe Connect account
4. Admin sends onboarding link to tenant
5. Tenant completes Stripe KYC/banking
6. System sets stripeOnboarded = true
7. Tenant can now accept bookings
```

**Deliverables:**
- [ ] Admin authentication middleware
- [ ] Tenant CRUD API routes
- [ ] Commission rate editor
- [ ] Branding manager (logo, colors)
- [ ] Tenant statistics dashboard
- [ ] Stripe onboarding status tracker

---

### Phase 5: Production Hardening (Weeks 17-20)

**Goal:** Security, performance, monitoring

**Security Checklist:**
- [ ] CSP headers: `frame-ancestors` whitelist
- [ ] postMessage origin validation (never `'*'`)
- [ ] CORS configured for known tenant domains
- [ ] Rate limiting (express-rate-limit)
- [ ] Encrypted tenant secrets with key rotation plan
- [ ] Stripe webhook signature validation
- [ ] SQL injection prevention (Prisma)
- [ ] Admin auth with JWT expiration
- [ ] HTTPS enforced (Render/Vercel)

**Performance Optimization:**
- [ ] PostgreSQL indexes verified
- [ ] Cache hit rate monitoring
- [ ] Stripe API request deduplication
- [ ] Database connection pooling
- [ ] Widget SDK CDN caching (Vercel Edge)

**Monitoring:**
- [ ] Sentry error tracking
- [ ] Stripe Dashboard alerts
- [ ] Database query performance
- [ ] API endpoint latency
- [ ] Commission calculation accuracy

---

### Phase 6: Scale to 10+ Tenants (Weeks 21-24)

**Goal:** Production launch with first 10 tenants

**Tenant Onboarding Checklist:**

For each tenant:
1. [ ] Admin creates tenant in dashboard
2. [ ] Tenant completes Stripe Connect onboarding
3. [ ] Tenant creates 3-5 packages
4. [ ] Tenant uploads package images
5. [ ] Tenant integrates SDK on their website
6. [ ] Test booking flow end-to-end
7. [ ] Verify commission calculation
8. [ ] Go live!

---

## Critical Code Patterns

### 1. Tenant-Scoped Database Queries

**❌ WRONG - No tenant isolation:**
```typescript
const packages = await prisma.package.findMany({ where: { active: true } });
```

**✅ CORRECT - Tenant isolated:**
```typescript
const packages = await prisma.package.findMany({
  where: { tenantId, active: true },
});
```

### 2. Cache Keys Must Include Tenant ID

**❌ WRONG - Cache leak:**
```typescript
const cacheKey = 'catalog:all-packages';
```

**✅ CORRECT - Tenant-scoped cache:**
```typescript
const cacheKey = `catalog:${tenantId}:all-packages`;
```

### 3. Commission Calculation

**❌ WRONG - Client-side calculation:**
```typescript
// Never trust client for commission amount
const commission = req.body.commission; // ❌ Unsafe!
```

**✅ CORRECT - Server-side calculation:**
```typescript
const commission = await commissionService.calculateCommission(tenantId, totalPrice);
await stripe.paymentIntents.create({
  amount: totalPrice,
  application_fee_amount: commission.amount, // ✅ Calculated server-side
});
```

### 4. API Routes with Tenant Middleware

**❌ WRONG - No tenant resolution:**
```typescript
router.get('/packages', async (req, res) => {
  const packages = await catalogService.getAllPackages(); // ❌ No tenantId
});
```

**✅ CORRECT - Tenant middleware:**
```typescript
router.use(resolveTenant(prisma));
router.use(requireTenant);

router.get('/packages', async (req: TenantRequest, res) => {
  const packages = await catalogService.getAllPackages(req.tenantId!);
  res.json({ packages });
});
```

---

## Environment Variables

### Required for Development

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Security
JWT_SECRET="your-64-char-secret"
TENANT_SECRETS_ENCRYPTION_KEY="your-64-char-hex" # openssl rand -hex 32

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# URLs
API_URL="http://localhost:3000"
WIDGET_URL="http://localhost:5173"
```

### Required for Production

```bash
# Same as above, plus:
STRIPE_SECRET_KEY="sk_live_xxx"  # Live mode
STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
NODE_ENV="production"
```

---

## Testing Strategy

### Unit Tests

Test commission calculation:
```typescript
describe('CommissionService', () => {
  it('calculates commission correctly', async () => {
    const result = await commissionService.calculateCommission('tenant_id', 50000);
    expect(result.amount).toBe(6000); // 12% of $500.00
  });

  it('enforces Stripe minimum (0.5%)', async () => {
    const result = await commissionService.calculateCommission('tenant_id', 100);
    expect(result.amount).toBeGreaterThanOrEqual(1); // 0.5% minimum
  });
});
```

### Integration Tests

Test tenant isolation:
```typescript
describe('Catalog API', () => {
  it('isolates packages by tenant', async () => {
    const tenant1Key = 'pk_live_tenant1_xxx';
    const tenant2Key = 'pk_live_tenant2_xxx';

    const res1 = await request(app)
      .get('/api/v1/catalog/packages')
      .set('X-Tenant-Key', tenant1Key);

    const res2 = await request(app)
      .get('/api/v1/catalog/packages')
      .set('X-Tenant-Key', tenant2Key);

    expect(res1.body.packages).not.toEqual(res2.body.packages);
  });
});
```

### End-to-End Tests

Test complete booking flow:
```typescript
describe('Booking Flow', () => {
  it('completes booking with commission', async () => {
    // 1. Create booking
    const booking = await createBooking(tenantId, bookingData);

    // 2. Create payment intent
    const { clientSecret } = await createPaymentIntent(tenantId, booking.id);

    // 3. Simulate payment success webhook
    await simulateStripeWebhook('payment_intent.succeeded', booking.id);

    // 4. Verify commission was charged
    const updatedBooking = await getBooking(booking.id);
    expect(updatedBooking.commissionAmount).toBeGreaterThan(0);
    expect(updatedBooking.status).toBe('CONFIRMED');
  });
});
```

---

## Deployment

### Backend (Render)

```yaml
# render.yaml
services:
  - type: web
    name: mais-api
    env: node
    buildCommand: cd server && pnpm install && pnpm build
    startCommand: cd server && pnpm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: TENANT_SECRETS_ENCRYPTION_KEY
        generateValue: true
      - key: STRIPE_SECRET_KEY
        sync: false
```

### Frontend/Widget (Vercel)

```json
// vercel.json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Content-Security-Policy", "value": "frame-ancestors 'self' https://*.mais.com" }
      ]
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Tenant not found"
**Cause:** Invalid or missing X-Tenant-Key header
**Fix:** Ensure header format: `X-Tenant-Key: pk_live_tenant_xxx`

### Issue: Cross-tenant data leak
**Cause:** Missing tenantId in query
**Fix:** Audit all Prisma queries for `where: { tenantId }`

### Issue: Commission not charged
**Cause:** application_fee_amount not set in PaymentIntent
**Fix:** Verify `commissionService.calculateCommission()` is called

### Issue: Stripe Connect onboarding fails
**Cause:** Incomplete business information
**Fix:** Ensure email, business name, country are provided

---

## Success Metrics

### Phase 1-3 (Weeks 1-12)
- [ ] Database migrated with zero data loss
- [ ] 2 test tenants created
- [ ] Widget SDK functional on test pages
- [ ] 10+ test bookings with commission
- [ ] Zero TypeScript errors

### Phase 4-6 (Weeks 13-24)
- [ ] Admin dashboard deployed
- [ ] 10 real tenants onboarded
- [ ] 100+ confirmed bookings
- [ ] $10K+ GMV (Gross Merchandise Value)
- [ ] Zero cross-tenant data leaks (verified by audit)
- [ ] 99.9% API uptime

---

## Next Immediate Steps

1. **Verify database is accessible:**
   ```bash
   pnpm exec prisma migrate status
   ```

2. **Apply migration:**
   ```bash
   pnpm exec prisma migrate dev --name add_multi_tenancy
   pnpm exec prisma generate
   ```

3. **Generate encryption key:**
   ```bash
   openssl rand -hex 32
   # Add to .env as TENANT_SECRETS_ENCRYPTION_KEY
   ```

4. **Update remaining services:**
   - booking.service.ts (integrate commission)
   - availability.service.ts (add tenantId)
   - All API routes (add tenant middleware)

5. **Test tenant creation:**
   ```bash
   pnpm --filter @elope/api exec tsx scripts/create-test-tenant.ts
   ```

---

## Additional Resources

- **Embeddable Implementation Plan:** `EMBEDDABLE_MULTI_TENANT_IMPLEMENTATION_PLAN.md` (Detailed 24-week roadmap with code examples)
- **Multi-Tenancy Readiness Report:** `MULTI_TENANCY_READINESS_REPORT.md` (Original architecture assessment)
- **Stripe Connect Docs:** https://stripe.com/docs/connect
- **Prisma Multi-Tenancy Guide:** https://www.prisma.io/docs/guides/database/multi-tenancy

---

**Last Updated:** 2025-01-06
**Branch:** `multi-tenant-embeddable`
**Status:** Phase 1 Foundation - 70% complete
