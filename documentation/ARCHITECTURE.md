# Pebble Architecture

## Last Updated
2026-10-04 (guest marketing hamburger and one-viewport snap slides)

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
- **Places / Maps**: `PlaceAutocomplete` uses Places API (New) `PlaceAutocompleteElement` (key from `GET /api/places/key`); used on Settings and pebble create/edit. Persists `addressComponents` as locality/admin/country for region filters. `/` (auth) loads the same Maps JavaScript API key for a 3D globe (`Map3DElement` + HTML `MarkerInteractiveElement` pins) of location pebbles and user profile pins with client-side overlap clustering by camera range. A cluster of two or more is a sandstone circle with the count. A single pebble is a blue circle with the glyph of its first field, or a plain blue dot when it has no field. A person pin keeps that person’s avatar. Zooming into a pebble cluster shows those field glyphs. Desktop map route is a split layout (left feed, newest in the current globe view, + right globe) with a corner control that expands the globe and hides the feed, and a recenter control. An expanded pin opens a preview (title, description, featured photo, tags); clusters only zoom. Mine limits feed and pins to the signed-in author. With no keyword, field, author, region, community-favorites, or media filter, the feed stays in the current camera view. Those filters search every visible pebble, including pins outside the camera, list the matches, and fly the globe so the pins are in frame. No matches says nothing matched. Active filters show dismissible chips (e.g. `@kbb ×`). Publishing opens Mine with that pebble’s preview at a camera range where the surrounding terrain is recognizable. Single pin clicks navigate to the pebble or profile; clusters only zoom — no “pebbles in this area” panel.
- **Native**: Capacitor iOS only (`io.pebble.app` / `.qa` / `.app.dev`)
- **Deploy**: Cloud Run (scale to zero) + Cloud SQL, Secret Manager

## Layering

Components → helpers → routes → services → queries

## App routes (SPA)

- `/` — marketing home for guests (snap scroll: hero → audience → methodology); map + viewport feed for authenticated users (desktop always split)
- `/how-it-works` — How it Works + Explore Pebbles (marketing; no app sidebar)
- `/about-us` — About Us letter + first four field-journey photos, then How we're different + remaining four photos (snap scroll like home / how it works; no app sidebar)
- `/login` — guest-only sign-in (welcome and login have no public signup links); marketing footer
- `/register` — guest-only account creation, kept unlisted so accounts can be created by hand; marketing footer
- `/map` — redirects to `/`
- `/notifications` — in-app notification inbox (auth)
- `/profile` — current user profile (gallery or rows, collection tiles, new pebble, map on Mine)
- `/u/:username` — public/other profiles
- `/settings` — edit profile + notification preferences (linked from profile, not sidebar)
- `/collections`, `/collections/:id` — linked from profile
- `/pebbles/new`, `/pebbles/:id`, `/pebbles/:id/edit` — new pebble linked from map/profile

Standalone `Feed` route component remains in the codebase for potential mobile reuse but is not mounted on desktop.

Layout: `ContentArea` — sticky left sidebar (authenticated only, hidden on `/how-it-works` and `/about-us`) + independently scrolling main content. Full-width pane for map, guest home, how it works, about us, guest login/register, notifications, profile, settings, and pebble detail. Guest marketing header shows Pebble, About Us, and How it Works inline from `lg` up; below `lg` those links sit in a hamburger panel. Sign In stays in the bar. Each guest marketing section is one `h-dvh` snap slide; overflow scrolls inside the slide. Login and register scroll on short screens with safe-area padding. Unauthenticated marketing and auth screens include the shared Welcome footer.

Sidebar nav (authenticated): Map, Notifications, Profile. Tutorial (How it Works) sits above Sign out and is not a primary item. Icons in `src/components/Icons/Icons.jsx`.

## Auth

- `POST /api/auth/register` — create local user (bcrypt); optional `accountType: organization` creates linked org; start session
- `POST /api/auth/login` — Passport local
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/google` (+ callback) — placeholder until credentials set
- `GET /api/auth/apple` (+ POST callback) — placeholder until credentials set

## API (core product)

### Users & orgs
- `GET/PATCH /api/users/me` — patch may include `blurb` (trimmed, at most 500 characters; empty clears it). Shown under the follower counts on `/profile` and `/u/:username`. An empty blurb renders nothing.
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
- `GET /api/phenomena?field_id=` — offered topics only. A phenomenon already saved on a pebble still comes back on that pebble.

### Pebbles
- `GET /api/pebbles/feed?favorites=&mine=`
- `GET /api/pebbles/search?q=&field_id=&author=&region=&favorites=&mine=&has_photo=&has_video=&has_data=` — `favorites=1` keeps pebbles with likes, most likes first; `mine=1` keeps the viewer’s pebbles; media flags require a matching `pebble_media` type (`image`, `video`, `data`)
- `GET /api/pebbles/map` — lean location pins (same visibility as feed; requires lat/lng; supports search filters, `favorites`, and `mine`)
- `GET /api/pebbles/:id`
- `GET /api/weather?lat=&lng=&date=&time=` — authenticated. Open-Meteo weather code for that pin and date (the hour when `time` is set, otherwise the day’s code), mapped to a weather chip. Returns `{ weather: null }` when the lookup fails. No API key.
- `POST /api/pebbles` — body may include `status` (`draft` | `published`), `observedOn` (`YYYY-MM-DD`), `observedTime` (`HH:mm` or empty), `observedAt` (kept only when a legacy row’s clock time is unchanged), `weather`, `pinName`, `fieldIds`, `otherTags`, `resources`, `questions`, `mediaIds`. A date without a time stores `observed_on` and leaves `observed_at` null. Publish requires a title, stores `status: published`, and returns the author to the map on Mine with that pebble’s preview open. The pebble then leaves Drafts and appears in the profile gallery. If publish fails, the author stays on the form. Field notes are capped at 250 words. Drafts are excluded from feed, map, and search; only the author can open them. Profile pebbles sort by the observation, newest first. Keyword search matches `pin_name`, phenomenon names, and other-tag names. Other tags render as chips beside phenomena on the map feed, the pin preview, the pebble page, and profile rows. The published page shows media as five thumbnails; a photo or video opens larger and can be closed. A file that fails to load shows its name. Field notes, then further reading, then questions follow.
- `PATCH /api/pebbles/:id` — same fields; clears hero, coordinates, media, tags, links, and questions when the client sends empty values
- `DELETE /api/pebbles/:id` — author only. Drafts and published pebbles ask “Are you sure? Deletion is permanent.” before they are removed. A visitor does not see delete.
- `POST /api/pebbles/:id/like`
- `DELETE /api/pebbles/:id/like`

### Collections
- `GET /api/collections`
- `POST /api/collections` — body may include `coverImageUrl`. Profile shows collection tiles before unsorted pebbles.
- `GET /api/collections/:id`
- `PATCH /api/collections/:id`
- `DELETE /api/collections/:id` — owner only (403 for anyone else). Removes the collection and its membership rows. Pebbles stay. The owner confirms from the profile tile and from the collection page. Other people do not see delete.
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

- Private pebbles are omitted from feed, search, map, and detail unless the viewer is the author or follows the author
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
