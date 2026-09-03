# Database migrations

Incremental SQL changes for existing databases live here.

## Convention

1. **Filename**: `NNN_short_description.sql` (zero-padded number, snake_case).
2. **Idempotent when practical**: prefer `IF EXISTS` / `IF NOT EXISTS` so re-runs are safe if a step is retried manually.
3. **One concern per file**: keep each migration focused.
4. **Always update**:
   - [`server/db/schema.sql`](../schema.sql) — full current schema for greenfield installs
   - [`documentation/DATABASE_SCHEMA.md`](../../../documentation/DATABASE_SCHEMA.md) — table docs + migration log

## Apply

```bash
# Local (public schema)
npm run db:migrate

# QA / prod schema on Cloud SQL
DB_SCHEMA=qa npm run db:migrate
DB_SCHEMA=prod npm run db:migrate
```

The runner records applied files in `schema_migrations` and only runs pending ones, in filename order.

## Fresh database

```bash
createdb pebble
psql -d pebble -f server/db/schema.sql
npm run db:migrate
```

`schema.sql` is the baseline. Migrations after that baseline keep existing environments in sync.

## Do not

- Edit a migration that has already been applied in shared environments — add a new numbered file instead.
- Put secrets or environment-specific data in migrations.
