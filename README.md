# Pebble

App shell: React + Vite, Express, PostgreSQL, Capacitor iOS.

Local email/password auth works out of the box once Postgres and `server/db/schema.sql` are set up. Google/Apple and other integrations are stubs.

## Quick start

```bash
# 1. Database
createdb pebble
psql -d pebble -f server/db/schema.sql

# 2. Env
cp .env.example .env

# 3. Install & run
npm install
npm run dev
```

- Client: http://localhost:3000  
- API: http://localhost:8080 (`/api` proxied from Vite)

Register at `/register`, then sign in at `/login`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Express + Vite concurrently |
| `npm run build` | Production client build → `build/` |
| `npm test` | Jest |
| `npm run s` / `s:dev` / `s:qa` / `s:prod` | Capacitor iOS sync + bundle id |
| `npm run deploy:qa` / `deploy:prod` | Cloud Build → Cloud Run |

## iOS

```bash
npm run build
npx cap add ios   # once
npm run s:dev
```

Open `ios/App` in Xcode. Bundle IDs: `io.pebble.app.dev`, `io.pebble.qa`, `io.pebble.app`.

## Docs

- `documentation/ARCHITECTURE.md`
- `documentation/DATABASE_SCHEMA.md`
- `documentation/DEPLOYMENT.md`
- `documentation/TESTING_GUIDELINES.md`
