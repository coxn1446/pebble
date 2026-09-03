# Pebble Architecture

## Last Updated
2026-09-02 (unlisted register; QA/prod Cloud Run)

Keep this file as **current state**. Prefer a short dated note here, not a running changelog novel. Agent constitution: `AGENTS.md`. UI tokens: `tailwind.config.js`. Shared skills live in `.cursor/skills/` (synced from App Shell `cursor-templates`).

## Overview

Pebble is an AuraSphere-style app: React (Vite) + Express + PostgreSQL + Capacitor iOS.

Users create research posts (“pebbles”) with Slate field notes, tag scientific phenomena, follow others, like and collect pebbles, and report/block offensive content.

Local email/password auth is implemented. Google/Apple OAuth, Stripe, Firebase, and email remain stubbed. GCS uploads are wired with a local fallback. Google Places Autocomplete is live when `GOOGLE_PLACES_API_KEY` is set (manual text fallback otherwise).

## Tech Stack

- **Frontend**: React, React Router, Redux Toolkit, Tailwind CSS v4, Ionic React, React Hot Toast, Vite, Slate (`slate`, `slate-react`, `slate-history`) for field notes
- **Backend**: Node.js, Express, Passport (local + Google/Apple placeholders), express-session + connect-pg-simple, Multer
- **Database**: PostgreSQL (`pg`), raw SQL in `server/queries/`
- **Storage**: Google Cloud Storage when `GOOGLE_CLOUD_STORAGE_BUCKET` is set; otherwise local `uploads/`
- **Places / Maps**: `PlaceAutocomplete` uses Places API (New) `PlaceAutocompleteElement` (key from `GET /api/places/key`); used on Settings and pebble create/edit. Persists `addressComponents` as locality/admin/country for region filters. `/` (auth) loads the same Maps JavaScript API key for a 3D globe (`Map3DElement` + HTML `MarkerInteractiveElement` pins) of location pebbles and user profile pins with client-side overlap clustering by camera range. Desktop map route is always a split layout: left feed (viewport-filtered) + right globe. Search/author/region filters apply to both feed and map pins; active filters show dismissible chips (e.g. `@kbb ×`). Single pin clicks navigate to the pebble or profile; clusters only zoom — no “pebbles in this area” panel.
- **Native**: Capacitor iOS only (`io.pebble.app` / `.qa` / `.app.dev`)
- **Deploy**: Cloud Run (scale to zero) + Cloud SQL, Secret Manager

## Layering

Components → helpers → routes → services → queries

## App routes (SPA)

- `/` — marketing welcome for guests (continuous scroll: hero → audience → methodology → how it works → explore pebbles → about us); map + viewport feed for authenticated users (desktop always split)
- `/login` — guest-only sign-in (welcome and login have no public signup links)
- `/register` — guest-only account creation, kept unlisted so accounts can be created by hand
- `/map` — redirects to `/`
- `/notifications` — in-app notification inbox (auth)
- `/profile` — current user profile (settings + collections + new pebble entry points)
- `/u/:username` — public/other profiles
- `/settings` — edit profile + notification preferences (linked from profile, not sidebar)
- `/collections`, `/collections/:id` — linked from profile
- `/pebbles/new`, `/pebbles/:id`, `/pebbles/:id/edit` — new pebble linked from map/profile

Standalone `Feed` route component remains in the codebase for potential mobile reuse but is not mounted on desktop.

Layout: `ContentArea` — sticky left sidebar (authenticated only) + independently scrolling main content. Full-width pane for map, guest welcome, guest login/register, notifications, profile, settings, and pebble detail.

Sidebar nav (authenticated): Map, Notifications, Profile, Sign out. Icons in `src/components/Icons/Icons.jsx`.

## Auth

- `POST /api/auth/register` — create local user (bcrypt); optional `accountType: organization` creates linked org; start session
- `POST /api/auth/login` — Passport local
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/google` (+ callback) — placeholder until credentials set
- `GET /api/auth/apple` (+ POST callback) — placeholder until credentials set

## API (core product)

### Users & orgs
- `GET/PATCH /api/users/me`
- `GET /api/users/map` — lean profile location pins
- `GET /api/users/:username`
- `GET /api/users/:username/followers`
- `GET /api/users/:username/following`
- `POST /api/organizations`
- `GET /api/organizations/:id`
- `GET /api/organizations/search?q=`

### Places & uploads
- `GET /api/places/key` — `{ key, mapId, configured }` (`mapId` from `GOOGLE_MAPS_MAP_ID` or `DEMO_MAP_ID`)
- `POST /api/uploads` — multipart file → GCS or local `uploads/`

### Search
- `GET /api/search/suggest?q=` — typeahead suggestions for users and places (map search)

### Taxonomy
- `GET /api/fields`
- `GET /api/phenomena?field_id=`

### Pebbles
- `GET /api/pebbles/feed`
- `GET /api/pebbles/search?q=&field_id=&author=&region=`
- `GET /api/pebbles/map` — lean location pins (same visibility as feed; requires lat/lng; supports search filters)
- `GET /api/pebbles/:id`
- `POST /api/pebbles`
- `PATCH /api/pebbles/:id`
- `DELETE /api/pebbles/:id`
- `POST /api/pebbles/:id/like`
- `DELETE /api/pebbles/:id/like`

### Collections
- `GET /api/collections`
- `POST /api/collections`
- `GET /api/collections/:id`
- `PATCH /api/collections/:id`
- `DELETE /api/collections/:id`
- `POST /api/collections/:id/invite`
- `POST /api/collections/:id/accept`
- `POST /api/collections/:id/pebbles`
- `DELETE /api/collections/:id/pebbles/:pebbleId`

### Social & moderation
- `POST /api/social/follow/:userId`
- `DELETE /api/social/follow/:userId`
- `POST /api/social/block/:userId`
- `DELETE /api/social/block/:userId`
- `POST /api/flags` — report offensive content/users (review UI will live on a separate password-gated subdomain later)

### Notifications
- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `POST /api/notifications/:id/read`
- `GET/PATCH /api/notifications/preferences`

## Privacy rules

- Private pebbles: author only in feed/search/detail for others
- `content_searchable = false`: excluded from search/discover; followers still see non-private pebbles
- Blocks hide mutual content; blocking removes follows both ways
- Private collections: owner + accepted members
- Collaborative collections: accepted members may add pebbles; only owner renames/deletes/invites

## Environments

| Env | Cloud Run service | `DB_SCHEMA` | Notes |
|-----|-------------------|-------------|-------|
| local | — | public / omit | `.env` + local Postgres |
| QA | `pebble-qa` | `qa` | App project `pebble-504520`; `npm run deploy:qa` |
| prod | `pebble-prod` | `prod` | Same project; Postgres on `nash-data` / `shared-pg` |

## Capacitor

Hosted WebView model: `server.url` points at the deployed SPA origin for QA/prod.

```bash
npm run s:dev   # io.pebble.app.dev
npm run s:qa    # io.pebble.qa
npm run s:prod  # io.pebble.app
```

Requires `npx cap add ios` once (Xcode).

## Database changes

- Greenfield: `server/db/schema.sql`, then `npm run db:migrate`
- Incremental: add `server/db/migrations/NNN_description.sql`, update `schema.sql` + `DATABASE_SCHEMA.md`, run `npm run db:migrate`
- Details: `server/db/migrations/README.md`

## See also

- `documentation/DEPLOYMENT.md`
- `documentation/DATABASE_SCHEMA.md`
- `server/db/schema.sql`
- `server/db/migrations/`
