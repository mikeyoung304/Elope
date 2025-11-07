# Environment Variables

## API (server/)

Configure via `server/.env`:

```bash
ADAPTERS_PRESET=mock|real
API_PORT=3001
CORS_ORIGIN=http://localhost:5173  # Vite dev server
JWT_SECRET=change-me  # Generate with: openssl rand -hex 32

# Multi-Tenant Security (REQUIRED)
TENANT_SECRETS_ENCRYPTION_KEY=...  # Generate with: openssl rand -hex 32
# This key encrypts tenant secret API keys in the database
# CRITICAL: Back up this key securely - losing it makes tenant secrets unrecoverable

# Real mode - Required
# Supabase Database (see SUPABASE.md for setup)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=http://localhost:5173/success
STRIPE_CANCEL_URL=http://localhost:5173

# Real mode - Optional (graceful fallbacks)
POSTMARK_SERVER_TOKEN=...  # Falls back to file-sink if not set
POSTMARK_FROM_EMAIL=bookings@yourdomain.com
GOOGLE_CALENDAR_ID=...  # Falls back to mock calendar if not set
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...

# Supabase API (optional - for future Storage/Realtime features)
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep secret!
```

**Important Notes:**
- `DATABASE_URL` uses port 5432 (transaction mode pooler)
- `DIRECT_URL` required for Prisma migrations with Supabase
- `TENANT_SECRETS_ENCRYPTION_KEY` must be 32 bytes (64 hex characters)
- Password special characters must be URL-encoded (e.g., @ = %40)
- Never commit `.env` files to git
- See `SUPABASE.md` for complete setup guide

## Multi-Tenant Usage

### Creating Your First Tenant

After setting up the database, create a tenant to get API keys:

```bash
cd server
npm run create-tenant -- \
  --name "Bella Weddings" \
  --slug "bella-weddings" \
  --email "hello@bellaweddings.com" \
  --commission 12.5

# Output will display your API keys:
# ✓ Tenant created successfully!
#
# Tenant Details:
# - ID: 550e8400-e29b-41d4-a716-446655440000
# - Name: Bella Weddings
# - Slug: bella-weddings
# - Commission: 12.5%
#
# API Keys (save these securely):
# - Public Key:  pk_live_bella-weddings_7a9f3c2e1b4d8f6a
# - Secret Key:  sk_live_bella-weddings_9x2k4m8p3n7q1w5z
#
# IMPORTANT: The secret key is shown only once. Store it securely.
```

### Using API Keys in Requests

All public API endpoints require the `X-Tenant-Key` header with your public key:

```bash
# List packages for your tenant
curl -H "X-Tenant-Key: pk_live_bella-weddings_7a9f3c2e1b4d8f6a" \
  http://localhost:3001/v1/packages

# Check date availability
curl -H "X-Tenant-Key: pk_live_bella-weddings_7a9f3c2e1b4d8f6a" \
  http://localhost:3001/v1/availability?date=2024-06-15

# Create booking checkout
curl -X POST \
  -H "X-Tenant-Key: pk_live_bella-weddings_7a9f3c2e1b4d8f6a" \
  -H "Content-Type: application/json" \
  -d '{"packageId":"pkg_123","eventDate":"2024-06-15","coupleName":"John & Jane","email":"john@example.com"}' \
  http://localhost:3001/v1/bookings/checkout
```

### API Key Security

**Public Keys** (`pk_live_*`):
- Safe to use in client-side code (browser, mobile app)
- Can only access read operations and create bookings
- Required in `X-Tenant-Key` header for all public API calls

**Secret Keys** (`sk_live_*`):
- NEVER expose to clients (server-side only)
- Used for admin operations and Stripe Connect configuration
- Stored encrypted in database using `TENANT_SECRETS_ENCRYPTION_KEY`

### Endpoints Requiring X-Tenant-Key

All public endpoints require the header:
- `GET /v1/packages` - List packages
- `GET /v1/packages/:slug` - Get package details
- `GET /v1/availability` - Check date availability
- `POST /v1/bookings/checkout` - Create checkout session
- `GET /v1/bookings/:id` - Get booking details

**Admin endpoints** use JWT authentication (no X-Tenant-Key needed):
- `POST /v1/admin/login` - Admin login
- `GET /v1/admin/bookings` - List all bookings
- `POST /v1/admin/packages` - Create package
- `GET /v1/admin/tenants` - Manage tenants

**Webhook endpoints** use Stripe signature verification (no X-Tenant-Key needed):
- `POST /v1/webhooks/stripe` - Stripe payment webhooks


## WEB (client/)

Configure via `client/.env` (if needed):

```bash
VITE_API_URL=http://localhost:3001
VITE_APP_MODE=mock|real
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```
