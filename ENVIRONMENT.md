# Environment Variables

## API (server/)

Configure via `server/.env`:

```bash
ADAPTERS_PRESET=mock|real
API_PORT=3001
CORS_ORIGIN=http://localhost:5173  # Vite dev server
JWT_SECRET=change-me  # Generate with: openssl rand -hex 32

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
- Password special characters must be URL-encoded (e.g., @ = %40)
- Never commit `.env` files to git
- See `SUPABASE.md` for complete setup guide


## WEB (client/)

Configure via `client/.env` (if needed):

```bash
VITE_API_URL=http://localhost:3001
VITE_APP_MODE=mock|real
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```
