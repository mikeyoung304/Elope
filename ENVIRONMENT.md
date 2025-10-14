# Environment Variables

## API (apps/api)

```bash
ADAPTERS_PRESET=mock|real
API_PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-me

# real only
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
POSTMARK_SERVER_TOKEN=...
POSTMARK_FROM_EMAIL=bookings@yourdomain.com
GOOGLE_CALENDAR_ID=...
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
```

## WEB (apps/web)

```bash
VITE_API_URL=http://localhost:3001
VITE_APP_MODE=mock|real
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```
