# Pebble Architecture

## Last Updated
2026-08-04

## Overview

Pebble is an AuraSphere-style app shell: React (Vite) + Express + PostgreSQL + Capacitor iOS.

Local email/password auth is implemented. Google/Apple OAuth, Stripe, Firebase, GCS, Places, and email are stubbed.

## Tech Stack

- **Frontend**: React, React Router, Redux Toolkit, Tailwind CSS v4, Ionic React, React Hot Toast, Vite
- **Backend**: Node.js, Express, Passport (local + Google/Apple placeholders), express-session + connect-pg-simple
- **Database**: PostgreSQL (`pg`), raw SQL in `server/queries/`
- **Native**: Capacitor iOS only (`io.pebble.app` / `.qa` / `.app.dev`)
- **Deploy**: Cloud Run (scale to zero) + Cloud SQL, Secret Manager

## Layering

Components → helpers → routes → services → queries

## Auth

- `POST /api/auth/register` — create local user (bcrypt), start session
- `POST /api/auth/login` — Passport local
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/google` (+ callback) — placeholder until credentials set
- `GET /api/auth/apple` (+ POST callback) — placeholder until credentials set

## Environments

| Env | Cloud Run service | `DB_SCHEMA` | Notes |
|-----|-------------------|-------------|-------|
| local | — | public / omit | `.env` + local Postgres |
| QA | `pebble-qa` | `qa` | `npm run deploy:qa` |
| prod | `pebble-prod` | `prod` | `npm run deploy:prod` |

## Capacitor

Hosted WebView model: `server.url` points at the deployed SPA origin for QA/prod.

```bash
npm run s:dev   # io.pebble.app.dev
npm run s:qa    # io.pebble.qa
npm run s:prod  # io.pebble.app
```

Requires `npx cap add ios` once (Xcode).

## See also

- `documentation/DEPLOYMENT.md`
- `documentation/DATABASE_SCHEMA.md`
- `server/db/schema.sql`
