---
description: Database operations with Prisma
tags: [database, prisma, migrations]
---

# Database Operations

Manage your PostgreSQL database with Prisma commands.

## Common Operations:

### 1. Open Prisma Studio (Database GUI):

```bash
npx prisma studio --schema=server/prisma/schema.prisma
```

This opens a web interface at http://localhost:5555 to browse and edit database records.

### 2. Run Migrations:

```bash
# Apply pending migrations
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# Create a new migration
npx prisma migrate dev --name <migration-name> --schema=server/prisma/schema.prisma
```

### 3. Reset Database (DESTRUCTIVE):

```bash
# WARNING: This will delete all data!
npx prisma migrate reset --schema=server/prisma/schema.prisma
```

This will:

- Drop the database
- Create a new database
- Apply all migrations
- Run seed script (if configured)

### 4. Seed Database:

```bash
npx prisma db seed
```

Note: Seed script must be configured in `server/package.json` under `prisma.seed`.

### 5. Show Migration Status:

```bash
npx prisma migrate status --schema=server/prisma/schema.prisma
```

Shows which migrations have been applied and which are pending.

### 6. Generate Prisma Client:

```bash
npx prisma generate --schema=server/prisma/schema.prisma
```

Regenerates the Prisma Client after schema changes.

### 7. Format Schema File:

```bash
npx prisma format --schema=server/prisma/schema.prisma
```

## Advanced Operations:

### View Raw SQL for Migration:

```bash
npx prisma migrate diff \
  --from-schema-datamodel server/prisma/schema.prisma \
  --to-schema-datasource server/prisma/schema.prisma \
  --script
```

### Create Migration Without Applying:

```bash
npx prisma migrate dev --create-only --name <migration-name> --schema=server/prisma/schema.prisma
```

### Resolve Migration Conflicts:

```bash
# Mark a migration as applied without running it
npx prisma migrate resolve --applied <migration-name> --schema=server/prisma/schema.prisma

# Mark a migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name> --schema=server/prisma/schema.prisma
```

## Quick Reference:

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `studio`         | Open database GUI                        |
| `migrate deploy` | Apply migrations (production)            |
| `migrate dev`    | Create and apply migration (development) |
| `migrate reset`  | Reset database and apply all migrations  |
| `migrate status` | Show migration status                    |
| `db seed`        | Run seed script                          |
| `generate`       | Generate Prisma Client                   |

## Environment:

Make sure `DATABASE_URL` is set in `server/.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/elope_dev"
```

## Safety:

- Always backup production data before running migrations
- Use `migrate deploy` in production, not `migrate dev`
- Test migrations in development first
- Use `--create-only` flag to review SQL before applying
