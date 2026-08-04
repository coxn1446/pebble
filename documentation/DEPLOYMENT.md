# Pebble — Minimal GCP Deployment

Cheapest setup: **Cloud Run** (scale to zero) + **Cloud SQL** (`db-f1-micro`).

Placeholder service names: `pebble-qa`, `pebble-prod`. Update `cloudbuild-*.yaml` substitutions for your project.

## Cost estimate (monthly)

| Service | Config | Est. cost |
|---------|--------|-----------|
| Cloud Run | 256Mi, min 0 | ~$0 idle; low for light traffic |
| Cloud SQL | db-f1-micro | ~$7–10 |
| Secret Manager | few secrets | free tier |
| **Total** | | **~$8–12/month** |

## Quick start checklist

1. Create a GCP project and enable APIs: `run`, `sqladmin`, `secretmanager`, `cloudbuild`, `storage`
2. Create Cloud SQL Postgres 15 (`db-f1-micro`), database, and schemas `qa` / `prod`
3. Apply `server/db/schema.sql` to both schemas
4. Create GCS bucket (optional until uploads exist)
5. Create secrets in Secret Manager (and `QA_*` variants as needed) — see `server/config/secrets.js`
6. Grant Cloud Run / Cloud Build service accounts Secret Manager + Cloud SQL Client
7. Deploy:

```bash
npm run deploy:qa
npm run deploy:prod
```

8. Set `_DEFAULT_CLIENT_URL` in the Cloud Build files (or via `--substitutions`) to the Cloud Run HTTPS URLs
9. Point Capacitor `CAP_QA_URL` / `CAP_PROD_URL` at those same origins

## Local database

```bash
createdb pebble
psql -d pebble -f server/db/schema.sql
cp .env.example .env
# edit DB_* and SESSION_SECRET
npm run dev
```

## Health check

`GET /api/health` reports database connectivity and whether key secrets are present (boolean flags only).
