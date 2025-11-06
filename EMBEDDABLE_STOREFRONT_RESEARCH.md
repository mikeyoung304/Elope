# Embeddable Storefront Architecture Research Report

**Project:** Elope Wedding Booking Platform
**Date:** 2025-11-06
**Author:** Integration Patterns Specialist
**Purpose:** Research foundation for multi-tenant embeddable booking widget architecture

---

## Executive Summary

This report analyzes embeddable storefront architectures for the Elope wedding booking platform, which needs to be embedded into tenants' existing websites (not subdomain-based). Based on research of industry leaders (Calendly, Stripe, Shopify, Intercom, Square, Acuity Scheduling) and current best practices, we recommend a **Hybrid Approach: JavaScript SDK + iframe** with API key-based tenant identification.

**Key Recommendations:**
1. **Embedding Pattern:** JavaScript SDK that dynamically loads an iframe (Intercom pattern)
2. **Tenant Identification:** API key per tenant (`pk_live_...`) embedded in initialization code
3. **Communication:** postMessage API for iframe-parent communication
4. **Security:** CSP `frame-ancestors` directive, HTTPS-only, signature verification
5. **Performance:** CDN distribution, lazy loading, code splitting, aggressive caching

---

## 1. Embedding Pattern Analysis

### Current State: Standalone SPA

Elope is currently a standalone React SPA with:
- Single deployment for all customers (no multi-tenancy yet)
- React Router for navigation
- TanStack Query for data fetching
- Monolithic client bundle served from Vite

### Required Transformation: Embeddable Widget

To become embeddable, Elope needs to support:
- **Multiple tenants** on different domains
- **Isolated styling** (no CSS conflicts with host site)
- **Responsive sizing** (adapt to parent container)
- **Cross-origin communication** (availability checks, booking events)
- **Minimal host page impact** (< 50KB initial load)

---

## 2. Embedding Approaches: Detailed Analysis

### Approach A: Pure iframe Embed

**Pattern:**
```html
<!-- Tenant adds this to their website -->
<iframe
  src="https://widget.elope.com/booking?tenant=acme&theme=light"
  width="100%"
  height="700"
  frameborder="0">
</iframe>
```

**Pros:**
- **Complete style isolation** - No CSS conflicts with host site
- **Security** - Sandbox isolation prevents malicious code execution
- **Simple implementation** - No JavaScript required on host page
- **Browser caching** - Widget cached independently
- **Easy updates** - Deploy widget changes without tenant action

**Cons:**
- **Fixed height** - Requires manual height adjustment or postMessage resize logic
- **No parent context access** - Cannot read/write cookies or localStorage on parent domain
- **Less flexible** - Cannot programmatically control widget from parent page
- **SEO limitations** - iframe content not indexed by search engines
- **Mobile scroll issues** - Nested scrolling can be janky
- **No analytics integration** - Parent site analytics can't track widget events without postMessage

**Real-World Examples:**
- **Calendly inline embed** - Uses iframe with postMessage for events
- **Google Calendar appointment scheduling** - Pure iframe embed
- **Acuity Scheduling** - iframe with dynamic link parameters

**Best For:** Tenants who want minimal integration effort and don't need programmatic control.

---

### Approach B: Web Components (Custom Elements)

**Pattern:**
```html
<!-- Tenant adds this to their website -->
<script src="https://cdn.elope.com/widget.js"></script>
<elope-booking tenant="acme" theme="light"></elope-booking>
```

**Implementation:**
```javascript
// widget.js defines custom element
class ElopeBooking extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const tenant = this.getAttribute('tenant');
    const theme = this.getAttribute('theme');
    this.shadowRoot.innerHTML = `
      <style>/* Scoped styles */</style>
      <div class="elope-widget">
        <!-- Widget content -->
      </div>
    `;
    this.loadBookingForm(tenant, theme);
  }

  async loadBookingForm(tenant, theme) {
    // Fetch tenant config and render booking form
  }
}

customElements.define('elope-booking', ElopeBooking);
```

**Pros:**
- **Native browser API** - No framework dependencies
- **Shadow DOM isolation** - Styles scoped to component
- **Declarative** - HTML-like syntax for easy embedding
- **Flexible** - Can expose custom attributes and methods
- **Universal browser support** - 95%+ browser support in 2025
- **Parent page access** - Can read/write parent cookies/localStorage (for auth)

**Cons:**
- **Bundle size** - Must ship entire widget code to every host page
- **No sandboxing** - Runs in parent page context (security risk if compromised)
- **Shadow DOM limitations** - Global styles don't penetrate (good and bad)
- **Complex state management** - Harder to coordinate multiple widgets on same page
- **CSS variable leakage** - Parent site CSS variables can affect Shadow DOM
- **Testing complexity** - Requires Web Component testing infrastructure

**Real-World Examples:**
- **Shopify Buy Button** - Uses Web Components with Shadow DOM
- **Stripe Elements** (v3) - Uses iframe inside Web Component wrapper

**Best For:** Tenants who want tight integration and need parent page context (e.g., for user authentication).

---

### Approach C: JavaScript SDK

**Pattern:**
```html
<!-- Tenant adds this to their website -->
<script>
  window.ElopeConfig = {
    tenant: 'acme',
    apiKey: 'pk_live_abc123',
    theme: 'light'
  };
</script>
<script src="https://cdn.elope.com/widget.js" async></script>
<div id="elope-booking-widget"></div>
```

**Implementation (Intercom-style):**
```javascript
// widget.js
(function() {
  // Stub function pattern (allows calls before script loads)
  var w = window;
  var elope = w.Elope;

  if (typeof elope === 'function') {
    elope('reattach_activator');
    return;
  }

  // Create stub
  var stub = function() {
    stub.c(arguments);
  };
  stub.q = [];
  stub.c = function(args) {
    stub.q.push(args);
  };
  w.Elope = stub;

  // Load script
  var loadScript = function() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://cdn.elope.com/widget-loader.js';
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  };

  if (document.readyState === 'complete') {
    loadScript();
  } else {
    w.addEventListener('load', loadScript);
  }
})();

// Usage in tenant site:
Elope('boot', {
  tenant: 'acme',
  apiKey: 'pk_live_abc123',
  theme: 'light',
  container: '#elope-booking-widget'
});
```

**Pros:**
- **Deferred loading** - Async script loading doesn't block page render
- **Queue pattern** - API calls work even before script loads
- **Programmatic control** - Parent page can call methods (show/hide, update config)
- **Event callbacks** - Can fire custom events to parent page analytics
- **Gradual updates** - Can load features on-demand (lazy loading)
- **Familiar pattern** - Developers recognize Intercom/Segment-style API

**Cons:**
- **No style isolation** - CSS can conflict with host site (unless using iframe internally)
- **Security risk** - Runs in parent page context
- **Bundle size** - Ships all code to host page (unless using dynamic imports)
- **Breaking changes** - API changes require tenants to update embed code
- **Testing complexity** - Must test across many different host site environments

**Real-World Examples:**
- **Intercom Messenger** - SDK loads iframe dynamically
- **Segment Analytics** - SDK with queue pattern
- **Google Tag Manager** - Async script loading with stub

**Best For:** Tenants who need programmatic control and want modern JavaScript API.

---

### Approach D: Hybrid (SDK + iframe) **[RECOMMENDED]**

**Pattern:**
```html
<!-- Tenant adds this to their website -->
<script>
  (function(){
    window.ElopeConfig = {
      tenant: 'acme',
      apiKey: 'pk_live_abc123',
      theme: 'light'
    };
    var s = document.createElement('script');
    s.src = 'https://cdn.elope.com/widget-loader.js';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>
<div id="elope-booking-widget"></div>
```

**Implementation:**
```javascript
// widget-loader.js (tiny stub, ~3KB gzipped)
(function() {
  const config = window.ElopeConfig || {};

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = `https://widget.elope.com/embed?` +
    `tenant=${encodeURIComponent(config.tenant)}&` +
    `apiKey=${encodeURIComponent(config.apiKey)}&` +
    `theme=${config.theme || 'light'}`;
  iframe.style.cssText = 'width: 100%; border: none;';
  iframe.allow = 'payment';

  // Auto-resize iframe based on content
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://widget.elope.com') return;

    if (event.data.type === 'elope:resize') {
      iframe.style.height = event.data.height + 'px';
    }

    if (event.data.type === 'elope:booking:completed') {
      // Fire analytics event, redirect, etc.
      if (config.onBookingComplete) {
        config.onBookingComplete(event.data.booking);
      }
    }
  });

  // Append to container
  const container = document.querySelector(config.container || '#elope-booking-widget');
  container.appendChild(iframe);
})();
```

**iframe content (widget.elope.com/embed):**
```javascript
// Inside iframe: Send resize messages to parent
const sendResize = () => {
  const height = document.body.scrollHeight;
  window.parent.postMessage({
    type: 'elope:resize',
    height: height
  }, '*'); // Parent validates origin
};

// Observe content changes
const resizeObserver = new ResizeObserver(sendResize);
resizeObserver.observe(document.body);

// Send events to parent
const onBookingComplete = (booking) => {
  window.parent.postMessage({
    type: 'elope:booking:completed',
    booking: booking
  }, '*');
};
```

**Pros:**
- **Best of both worlds** - Style isolation (iframe) + programmatic control (SDK)
- **Security** - Widget runs in separate origin, sandboxed
- **Auto-resize** - postMessage handles responsive height
- **Small initial bundle** - Loader is ~3KB, rest loads in iframe
- **Easy updates** - Change iframe content without tenant code changes
- **Analytics integration** - SDK can forward events to parent page analytics
- **Parent context access** - SDK can read parent cookies/localStorage and pass to iframe
- **Progressive enhancement** - Works with JS disabled (show fallback link)

**Cons:**
- **Two-part deployment** - Must deploy both loader SDK and iframe content
- **postMessage overhead** - Cross-origin communication adds latency (~1-5ms per message)
- **More complex** - Requires coordination between loader and iframe

**Real-World Examples:**
- **Intercom Messenger** - SDK loads iframe, uses postMessage for events
- **Stripe Checkout (embedded)** - SDK creates iframe, postMessage for completion
- **Calendly (advanced embed)** - SDK wraps iframe for event callbacks

**Best For:** Production embeddable widgets that need security, flexibility, and ease of updates. **This is the recommended approach for Elope.**

---

## 3. Tenant Identification Strategy

### Current State: Single-Tenant

Elope currently has:
- One database with global data (packages, bookings, blackouts)
- No tenant isolation in data model
- Admin login for single business owner

### Required Transformation: Multi-Tenant Architecture

To support multiple tenants (wedding businesses) on different websites, Elope needs:

1. **Data isolation** - Each tenant's data (packages, bookings, customers) must be separated
2. **Configuration per tenant** - Branding, pricing, availability rules
3. **Security** - Tenants cannot access each other's data
4. **Billing** - Track usage per tenant for SaaS pricing

### Database Schema Changes Required

**Option A: Shared Database, Row-Level Tenancy (Recommended for MVP)**

Add `tenantId` to all models:

```prisma
model Tenant {
  id          String   @id @default(cuid())
  slug        String   @unique // "acme-weddings"
  name        String   // "Acme Weddings"
  domain      String?  @unique // "acmeweddings.com" (for domain-based lookup)
  apiKey      String   @unique // "pk_live_abc123..."
  apiSecret   String   // For webhook signature verification
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Tenant-specific configuration
  branding    Json?    // { primaryColor, logo, etc. }
  settings    Json?    // { timezone, currency, etc. }

  packages    Package[]
  bookings    Booking[]
  customers   Customer[]
  blackouts   BlackoutDate[]
  users       User[]
}

model Package {
  id          String   @id @default(cuid())
  tenantId    String   // Foreign key to Tenant
  slug        String
  name        String
  // ... rest of fields

  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, slug]) // Unique slug per tenant
  @@index([tenantId, active])
}

// Repeat for Booking, Customer, BlackoutDate, etc.
```

**Pros:**
- Simple to implement
- Good for small-to-medium number of tenants (< 1000)
- Cost-effective (one database)
- Easy to aggregate data across tenants (analytics)

**Cons:**
- Risk of data leakage (must enforce tenantId in ALL queries)
- Harder to scale horizontally
- Cannot customize database schema per tenant

**Option B: Database-per-Tenant**

Each tenant gets their own PostgreSQL database/schema.

**Pros:**
- Complete data isolation
- Easy to scale (shard by tenant)
- Can customize schema per tenant
- Easy to backup/restore individual tenants

**Cons:**
- Higher infrastructure cost
- More complex connection pooling
- Harder to aggregate data across tenants
- Migration complexity (must migrate all tenant databases)

**Recommendation:** Start with **Option A (Row-Level Tenancy)** for MVP. Migrate to Option B if scaling issues emerge (unlikely for wedding booking use case with < 100 tenants).

---

### Tenant Identification Methods

#### Method 1: API Key (Recommended)

**Pattern:**
```html
<script>
  window.ElopeConfig = {
    apiKey: 'pk_live_acme_abc123...' // Identifies tenant + authorizes embed
  };
</script>
```

**Backend Validation:**
```typescript
// Lookup tenant by API key
const tenant = await tenantRepo.findByApiKey(apiKey);
if (!tenant || !tenant.active) {
  throw new UnauthorizedError('Invalid API key');
}

// Attach tenant to request context (DI)
req.tenant = tenant;
```

**API Key Format:**
```
pk_live_<tenant_slug>_<random_32_chars>
pk_test_<tenant_slug>_<random_32_chars> (for testing)
```

**Pros:**
- **Simple** - One parameter identifies tenant
- **Secure** - Can rotate keys without changing embed code structure
- **Familiar** - Stripe-style API key pattern
- **Revocable** - Can disable key without deleting tenant
- **Testable** - Separate test/live keys

**Cons:**
- **Exposes key** - API key visible in HTML source (mitigated by key restrictions)
- **Key leakage** - If key is compromised, attacker can embed widget on their site

**Mitigation:**
- **Domain allowlist** - Restrict API key to specific domains
- **Rate limiting** - Prevent abuse of leaked keys
- **Monitoring** - Alert on unusual widget load patterns
- **Key rotation** - Allow tenants to rotate keys easily

---

#### Method 2: Domain-Based Lookup

**Pattern:**
```javascript
// widget-loader.js detects parent domain
const parentDomain = window.location.hostname; // "acmeweddings.com"

// Send to API to lookup tenant
fetch(`https://api.elope.com/v1/tenants/by-domain?domain=${parentDomain}`)
  .then(res => res.json())
  .then(tenant => loadWidget(tenant));
```

**Backend:**
```typescript
// Lookup tenant by domain
const tenant = await tenantRepo.findByDomain(domain);
if (!tenant) {
  throw new NotFoundError('No tenant found for domain');
}
```

**Pros:**
- **No API key required** - Tenants just add script tag
- **Automatic** - No configuration needed
- **Secure** - Cannot spoof domain (browser enforces)

**Cons:**
- **Domain verification required** - Must verify tenant owns domain (DNS TXT record)
- **Subdomain issues** - Must handle www vs non-www, subdomains
- **Multiple domains** - One tenant may have multiple domains (requires mapping)
- **Local testing** - Cannot test on localhost (no domain)
- **Slower** - Requires API call to lookup tenant before loading widget

---

#### Method 3: Tenant Slug in URL

**Pattern:**
```html
<script src="https://cdn.elope.com/widget.js" data-tenant="acme"></script>
```

**Pros:**
- **Simple** - Just specify tenant slug
- **Human-readable** - Easy to debug

**Cons:**
- **No authentication** - Anyone can embed any tenant's widget (security issue!)
- **Not revocable** - Cannot disable without changing slug
- **Collision risk** - Slug must be globally unique

---

#### Method 4: JWT Token

**Pattern:**
```html
<script>
  window.ElopeConfig = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Signed JWT with tenant ID
  };
</script>
```

**Pros:**
- **Secure** - Token is signed and verified
- **Expirable** - Can set short TTL
- **Flexible** - Can embed additional metadata (user ID, permissions)

**Cons:**
- **Complex** - Requires tenant to generate tokens server-side
- **Token refresh** - Must handle expired tokens
- **Overkill** - Too complex for simple widget embed

---

### Recommendation: API Key (Method 1)

**Rationale:**
- Balances security, simplicity, and flexibility
- Follows industry standard (Stripe, Segment, Intercom all use API keys)
- Easy to implement and debug
- Supports test/live modes
- Revocable and rate-limitable

**Domain Allowlist Enhancement:**
```prisma
model Tenant {
  // ...
  allowedDomains String[] // ["acmeweddings.com", "www.acmeweddings.com"]
}
```

**Validation on widget load:**
```typescript
// In widget iframe
const referrer = document.referrer; // Parent page URL
const referrerDomain = new URL(referrer).hostname;

// Validate against tenant's allowed domains
if (!tenant.allowedDomains.includes(referrerDomain)) {
  throw new UnauthorizedError('Domain not allowed');
}
```

---

## 4. Real-World Pattern Analysis

### Calendly: iframe + postMessage

**Embed Code:**
```html
<div class="calendly-inline-widget"
     data-url="https://calendly.com/acme/30min"
     style="min-width:320px;height:700px;">
</div>
<script src="https://assets.calendly.com/assets/external/widget.js"></script>
```

**Key Patterns:**
- **iframe inside div** - SDK creates iframe, inserts into div
- **postMessage events** - `event_scheduled`, `event_type_viewed`, `date_and_time_selected`
- **Auto-resize** - iframe sends height updates to parent
- **Deep linking** - URL parameters for pre-selected date/time
- **Prefill** - Can pass name/email via URL params

**Lessons:**
- postMessage events enable analytics integration (critical for tenants)
- Auto-resize is essential (users hate nested scrollbars)
- Prefill data reduces friction (use URL params or postMessage)

---

### Stripe Checkout: SDK + iframe + postMessage

**Embed Code (Embedded Checkout):**
```html
<script src="https://js.stripe.com/v3/"></script>
<script>
  const stripe = Stripe('pk_test_...');
  const checkout = await stripe.initEmbeddedCheckout({
    clientSecret: 'cs_test_...'
  });
  checkout.mount('#checkout');
</script>
```

**Key Patterns:**
- **SDK creates iframe** - Stripe.js creates iframe for PCI compliance
- **Server session required** - Must create `CheckoutSession` server-side first
- **Client secret** - One-time token for checkout session (expires after use)
- **Completion redirect** - After payment, redirects to `return_url`
- **Webhook confirmation** - Don't trust redirect, verify via webhook

**Lessons:**
- Two-step initialization (server session + client mount) is secure
- Client secrets prevent replay attacks
- Always verify payment status via webhook (not client redirect)

---

### Shopify Buy Button: JavaScript SDK (No iframe)

**Embed Code:**
```html
<script src="https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js"></script>
<script>
  ShopifyBuy.UI.onReady(client).then(ui => {
    ui.createComponent('product', {
      id: '123456789',
      node: document.getElementById('product-component'),
      options: {
        product: {
          buttonDestination: 'checkout'
        }
      }
    });
  });
</script>
```

**Key Patterns:**
- **No iframe** - Renders directly into parent page DOM
- **Extensive customization** - Mustache templates, CSS overrides
- **Cart state** - Persists cart in localStorage
- **Checkout redirect** - Redirects to Shopify-hosted checkout

**Lessons:**
- Direct DOM rendering gives maximum flexibility but risks CSS conflicts
- localStorage cart state enables multi-page experiences
- Redirecting to hosted checkout avoids PCI compliance burden

**Why Elope should NOT copy this:**
- No style isolation (CSS conflicts likely)
- Security risk (compromised widget = XSS on parent page)
- Harder to update (must version SDK carefully)

---

### Intercom Messenger: SDK + iframe + postMessage

**Embed Code:**
```html
<script>
  window.intercomSettings = {
    app_id: "abc123",
    name: "John Doe",
    email: "john@example.com"
  };
</script>
<script>
  (function(){
    var w=window;var ic=w.Intercom;
    if(typeof ic==="function"){
      ic('reattach_activator');
    }else{
      var d=document;
      var i=function(){i.c(arguments);};
      i.q=[];
      i.c=function(args){i.q.push(args);};
      w.Intercom=i;
      var l=function(){
        var s=d.createElement('script');
        s.src='https://widget.intercom.io/widget/abc123';
        s.async=true;
        var x=d.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s,x);
      };
      if(document.readyState==='complete'){
        l();
      }else{
        w.addEventListener('load',l);
      }
    }
  })();
</script>
```

**Key Patterns:**
- **Stub function queue** - Allows calls before script loads (critical for page load performance)
- **Lazy loading** - Script loads after page load (doesn't block render)
- **SDK methods** - `Intercom('boot')`, `Intercom('update')`, `Intercom('show')`
- **iframe messenger** - Chat widget is iframe positioned fixed in corner
- **postMessage** - SDK communicates with iframe via postMessage

**Lessons:**
- Stub queue pattern is essential for non-blocking load
- Fixed positioning iframe works for modal-style widgets (not full-width embed)
- SDK API provides programmatic control (boot, update, show/hide)

**Elope should adopt:**
- Stub queue pattern for SDK
- Lazy loading after page load
- postMessage for iframe communication

---

### Square Appointments & Acuity Scheduling

**Patterns:**
- **iframe embed** - Simple iframe with dynamic link parameters
- **Direct links** - Can deep-link to specific appointment types
- **Customization** - Limited theme customization (colors, logo)

**Lessons:**
- iframe is sufficient for most booking use cases
- Deep linking is important (pre-select package, date)
- White-label branding matters (logo, colors)

---

## 5. Responsive & UX Considerations

### Auto-Resizing iframe

**Problem:** iframe height must adapt to content without nested scrollbars.

**Solution: postMessage + ResizeObserver**

**iframe (widget content):**
```javascript
// Send height updates to parent
const sendHeight = () => {
  const height = document.body.scrollHeight;
  window.parent.postMessage({
    type: 'elope:resize',
    height: height
  }, '*'); // Parent validates origin
};

// Observe DOM changes
const resizeObserver = new ResizeObserver(sendHeight);
resizeObserver.observe(document.body);

// Also send on load
window.addEventListener('load', sendHeight);
```

**Parent (loader SDK):**
```javascript
window.addEventListener('message', (event) => {
  // Validate origin for security
  if (event.origin !== 'https://widget.elope.com') return;

  if (event.data.type === 'elope:resize') {
    iframe.style.height = event.data.height + 'px';
  }
});
```

**Edge Cases:**
- **Image loading** - Send resize after images load (`img.onload`)
- **Animations** - Debounce resize messages (max 10 per second)
- **Min/max height** - Enforce minimum 400px, maximum 2000px
- **Mobile** - Use `vh` units for full-screen modals

---

### Mobile-Friendly Embedding

**Challenges:**
- Small screens (320px width)
- Touch events (not mouse)
- Virtual keyboard resizes viewport
- Slow networks

**Solutions:**

1. **Responsive breakpoints:**
```css
/* iframe content */
@media (max-width: 640px) {
  .booking-form {
    padding: 1rem; /* Reduce padding */
  }

  .date-picker {
    font-size: 14px; /* Smaller text */
  }
}
```

2. **Touch-friendly targets:**
```css
button, a, input {
  min-height: 44px; /* Apple HIG recommendation */
  min-width: 44px;
}
```

3. **Lazy loading images:**
```html
<img src="placeholder.jpg" data-src="package-photo.jpg" loading="lazy" />
```

4. **Reduce bundle size:**
- Remove desktop-only features (hover states)
- Use dynamic imports for optional features
- Compress images (WebP, responsive images)

---

### Loading States & Spinners

**Problem:** Widget takes 1-3 seconds to load and render.

**Solution: Progressive loading**

1. **Instant skeleton (in loader SDK):**
```html
<div id="elope-booking-widget">
  <div class="elope-skeleton">
    <div class="skeleton-header"></div>
    <div class="skeleton-content"></div>
    <div class="skeleton-footer"></div>
  </div>
</div>
```

2. **Replace with iframe when ready:**
```javascript
iframe.onload = () => {
  skeleton.style.display = 'none';
  iframe.style.display = 'block';
};
```

3. **Optimistic rendering (in iframe):**
- Show date picker immediately
- Load packages in background
- Cache availability data for 5 minutes

---

### Error Handling

**Failure Scenarios:**
1. **Widget script fails to load** (CDN down, ad blocker)
2. **API request fails** (network error, server down)
3. **iframe blocked** (CSP, X-Frame-Options)
4. **Invalid API key** (tenant not found, key revoked)

**Fallbacks:**

1. **Script load failure:**
```html
<noscript>
  <a href="https://widget.elope.com/booking?tenant=acme">
    Book your wedding
  </a>
</noscript>
```

2. **API failure:**
```javascript
// In iframe
if (fetchError) {
  showErrorMessage('Unable to load booking form. Please try again later.');
  showFallbackLink(`https://widget.elope.com/booking?tenant=${tenant}`);
}
```

3. **iframe blocked:**
```javascript
// In loader SDK
iframe.onerror = () => {
  container.innerHTML = `
    <div class="elope-error">
      <p>Unable to load booking widget.</p>
      <a href="https://widget.elope.com/booking?tenant=${config.tenant}">
        Book on our website
      </a>
    </div>
  `;
};
```

---

### Accessibility (a11y)

**Requirements:**
- Keyboard navigation (tab order, focus management)
- Screen reader support (ARIA labels, live regions)
- Color contrast (WCAG AA: 4.5:1 for text)
- Focus indicators (visible outline on focus)

**Implementation:**

1. **Skip link (inside iframe):**
```html
<a href="#booking-form" class="skip-link">Skip to booking form</a>
```

2. **ARIA landmarks:**
```html
<header role="banner">
<nav role="navigation" aria-label="Booking steps">
<main role="main" id="booking-form">
<footer role="contentinfo">
```

3. **Live regions for dynamic content:**
```html
<div role="status" aria-live="polite" aria-atomic="true">
  Date selected: June 15, 2025
</div>
```

4. **Focus management:**
```javascript
// After step transition, move focus to next input
nextStepButton.addEventListener('click', () => {
  showNextStep();
  document.querySelector('#next-step input').focus();
});
```

5. **Keyboard traps:**
```javascript
// Prevent tab from leaving iframe (modal behavior)
const trapFocus = (e) => {
  const focusableElements = iframe.querySelectorAll('a, button, input, select');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault();
    lastElement.focus();
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault();
    firstElement.focus();
  }
};

document.addEventListener('keydown', trapFocus);
```

---

## 6. Styling & Theming

### Challenge: White-Label Customization

Each tenant wants:
- Custom colors (primary, secondary, background)
- Custom fonts (brand font families)
- Custom logo
- Light/dark mode

### Approach: CSS Variables + Theme Config

**1. Tenant configuration (stored in DB):**
```json
{
  "branding": {
    "logo": "https://cdn.acme.com/logo.png",
    "primaryColor": "#8B5CF6",
    "secondaryColor": "#10B981",
    "fontFamily": "'Inter', sans-serif",
    "borderRadius": "8px"
  }
}
```

**2. Inject CSS variables into iframe:**
```html
<style id="tenant-theme">
  :root {
    --primary-color: #8B5CF6;
    --secondary-color: #10B981;
    --font-family: 'Inter', sans-serif;
    --border-radius: 8px;
  }
</style>
```

**3. Use variables in widget styles:**
```css
.booking-button {
  background-color: var(--primary-color);
  font-family: var(--font-family);
  border-radius: var(--border-radius);
}
```

**4. Runtime theme switching:**
```javascript
// Allow parent page to change theme
window.addEventListener('message', (event) => {
  if (event.data.type === 'elope:theme:update') {
    updateCSSVariables(event.data.theme);
  }
});
```

---

### Font Loading Strategy

**Problem:** Custom fonts add 50-100KB to initial load.

**Solution: Subset fonts + preload**

1. **Subset fonts (only needed characters):**
```
pyftsubset Inter-Regular.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF" \
  --output-file="inter-subset.woff2"
```

2. **Preload critical fonts:**
```html
<link rel="preload"
      href="/fonts/inter-subset.woff2"
      as="font"
      type="font/woff2"
      crossorigin>
```

3. **Fallback fonts:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

---

### Dark Mode Support

**Detect parent page theme:**
```javascript
// In loader SDK
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Pass to iframe via URL param
const iframeUrl = `https://widget.elope.com/embed?theme=${isDarkMode ? 'dark' : 'light'}`;
```

**Listen for theme changes:**
```javascript
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const newTheme = e.matches ? 'dark' : 'light';
  iframe.contentWindow.postMessage({
    type: 'elope:theme:change',
    theme: newTheme
  }, 'https://widget.elope.com');
});
```

---

## 7. Performance Optimization

### CDN Distribution

**Requirements:**
- Global CDN with edge caching (Cloudflare, Fastly, AWS CloudFront)
- HTTPS-only
- Immutable URLs for widget versions
- Short TTL for loader SDK (1 hour), long TTL for versioned bundles (1 year)

**URL Structure:**
```
https://cdn.elope.com/widget-loader.js          (always latest, cache 1 hour)
https://cdn.elope.com/v2/widget-abc123.js       (versioned, cache 1 year)
https://cdn.elope.com/v2/widget-abc123.css      (versioned, cache 1 year)
```

**Cache Headers:**
```
# Loader SDK (latest)
Cache-Control: public, max-age=3600, stale-while-revalidate=86400

# Versioned bundles (immutable)
Cache-Control: public, max-age=31536000, immutable
```

---

### Lazy Loading Strategy

**Goal:** Load minimal code upfront, load features on-demand.

**1. Defer non-critical features:**
```javascript
// Load immediately
import { BookingForm } from './components/BookingForm';

// Load on-demand
const lazyLoadAddOns = () => import('./components/AddOnSelector');
const lazyLoadPayment = () => import('./components/PaymentForm');
```

**2. Route-based code splitting (in iframe):**
```javascript
// React Router with lazy loading
const DatePicker = lazy(() => import('./pages/DatePicker'));
const PackageSelector = lazy(() => import('./pages/PackageSelector'));
const Checkout = lazy(() => import('./pages/Checkout'));

<Suspense fallback={<Spinner />}>
  <Routes>
    <Route path="/" element={<DatePicker />} />
    <Route path="/packages" element={<PackageSelector />} />
    <Route path="/checkout" element={<Checkout />} />
  </Routes>
</Suspense>
```

**3. Lazy load images:**
```jsx
<img
  src="placeholder.jpg"
  data-src="package-photo.jpg"
  loading="lazy"
  alt="Wedding package"
/>
```

---

### Code Splitting Techniques

**1. Vendor splitting:**
```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'date-vendor': ['date-fns'],
        }
      }
    }
  }
};
```

**2. Dynamic imports for large libraries:**
```javascript
// Only load date picker library when needed
const openDatePicker = async () => {
  const { DatePicker } = await import('./components/DatePicker');
  renderDatePicker(DatePicker);
};
```

---

### Bundle Size Budget

**Target:** < 150KB total JavaScript (gzipped)

**Breakdown:**
- Loader SDK: 3KB
- React + ReactDOM: 45KB
- UI components (Radix): 20KB
- Date library (date-fns): 15KB
- API client (ts-rest): 10KB
- Booking form: 30KB
- Styles (CSS): 15KB
- **Total:** ~138KB

**Monitoring:**
```json
{
  "scripts": {
    "build:analyze": "vite build --mode analyze && vite-bundle-analyzer"
  }
}
```

---

### Caching Strategy

**1. Service Worker (optional, advanced):**
```javascript
// Cache widget assets for offline access
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('elope-widget-v2').then((cache) => {
      return cache.addAll([
        '/embed',
        '/widget-v2.js',
        '/widget-v2.css',
      ]);
    })
  );
});
```

**2. HTTP caching (essential):**
- API responses: `Cache-Control: private, max-age=300` (5 min)
- Static assets: `Cache-Control: public, max-age=31536000, immutable`
- HTML: `Cache-Control: no-cache` (always revalidate)

**3. In-memory caching (in iframe):**
```javascript
// Cache tenant config for session
const tenantConfigCache = new Map();

const getTenantConfig = async (tenantId) => {
  if (tenantConfigCache.has(tenantId)) {
    return tenantConfigCache.get(tenantId);
  }
  const config = await fetchTenantConfig(tenantId);
  tenantConfigCache.set(tenantId, config);
  return config;
};
```

---

## 8. Security Best Practices

### Content Security Policy (CSP)

**For iframe content (widget.elope.com):**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://cdn.elope.com https://tenant-cdn.com;
  connect-src 'self' https://api.elope.com;
  frame-ancestors https://acmeweddings.com https://www.acmeweddings.com;
```

**Key Directives:**
- `frame-ancestors` - Allow embedding on tenant domains (replaces X-Frame-Options)
- `connect-src` - Allow API calls to Elope backend
- `img-src` - Allow images from tenant CDN (for logos)

**Dynamic `frame-ancestors`:**
```typescript
// Generate CSP header based on tenant's allowed domains
const csp = `
  default-src 'self';
  frame-ancestors ${tenant.allowedDomains.join(' ')};
`;

res.setHeader('Content-Security-Policy', csp);
```

---

### X-Frame-Options (Legacy)

**For modern browsers, use CSP `frame-ancestors` instead.**

If supporting IE11:
```
X-Frame-Options: ALLOW-FROM https://acmeweddings.com
```

**Note:** X-Frame-Options only allows ONE domain. Use CSP for multiple domains.

---

### API Key Security

**1. Key format:**
```
pk_live_<tenant_slug>_<random_32_chars>
pk_test_<tenant_slug>_<random_32_chars>
```

**2. Key restrictions (stored in DB):**
```prisma
model ApiKey {
  id              String   @id @default(cuid())
  tenantId        String
  key             String   @unique
  keyType         String   // "live" or "test"
  allowedDomains  String[] // ["acmeweddings.com"]
  rateLimit       Int      @default(100) // Requests per minute
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime?
}
```

**3. Validation middleware:**
```typescript
export const validateApiKey = async (req, res, next) => {
  const apiKey = req.query.apiKey || req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const key = await apiKeyRepo.findByKey(apiKey);

  if (!key || !key.active) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Validate referrer domain
  const referrer = req.headers.referer;
  if (referrer) {
    const referrerDomain = new URL(referrer).hostname;
    if (!key.allowedDomains.includes(referrerDomain)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
  }

  // Rate limiting (check redis)
  const rateLimitKey = `rate:${key.id}`;
  const requests = await redis.incr(rateLimitKey);
  if (requests === 1) {
    await redis.expire(rateLimitKey, 60); // 1 minute window
  }
  if (requests > key.rateLimit) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // Update last used timestamp
  await apiKeyRepo.updateLastUsed(key.id);

  // Attach tenant to request
  req.tenant = await tenantRepo.findById(key.tenantId);
  next();
};
```

---

### Webhook Signature Verification

**Problem:** Malicious actor could send fake webhook events.

**Solution: HMAC signature verification (Stripe pattern)**

**1. Generate secret per tenant:**
```typescript
const webhookSecret = crypto.randomBytes(32).toString('hex');
// Store in tenant.apiSecret
```

**2. Sign webhook payload (from Elope to tenant webhook endpoint):**
```typescript
const payload = JSON.stringify(event);
const signature = crypto
  .createHmac('sha256', tenant.apiSecret)
  .update(payload)
  .digest('hex');

// Send to tenant webhook
await fetch(tenant.webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Elope-Signature': signature,
  },
  body: payload,
});
```

**3. Verify signature (tenant's webhook handler):**
```typescript
const receivedSignature = req.headers['x-elope-signature'];
const payload = req.body;

const expectedSignature = crypto
  .createHmac('sha256', process.env.ELOPE_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// Process webhook
processBookingEvent(payload);
```

---

### HTTPS Only

**Enforce HTTPS for all widget loads:**

```javascript
// In loader SDK
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  console.error('Elope widget requires HTTPS');
  return;
}
```

**Server-side HTTPS redirect:**
```typescript
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
});
```

---

### Clickjacking Protection

**Problem:** Attacker embeds widget in invisible iframe, tricks user into clicking.

**Solution: Frame-ancestors + UI indicators**

1. **CSP frame-ancestors** (already covered)
2. **Visual indicators in widget:**
```html
<div class="tenant-badge">
  Booking for Acme Weddings
</div>
```

3. **Confirm sensitive actions:**
```javascript
// Before payment, show confirmation dialog
const confirmBooking = () => {
  if (confirm('Confirm booking for $5,000 on June 15, 2025?')) {
    submitBooking();
  }
};
```

---

## 9. Recommended Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tenant Website                            │
│  (acmeweddings.com)                                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Loader SDK (widget-loader.js, 3KB)                    │ │
│  │  - Reads ElopeConfig from window                        │ │
│  │  - Validates API key format                             │ │
│  │  - Creates iframe with signed URL                       │ │
│  │  - Listens for postMessage events                       │ │
│  │  - Handles resize, events, errors                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  <iframe src="widget.elope.com/embed?apiKey=...">      │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────┐    │ │
│  │  │  Widget App (React SPA)                         │    │ │
│  │  │  - Date picker                                   │    │ │
│  │  │  - Package selector                              │    │ │
│  │  │  - Add-on selector                               │    │ │
│  │  │  - Checkout form                                 │    │ │
│  │  │  - Payment (Stripe)                              │    │ │
│  │  └────────────────────────────────────────────────┘    │ │
│  │                                                          │ │
│  │  Sends postMessage to parent:                           │ │
│  │  - elope:resize (height changes)                        │ │
│  │  - elope:booking:started                                │ │
│  │  - elope:booking:completed                              │ │
│  │  - elope:error                                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

                          ▼ HTTPS API calls

┌─────────────────────────────────────────────────────────────┐
│                    Elope Backend                             │
│  (api.elope.com)                                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (Express + ts-rest)                         │ │
│  │  - GET /v1/tenants/config?apiKey=...                    │ │
│  │  - GET /v1/tenants/:id/packages                         │ │
│  │  - GET /v1/tenants/:id/availability?date=...           │ │
│  │  - POST /v1/tenants/:id/bookings/checkout              │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services (Business Logic)                              │ │
│  │  - TenantService (config, validation)                   │ │
│  │  - CatalogService (packages, add-ons)                   │ │
│  │  - AvailabilityService (date checking)                  │ │
│  │  - BookingService (checkout, webhooks)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Repositories (Data Access)                             │ │
│  │  - TenantRepository (Prisma)                            │ │
│  │  - CatalogRepository (Prisma)                           │ │
│  │  - BookingRepository (Prisma)                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database (Supabase)                         │ │
│  │  - Tenants (id, slug, apiKey, allowedDomains, config)  │ │
│  │  - Packages (tenantId, slug, name, price)              │ │
│  │  - Bookings (tenantId, customerId, date, status)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### Tenant Onboarding Flow

**1. Sign up:**
```
POST /v1/tenants/signup
{
  "businessName": "Acme Weddings",
  "email": "owner@acmeweddings.com",
  "domain": "acmeweddings.com"
}

Response:
{
  "tenantId": "tenant_abc123",
  "apiKey": "pk_live_acme_xyz789...",
  "apiSecret": "sk_live_...", // For webhook verification
  "embedCode": "<script>...</script>" // Copy-paste embed code
}
```

**2. Domain verification (optional, for security):**
```
Add TXT record to DNS:
_elope-verification.acmeweddings.com = "elope_verify_abc123"

Then verify:
POST /v1/tenants/:id/verify-domain
```

**3. Configure packages:**
```
POST /v1/tenants/:id/packages
{
  "slug": "intimate-ceremony",
  "name": "Intimate Ceremony",
  "basePrice": 500000, // $5,000 in cents
  "description": "...",
  "photoUrl": "..."
}
```

**4. Embed widget on website:**
```html
<!-- Add to website footer or booking page -->
<script>
  (function(){
    window.ElopeConfig = {
      apiKey: 'pk_live_acme_xyz789...',
      theme: 'light',
      container: '#booking-widget'
    };
    var s = document.createElement('script');
    s.src = 'https://cdn.elope.com/widget-loader.js';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>
<div id="booking-widget"></div>
```

---

### API Endpoints (New for Multi-Tenant)

**Tenant Configuration:**
```
GET /v1/tenants/config?apiKey=pk_live_...
Response:
{
  "tenantId": "tenant_abc123",
  "slug": "acme-weddings",
  "name": "Acme Weddings",
  "branding": {
    "logo": "https://cdn.acme.com/logo.png",
    "primaryColor": "#8B5CF6",
    "fontFamily": "'Inter', sans-serif"
  },
  "settings": {
    "timezone": "America/New_York",
    "currency": "USD"
  }
}
```

**Tenant Packages:**
```
GET /v1/tenants/:tenantId/packages
Response:
[
  {
    "id": "pkg_123",
    "slug": "intimate-ceremony",
    "name": "Intimate Ceremony",
    "basePrice": 500000,
    "addOns": [...]
  }
]
```

**Tenant Availability:**
```
GET /v1/tenants/:tenantId/availability?date=2025-06-15
Response:
{
  "date": "2025-06-15",
  "available": true
}

GET /v1/tenants/:tenantId/availability/batch?startDate=2025-06&endDate=2025-07
Response:
{
  "unavailableDates": ["2025-06-10", "2025-06-15", "2025-06-20"]
}
```

**Tenant Checkout:**
```
POST /v1/tenants/:tenantId/bookings/checkout
{
  "packageId": "pkg_123",
  "eventDate": "2025-06-15",
  "coupleName": "John & Jane",
  "email": "john@example.com",
  "addOnIds": ["addon_1", "addon_2"]
}

Response:
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_live_..."
}
```

---

### postMessage Event Protocol

**Events sent from iframe to parent:**

```typescript
// Type definitions
interface ElopeEvent {
  type: string;
  [key: string]: any;
}

// Resize event (sent frequently)
{
  type: 'elope:resize',
  height: 1200
}

// Booking started
{
  type: 'elope:booking:started',
  packageId: 'pkg_123',
  eventDate: '2025-06-15'
}

// Booking completed (after Stripe payment)
{
  type: 'elope:booking:completed',
  bookingId: 'booking_xyz',
  packageId: 'pkg_123',
  eventDate: '2025-06-15',
  totalPrice: 500000,
  customerEmail: 'john@example.com'
}

// Error
{
  type: 'elope:error',
  error: 'Date unavailable',
  code: 'BOOKING_CONFLICT'
}

// Navigation (optional, for analytics)
{
  type: 'elope:navigate',
  path: '/packages'
}
```

**Listener in loader SDK:**
```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://widget.elope.com') return;

  const config = window.ElopeConfig;

  switch (event.data.type) {
    case 'elope:resize':
      iframe.style.height = event.data.height + 'px';
      break;

    case 'elope:booking:completed':
      // Fire analytics event
      if (config.onBookingComplete) {
        config.onBookingComplete(event.data);
      }
      // Example: Google Analytics
      if (window.gtag) {
        gtag('event', 'booking_completed', {
          value: event.data.totalPrice / 100,
          currency: 'USD'
        });
      }
      break;

    case 'elope:error':
      console.error('Elope widget error:', event.data.error);
      if (config.onError) {
        config.onError(event.data);
      }
      break;
  }
});
```

---

## 10. Implementation Roadmap

### Phase 1: Multi-Tenant Data Model (2 weeks)

**Tasks:**
1. Add `Tenant` model to Prisma schema
2. Add `tenantId` foreign key to all models (Package, Booking, Customer, etc.)
3. Create migration
4. Seed with 2 test tenants
5. Update repositories to filter by `tenantId`
6. Add `TenantService` for config management
7. Create tenant middleware (attach tenant to request context)

**Database Changes:**
```prisma
model Tenant {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  domain          String?  @unique
  apiKey          String   @unique
  apiSecret       String
  allowedDomains  String[]
  active          Boolean  @default(true)
  branding        Json?
  settings        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  packages        Package[]
  bookings        Booking[]
  customers       Customer[]
  blackouts       BlackoutDate[]
  users           User[]
}
```

**API Changes:**
- Add `GET /v1/tenants/config?apiKey=...` endpoint
- Wrap all existing endpoints with tenant context
- Update contracts to include tenantId validation

---

### Phase 2: iframe Widget App (3 weeks)

**Tasks:**
1. Create separate `widget/` subdirectory in client
2. Build standalone React app for iframe (no AppShell, simplified routing)
3. Fetch tenant config on load
4. Implement postMessage resize logic
5. Add theme CSS variables injection
6. Deploy widget app to `widget.elope.com` subdomain
7. Configure CSP headers with dynamic `frame-ancestors`

**Widget Routes:**
```
/embed?apiKey=...&theme=...  -> Main booking flow
  /packages                  -> Package selection
  /date                      -> Date picker
  /addons                    -> Add-on selector
  /checkout                  -> Stripe Checkout redirect
  /success                   -> Booking confirmation
```

**Build Configuration:**
```javascript
// vite.config.ts (widget app)
export default {
  base: '/embed/',
  build: {
    outDir: 'dist/widget',
    rollupOptions: {
      input: 'src/widget/main.tsx'
    }
  }
};
```

---

### Phase 3: Loader SDK (1 week)

**Tasks:**
1. Create `widget-loader.js` with stub queue pattern
2. Implement iframe creation logic
3. Add postMessage listeners
4. Add error handling (fallback to direct link)
5. Add skeleton loader (instant feedback)
6. Deploy to CDN (Cloudflare CDN or AWS CloudFront)
7. Generate versioned URLs

**Deliverables:**
- `https://cdn.elope.com/widget-loader.js` (latest, 3KB)
- `https://cdn.elope.com/v2/widget-loader-abc123.js` (versioned, immutable)

---

### Phase 4: Tenant Dashboard (2 weeks)

**Tasks:**
1. Add "Embed Widget" tab to admin dashboard
2. Show embed code snippet (copy-paste)
3. API key management (view, regenerate, test/live toggle)
4. Domain allowlist management
5. Theme customization UI (color picker, logo upload)
6. Preview iframe (test embed code)
7. Webhook configuration (URL, secret)

**UI Mockup:**
```
┌────────────────────────────────────────────────────┐
│  Embed Widget                                       │
├────────────────────────────────────────────────────┤
│                                                      │
│  Copy this code to your website:                    │
│  ┌────────────────────────────────────────────┐    │
│  │ <script>                                    │    │
│  │   window.ElopeConfig = {                    │    │
│  │     apiKey: 'pk_live_acme_abc123...'        │    │
│  │   };                                         │    │
│  │ </script>                                    │    │
│  │ <script src="https://cdn.elope.com/...">   │    │
│  │ <div id="elope-booking-widget"></div>       │    │
│  └────────────────────────────────────────────┘    │
│  [Copy Code]                                        │
│                                                      │
│  API Keys                                           │
│  Test: pk_test_acme_xyz... [Show] [Regenerate]     │
│  Live: pk_live_acme_abc... [Show] [Regenerate]     │
│                                                      │
│  Allowed Domains                                    │
│  • acmeweddings.com          [Remove]               │
│  • www.acmeweddings.com      [Remove]               │
│  [+ Add Domain]                                     │
│                                                      │
│  Theme Customization                                │
│  Primary Color: [#8B5CF6] 🎨                        │
│  Logo: [Upload]                                     │
│                                                      │
│  Preview                                            │
│  ┌────────────────────────────────────────────┐    │
│  │ [Embedded widget preview]                   │    │
│  └────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

---

### Phase 5: Testing & Optimization (2 weeks)

**Tasks:**
1. Load testing (1000 concurrent widget loads)
2. Cross-browser testing (Chrome, Firefox, Safari, Edge)
3. Mobile testing (iOS Safari, Android Chrome)
4. Accessibility audit (WCAG AA compliance)
5. Performance optimization (bundle size, lighthouse score)
6. Security audit (CSP, API key validation, postMessage origin checks)
7. Documentation (embed guide, API reference, troubleshooting)

**Success Metrics:**
- Widget load time: < 2 seconds (3G network)
- Lighthouse score: > 90
- Bundle size: < 150KB gzipped
- Zero CSP violations
- Zero accessibility errors (aXe)

---

### Phase 6: Production Rollout (1 week)

**Tasks:**
1. Deploy to production (`widget.elope.com`, `cdn.elope.com`)
2. Onboard 3 pilot tenants
3. Monitor error rates (Sentry)
4. Monitor performance (New Relic / Datadog)
5. Collect feedback
6. Iterate on UX issues

---

## 11. Code Examples (Conceptual)

### Loader SDK (widget-loader.js)

```javascript
/**
 * Elope Widget Loader SDK
 * Version: 2.0.0
 * Size: ~3KB gzipped
 */

(function() {
  'use strict';

  // Configuration from parent page
  const config = window.ElopeConfig || {};

  // Validate API key format
  if (!config.apiKey || !config.apiKey.match(/^pk_(test|live)_\w+$/)) {
    console.error('Elope: Invalid API key format');
    showFallbackLink();
    return;
  }

  // Ensure HTTPS in production
  if (window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost') {
    console.error('Elope: HTTPS required');
    return;
  }

  // Create iframe
  const iframe = document.createElement('iframe');

  // Build iframe URL with params
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    theme: config.theme || 'light',
    referrer: window.location.href
  });

  iframe.src = `https://widget.elope.com/embed?${params}`;
  iframe.style.cssText = `
    width: 100%;
    border: none;
    display: block;
    min-height: 400px;
  `;
  iframe.setAttribute('title', 'Elope Booking Widget');
  iframe.setAttribute('allow', 'payment');

  // Find container
  const containerSelector = config.container || '#elope-booking-widget';
  const container = document.querySelector(containerSelector);

  if (!container) {
    console.error(`Elope: Container not found: ${containerSelector}`);
    return;
  }

  // Show skeleton loader while iframe loads
  const skeleton = document.createElement('div');
  skeleton.className = 'elope-skeleton';
  skeleton.innerHTML = `
    <style>
      .elope-skeleton {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 2rem;
        min-height: 400px;
      }
      .elope-skeleton-header {
        height: 40px;
        background: #e5e7eb;
        border-radius: 4px;
        margin-bottom: 1rem;
        animation: elope-pulse 1.5s infinite;
      }
      .elope-skeleton-content {
        height: 200px;
        background: #e5e7eb;
        border-radius: 4px;
        margin-bottom: 1rem;
        animation: elope-pulse 1.5s infinite;
      }
      @keyframes elope-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
    <div class="elope-skeleton-header"></div>
    <div class="elope-skeleton-content"></div>
  `;

  container.appendChild(skeleton);

  // Listen for postMessage events from iframe
  window.addEventListener('message', function(event) {
    // Validate origin
    if (event.origin !== 'https://widget.elope.com') {
      return;
    }

    const data = event.data;

    switch (data.type) {
      case 'elope:loaded':
        // Hide skeleton, show iframe
        skeleton.style.display = 'none';
        iframe.style.display = 'block';
        break;

      case 'elope:resize':
        // Auto-resize iframe to content height
        iframe.style.height = data.height + 'px';
        break;

      case 'elope:booking:completed':
        // Fire callback
        if (typeof config.onBookingComplete === 'function') {
          config.onBookingComplete(data);
        }

        // Fire Google Analytics event
        if (window.gtag) {
          gtag('event', 'booking_completed', {
            event_category: 'Booking',
            event_label: data.packageId,
            value: data.totalPrice / 100
          });
        }
        break;

      case 'elope:error':
        console.error('Elope widget error:', data.error);
        if (typeof config.onError === 'function') {
          config.onError(data);
        }
        break;
    }
  });

  // Handle iframe load errors
  iframe.addEventListener('error', function() {
    console.error('Elope: Failed to load widget');
    skeleton.style.display = 'none';
    showFallbackLink();
  });

  // Append iframe to container
  container.appendChild(iframe);

  // Fallback link (if iframe fails)
  function showFallbackLink() {
    const fallback = document.createElement('div');
    fallback.className = 'elope-fallback';
    fallback.innerHTML = `
      <style>
        .elope-fallback {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
        }
        .elope-fallback a {
          color: #dc2626;
          font-weight: 600;
          text-decoration: underline;
        }
      </style>
      <p>Unable to load booking widget.</p>
      <a href="https://widget.elope.com/embed?apiKey=${config.apiKey}" target="_blank">
        Open booking page in new window
      </a>
    `;
    container.appendChild(fallback);
  }

})();
```

---

### Widget App Main Entry (iframe content)

```typescript
// widget/src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { WidgetApp } from './WidgetApp';
import './index.css';

// Parse URL params
const params = new URLSearchParams(window.location.search);
const apiKey = params.get('apiKey');
const theme = params.get('theme') || 'light';

if (!apiKey) {
  document.body.innerHTML = '<div>Error: API key required</div>';
  throw new Error('API key required');
}

// Fetch tenant config
async function loadTenantConfig(apiKey: string) {
  const res = await fetch(`/v1/tenants/config?apiKey=${apiKey}`);
  if (!res.ok) {
    throw new Error('Invalid API key');
  }
  return res.json();
}

// Initialize app
loadTenantConfig(apiKey)
  .then(tenantConfig => {
    // Apply theme CSS variables
    applyTheme(tenantConfig.branding);

    // Render app
    const root = createRoot(document.getElementById('root')!);
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <WidgetApp tenantConfig={tenantConfig} />
        </QueryClientProvider>
      </StrictMode>
    );

    // Send resize events to parent
    setupResizeObserver();

    // Send "loaded" event to parent
    sendToParent({ type: 'elope:loaded' });
  })
  .catch(error => {
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h2>Unable to load booking widget</h2>
        <p>${error.message}</p>
      </div>
    `;
  });

function applyTheme(branding: any) {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', branding.primaryColor || '#8B5CF6');
  root.style.setProperty('--font-family', branding.fontFamily || 'Inter, sans-serif');
  root.style.setProperty('--border-radius', branding.borderRadius || '8px');
}

function setupResizeObserver() {
  // Send resize messages when content height changes
  const sendResize = () => {
    const height = document.body.scrollHeight;
    sendToParent({
      type: 'elope:resize',
      height: height
    });
  };

  // Use ResizeObserver for efficient resize detection
  const resizeObserver = new ResizeObserver(sendResize);
  resizeObserver.observe(document.body);

  // Also send on initial load
  window.addEventListener('load', sendResize);
}

function sendToParent(message: any) {
  // Send to parent window (validates origin on parent side)
  window.parent.postMessage(message, '*');
}
```

---

### Widget App Component

```typescript
// widget/src/WidgetApp.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PackageSelector } from './pages/PackageSelector';
import { DatePicker } from './pages/DatePicker';
import { AddOnSelector } from './pages/AddOnSelector';
import { Checkout } from './pages/Checkout';
import { Success } from './pages/Success';
import { TenantProvider } from './contexts/TenantContext';

interface WidgetAppProps {
  tenantConfig: {
    tenantId: string;
    name: string;
    branding: any;
    settings: any;
  };
}

export function WidgetApp({ tenantConfig }: WidgetAppProps) {
  return (
    <TenantProvider config={tenantConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PackageSelector />} />
          <Route path="/date" element={<DatePicker />} />
          <Route path="/addons" element={<AddOnSelector />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </BrowserRouter>
    </TenantProvider>
  );
}
```

---

### Backend: Tenant Middleware

```typescript
// server/src/middleware/tenant.middleware.ts

import type { Request, Response, NextFunction } from 'express';
import type { TenantRepository } from '../lib/ports';

export function createTenantMiddleware(tenantRepo: TenantRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Extract API key from query or header
    const apiKey = req.query.apiKey as string || req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Lookup tenant by API key
    const tenant = await tenantRepo.findByApiKey(apiKey);

    if (!tenant || !tenant.active) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Validate referrer domain (if present)
    const referrer = req.headers.referer || req.headers.origin;
    if (referrer && tenant.allowedDomains.length > 0) {
      const referrerDomain = new URL(referrer).hostname;
      const isAllowed = tenant.allowedDomains.some(domain =>
        referrerDomain === domain || referrerDomain.endsWith('.' + domain)
      );

      if (!isAllowed) {
        return res.status(403).json({ error: 'Domain not allowed' });
      }
    }

    // Attach tenant to request
    req.tenant = tenant;

    next();
  };
}
```

---

### Backend: Tenant Config Endpoint

```typescript
// server/src/routes/tenants.routes.ts

import { Router } from 'express';
import type { TenantService } from '../services/tenant.service';
import { createTenantMiddleware } from '../middleware/tenant.middleware';

export function createTenantRouter(tenantService: TenantService) {
  const router = Router();

  // Get tenant config by API key
  router.get('/config',
    createTenantMiddleware(tenantService.tenantRepo),
    async (req, res) => {
      const tenant = req.tenant!;

      res.json({
        tenantId: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: tenant.branding,
        settings: tenant.settings
      });
    }
  );

  return router;
}
```

---

## 12. Summary & Recommendations

### Key Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| **Embedding Pattern** | Hybrid (SDK + iframe) | Best balance of security, flexibility, and ease of updates |
| **Tenant Identification** | API key (`pk_live_...`) | Industry standard, secure, revocable, simple |
| **Style Isolation** | iframe with Shadow DOM | Complete isolation, no CSS conflicts |
| **Communication** | postMessage API | Standard cross-origin communication, secure |
| **Data Model** | Row-level tenancy (shared DB) | Simple for MVP, cost-effective, easy to query |
| **Security** | CSP frame-ancestors + domain allowlist | Modern security headers, multi-domain support |
| **Performance** | CDN + lazy loading + code splitting | Fast load times, minimal parent page impact |

---

### Success Criteria

1. **Security**
   - Zero data leakage between tenants
   - API keys validated on every request
   - Domain allowlist enforced
   - CSP headers prevent clickjacking

2. **Performance**
   - Widget loads in < 2 seconds (3G network)
   - Total bundle size < 150KB gzipped
   - Lighthouse score > 90
   - Zero CSP violations

3. **UX**
   - Auto-resizing iframe (no nested scrollbars)
   - Mobile-friendly (320px width)
   - Accessible (WCAG AA)
   - Graceful error handling (fallback links)

4. **Developer Experience**
   - Simple embed code (< 10 lines)
   - Copy-paste installation
   - No build step required for tenants
   - Good documentation

---

### Next Steps

1. **Phase 1:** Implement multi-tenant data model (2 weeks)
2. **Phase 2:** Build iframe widget app (3 weeks)
3. **Phase 3:** Create loader SDK (1 week)
4. **Phase 4:** Build tenant dashboard (2 weeks)
5. **Phase 5:** Test and optimize (2 weeks)
6. **Phase 6:** Production rollout (1 week)

**Total Timeline:** 11 weeks (~3 months)

---

### Open Questions

1. **Billing Model:** How will tenants be charged? (Per booking? Monthly subscription?)
2. **Webhook Events:** What events should be sent to tenant webhooks? (booking.created, booking.completed, booking.cancelled?)
3. **Custom Domains:** Should tenants be able to host widget on their own subdomain? (e.g., book.acmeweddings.com)
4. **White-Label Admin:** Should each tenant have their own admin portal subdomain? (e.g., admin.acmeweddings.com)
5. **Multi-Language:** Should widget support i18n? (English, Spanish, etc.)

---

## References

### Industry Examples

- **Calendly:** https://help.calendly.com/hc/en-us/articles/31618265722775-Advanced-Calendly-embed-for-developers
- **Stripe Checkout:** https://docs.stripe.com/checkout/embedded/quickstart
- **Shopify Buy Button:** https://shopify.github.io/buy-button-js/
- **Intercom Messenger:** https://developers.intercom.com/installing-intercom/web/installation
- **Square Appointments:** https://squareup.com/appointments
- **Acuity Scheduling:** https://developers.acuityscheduling.com/docs/embedding

### Technical Standards

- **Web Components:** https://developer.mozilla.org/en-US/docs/Web/API/Web_components
- **Shadow DOM:** https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
- **postMessage API:** https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- **CSP:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **iframe Security:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#security_concerns

### Performance Resources

- **Code Splitting:** https://webpack.js.org/guides/code-splitting/
- **Lazy Loading:** https://web.dev/articles/lazy-loading
- **CDN Best Practices:** https://web.dev/articles/content-delivery-networks
- **Bundle Analysis:** https://github.com/webpack-contrib/webpack-bundle-analyzer

---

**End of Report**
