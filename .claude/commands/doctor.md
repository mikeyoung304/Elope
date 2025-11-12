---
description: Check system health and dependencies
tags: [diagnostics, health-check, env]
---

# System Health Check

Run diagnostic checks to verify your development environment is properly configured.

## Quick Check:

```bash
npm run doctor
```

This will check:

- Node.js version (requires >= 20)
- npm version (requires >= 8)
- Environment variables (DATABASE_URL, Stripe keys, etc.)
- Adapter mode (mock vs real)
- Required configuration files

## Manual Checks:

### 1. Check Node.js and npm versions:

```bash
node --version  # Should be >= 20.0.0
npm --version   # Should be >= 8.0.0
```

### 2. Verify DATABASE_URL is set:

```bash
grep DATABASE_URL server/.env
```

### 3. Check if PostgreSQL is running:

```bash
pg_isready -h localhost -p 5432
```

Or check with psql:

```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 4. Test port availability:

```bash
# Check if ports 3001 (API) and 5173 (client) are available
lsof -ti:3001 || echo "Port 3001 is available"
lsof -ti:5173 || echo "Port 5173 is available"
```

### 5. Verify all required env variables:

```bash
cat server/.env
```

Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

Optional (with fallbacks):

- `POSTMARK_SERVER_TOKEN` - Email service
- `GOOGLE_CALENDAR_ID` - Calendar integration
- `ADAPTERS_PRESET` - Set to "real" for production adapters

## Common Issues:

### Database connection fails:

1. Ensure PostgreSQL is running
2. Check DATABASE_URL format: `postgresql://user:password@localhost:5432/dbname`
3. Test connection: `psql $DATABASE_URL`

### Port already in use:

1. Find process: `lsof -ti:3001`
2. Kill process: `kill -9 <PID>`
3. Or use different port in .env

### Missing environment variables:

1. Copy example: `cp server/.env.example server/.env`
2. Fill in required values
3. Run `npm run doctor` again
