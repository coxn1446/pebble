# Pebble

Field-note research posts (“pebbles”) on a map: tag phenomena, follow others, like and collect, with privacy, blocks, and reports.

## Stack

React 19 (Vite 6) + Redux Toolkit 2 + Tailwind CSS 4 + Ionic React 8 + Capacitor 7, Express 5 + PostgreSQL (`pg` 8) + Passport sessions. Field notes use Slate (`slate`, `slate-react`, `slate-history`). Versions live in `package.json`. Do not add dependencies unless `documentation/ARCHITECTURE.md` allows them.

## Docs (read when relevant — do not inline unless asked)

- `documentation/ARCHITECTURE.md` — current-state architecture, APIs, features
- `documentation/DATABASE_SCHEMA.md` — schema source of truth
- `documentation/TESTING_GUIDELINES.md` — test layout and mocks
- `tailwind.config.js` — design tokens (slate, ocean, pebble, moss, sandstone)
- `documentation/REQUEST_PROMPT.md` — short overlay and how to write a request

## Constraints

- No new patterns, dependencies, or abstractions unless architecture docs allow them.
- Layering: UI components → `src/helpers/` → `server/routes/` → `server/services/` → `server/queries/`.
- Persistence changes update `documentation/DATABASE_SCHEMA.md` in the same commit, plus `server/db/schema.sql` and `server/db/migrations/` (`npm run db:migrate`). On Cloud SQL, respect `DB_SCHEMA` (`qa` / `prod`).
- Every behavior change includes tests (happy path, failure/edge, authorization when relevant).
- UI uses existing Tailwind tokens only. Clone `PebbleCard`, `BrandMark`, `ContentArea`, `PebbleMap`, `FieldNotesEditor`, or `AuthPageLayout` rather than inventing chrome.
- Keep privacy rules: private pebbles, `content_searchable`, blocks, collection membership.
- Accounts use `password`, `google_id`, and `apple_id` on `users`. A password hash means local login. A provider id means that provider is linked. One account can have any combination. Do not add `auth_provider` / `provider_id`.

## Commands

- `npm test` — Jest
- `npm run dev` — Vite + Express
- `npm run db:migrate` — incremental SQL

## Library docs

For APIs of packages **already in `package.json`**, fetch current docs via Context7 (or official docs). Do not treat those docs as permission to change architecture or add libraries. Slate, Maps JavaScript API, and Capacitor are in-repo — query Context7 for those when implementing against them.
