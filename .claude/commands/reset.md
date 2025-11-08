Reset the Elope database to a fresh state.

⚠️  **WARNING**: This will DELETE all data and reset the database schema.

## When to Use This Command

- Starting fresh with development
- After major schema changes
- When database is in an inconsistent state
- Testing migration scripts

## Reset Process

### 1. Confirm Intent

Ask the user: "Are you sure you want to reset the database? This will delete all data. (yes/no)"

If the user confirms, proceed:

### 2. Reset Database

```bash
cd /Users/mikeyoung/CODING/Elope/server && npx prisma migrate reset --force
```

This will:
- Drop the database
- Create a new database
- Run all migrations
- Run the seed script (creates sample data)

### 3. Verify Reset

```bash
cd /Users/mikeyoung/CODING/Elope/server && npx prisma db pull
```

Check that the schema is in sync.

### 4. Display Results

```
✅ Database reset complete!

📋 Sample data created:
- Admin user: admin@example.com / admin
- Test tenant: bella-weddings
- 3 sample packages
- 2 sample add-ons
- 0 bookings

🔑 Tenant API Keys:
- Public: pk_live_bella-weddings_...
- Secret: sk_live_bella-weddings_...

💡 Next steps:
- Start dev environment: /d
- Run tests: /test
- Check multi-tenant patterns: /check
```

## Notes

- Only works with real mode (ADAPTERS_PRESET=real)
- Mock mode doesn't need database reset (in-memory)
- Requires valid DATABASE_URL in server/.env
- Seed script creates deterministic test data
