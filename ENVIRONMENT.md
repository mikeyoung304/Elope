# Environment Variables

## API (apps/api)

```bash
ADAPTERS_PRESET=mock|real
API_PORT=3001
CORS_ORIGIN=http://localhost:5173  # Vite dev server
JWT_SECRET=change-me  # Generate with: openssl rand -hex 32

# Real mode - Required
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Real mode - Optional (graceful fallbacks)
POSTMARK_SERVER_TOKEN=...  # Falls back to file-sink if not set
POSTMARK_FROM_EMAIL=bookings@yourdomain.com
GOOGLE_CALENDAR_ID=...  # Falls back to mock calendar if not set
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
```

## WEB (apps/web)

```bash
VITE_API_URL=http://localhost:3001
VITE_APP_MODE=mock|real
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```
