# Database Schema Documentation

> **IMPORTANT**: Update this file whenever ANY database changes are made.

## Last Updated
2026-09-29 (migration 09)

## Overview

Pebble uses PostgreSQL for users, organizations, pebbles, social graph, collections, moderation, and in-app notifications.

- **Greenfield**: apply `server/db/schema.sql`, then run `npm run db:migrate`.
- **Existing DBs**: add a numbered file under `server/db/migrations/` and run `npm run db:migrate`. Also keep `schema.sql` and this doc in sync.
- **Tracking**: applied files are recorded in `schema_migrations`.

For Cloud Run QA/prod, app data lives in schemas `qa` and `prod` on one database (`DB_SCHEMA`). Run migrations with `DB_SCHEMA=qa` or `DB_SCHEMA=prod`.

## Tables

### organizations
- **Purpose**: Organizational profiles that personal users can link as employers; owned by organization accounts
- **Columns**:
  - `organization_id` (SERIAL PRIMARY KEY)
  - `name` (VARCHAR NOT NULL)
  - `place_id`, `place_name`, `place_lat`, `place_lng` — Google Places denormalized fields
  - `place_locality`, `place_admin_area`, `place_country` — Places address hierarchy for region filters
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-08-07

### users
- **Purpose**: User accounts for local and OAuth authentication (personal or organization)
- **Columns**:
  - `user_id` (SERIAL PRIMARY KEY)
  - `email` (VARCHAR UNIQUE) — primary login identifier
  - `username` (VARCHAR UNIQUE)
  - `password` (VARCHAR) — bcrypt hash; null for OAuth-only users
  - `auth_provider` (VARCHAR) — `local` | `google` | `apple`
  - `provider_id` (VARCHAR) — external subject id for OAuth
  - `display_name` (VARCHAR)
  - `account_type` (VARCHAR) — `personal` | `organization`
  - `profession` (VARCHAR)
  - `field_of_study` (VARCHAR)
  - `employer_org_id` (INTEGER FK → organizations) — personal users only
  - `organization_id` (INTEGER FK → organizations) — org account’s owned org
  - `place_id`, `place_name`, `place_lat`, `place_lng` — Google Places denormalized fields
  - `place_locality`, `place_admin_area`, `place_country` — Places address hierarchy for region filters
  - `profile_pic_url` (TEXT) — optional uploaded avatar; otherwise the client shows a penguin on a brand color chosen from the user id
  - `blurb` (VARCHAR(500)) — optional short profile text, about three sentences. Empty stores null and renders nothing
  - `content_searchable` (BOOLEAN DEFAULT TRUE) — when false, content excluded from search/discover
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Indexes**:
  - unique on `email`
  - unique on `username`
  - unique on `(auth_provider, provider_id)` where `provider_id` is not null
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-09-29

### fields
- **Purpose**: Overarching scientific field categories (Biology, Physics, etc.)
- **Columns**:
  - `field_id` (SERIAL PRIMARY KEY)
  - `name` (VARCHAR UNIQUE NOT NULL)
  - `created_at` (TIMESTAMPTZ)
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-08-04

### phenomena
- **Purpose**: Scientific phenomenon tags that ladder up to fields. The composer lists rows with `offered = true` (the discipline topic list). A row a pebble still references stays in the table even when it is no longer offered, so older tags such as photosynthesis keep displaying.
- **Columns**:
  - `phenomenon_id` (SERIAL PRIMARY KEY)
  - `field_id` (INTEGER FK → fields)
  - `name` (VARCHAR NOT NULL)
  - `offered` (BOOLEAN NOT NULL DEFAULT TRUE) — included in `GET /api/phenomena` when true
  - `created_at` (TIMESTAMPTZ)
  - UNIQUE `(field_id, name)`
- **Indexes**: `phenomena_offered_field_idx` on `field_id` WHERE `offered`
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-09-29

### pebbles
- **Purpose**: User research posts
- **Columns**:
  - `pebble_id` (SERIAL PRIMARY KEY)
  - `author_id` (INTEGER FK → users)
  - `title` (VARCHAR NOT NULL)
  - `description` (TEXT)
  - `place_id`, `place_name`, `place_lat`, `place_lng`
  - `place_locality`, `place_admin_area`, `place_country` — Places address hierarchy for region filters
  - `hero_image_url` (TEXT) — optional cover image for feed/detail
  - `field_notes` (JSONB) — Slate document
  - `is_private` (BOOLEAN DEFAULT FALSE) — not searchable / not in feeds for others
  - `status` (VARCHAR) — `draft` | `published` (default `published`). Drafts are author-only and excluded from feed, map, and search
  - `observed_on` (DATE) — calendar date the researcher entered. Null when no date was saved
  - `observed_time` (TIME) — optional clock time `HH:mm`. Null on a date-only observation so a save does not invent an hour
  - `observed_at` (TIMESTAMPTZ) — kept for rows that already have a clock time, and set when a new time is entered. Null when only a date is saved
  - `weather` (VARCHAR(32)) — `sunny` | `partly_cloudy` | `cloudy` | `rain` | `thunderstorm` | `snow` | `sleet` | `windy` | `foggy` | `icy` | `severe` | `clear_night`. Ids fit the existing width
  - `pin_name` (VARCHAR(512)) — name the researcher types for the map pin. Feed, preview, the pebble page, and keyword search use this, and fall back to `place_name` when it is empty. Coordinates stay on `place_lat` / `place_lng`
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Indexes**: `author_id`, `created_at DESC`, `status`
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-09-28

### pebble_phenomena
- **Purpose**: M2M pebble ↔ phenomenon tags
- **Columns**: `pebble_id`, `phenomenon_id` (composite PK)
- **Last Modified**: 2026-08-04

### pebble_fields
- **Purpose**: Scientific fields selected on a pebble (many per pebble)
- **Columns**: `pebble_id`, `field_id` (composite PK)
- **Last Modified**: 2026-09-25

### pebble_other_tags
- **Purpose**: Free-text phenomenon tags that are not in the seeded list
- **Columns**:
  - `other_tag_id` (SERIAL PRIMARY KEY)
  - `pebble_id` (INTEGER FK → pebbles)
  - `name` (VARCHAR(80) NOT NULL)
  - UNIQUE `(pebble_id, name)`
- **Last Modified**: 2026-09-25

### pebble_resources
- **Purpose**: Further-reading links on a pebble
- **Columns**:
  - `resource_id` (SERIAL PRIMARY KEY)
  - `pebble_id` (INTEGER FK → pebbles)
  - `url` (TEXT NOT NULL)
  - `sort_order` (INTEGER)
- **Last Modified**: 2026-09-25

### pebble_questions
- **Purpose**: Teacher prompts (“questions to consider”) on a pebble
- **Columns**:
  - `question_id` (SERIAL PRIMARY KEY)
  - `pebble_id` (INTEGER FK → pebbles)
  - `prompt` (TEXT NOT NULL)
  - `sort_order` (INTEGER)
- **Last Modified**: 2026-09-25

### pebble_media
- **Purpose**: Gallery media for a pebble (photo, video, audio, data, attachment). Older rows may still be referenced from field notes.
- **Columns**:
  - `media_id` (SERIAL PRIMARY KEY)
  - `pebble_id` (INTEGER FK → pebbles, nullable until attached)
  - `media_url` (TEXT NOT NULL)
  - `media_type` (VARCHAR) — `image` | `video` | `audio` | `data` | `attachment` | `graph` (`graph` legacy)
  - `filename` (VARCHAR)
  - `created_at` (TIMESTAMPTZ)
- **Last Modified**: 2026-08-04

### pebble_likes
- **Purpose**: User likes on pebbles
- **Columns**: `user_id`, `pebble_id` (composite PK), `created_at`
- **Last Modified**: 2026-08-04

### collections
- **Purpose**: Named pebble collections
- **Columns**:
  - `collection_id` (SERIAL PRIMARY KEY)
  - `owner_id` (INTEGER FK → users)
  - `name` (VARCHAR NOT NULL)
  - `is_private` (BOOLEAN DEFAULT FALSE)
  - `is_collaborative` (BOOLEAN DEFAULT FALSE)
  - `cover_image_url` (TEXT) — author-chosen tile photo
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Last Modified**: 2026-09-25

### collection_members
- **Purpose**: Invited collaborators on collections
- **Columns**:
  - `collection_id`, `user_id` (composite PK)
  - `status` — `invited` | `accepted`
  - `created_at`
- **Last Modified**: 2026-08-04

### collection_pebbles
- **Purpose**: Pebbles saved into a collection
- **Columns**: `collection_id`, `pebble_id` (composite PK), `added_by`, `created_at`
- **Last Modified**: 2026-08-04

### follows
- **Purpose**: User follow graph for the feed
- **Columns**: `follower_id`, `followed_id` (composite PK), `created_at`
- **Constraints**: no self-follow
- **Last Modified**: 2026-08-04

### user_blocks
- **Purpose**: Block offensive users
- **Columns**: `blocker_id`, `blocked_id` (composite PK), `created_at`
- **Constraints**: no self-block
- **Last Modified**: 2026-08-04

### content_flags
- **Purpose**: Flag offensive content/users for later review (Apple guideline reporting). Review happens outside the main app (separate password-gated admin UI).
- **Columns**:
  - `flag_id` (SERIAL PRIMARY KEY)
  - `flagger_id` (INTEGER FK → users)
  - `target_type` — `pebble` | `user`
  - `target_id` (INTEGER)
  - `reason` (VARCHAR NOT NULL)
  - `details` (VARCHAR)
  - `status` — `pending` | `reviewed` | `dismissed` | `actioned`
  - `created_at`, `updated_at`
- **Indexes**: `status`
- **Last Modified**: 2026-08-04

### notification_preferences
- **Purpose**: Per-user toggles for in-app notification types
- **Columns**:
  - `user_id` (INTEGER PK FK → users)
  - `notify_on_follow` (BOOLEAN DEFAULT TRUE)
  - `notify_on_like` (BOOLEAN DEFAULT TRUE)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-08-07

### notifications
- **Purpose**: In-app notifications (follow and like)
- **Columns**:
  - `notification_id` (SERIAL PRIMARY KEY)
  - `recipient_id` (INTEGER FK → users)
  - `actor_id` (INTEGER FK → users)
  - `type` (VARCHAR) — `follow` | `like`
  - `pebble_id` (INTEGER FK → pebbles, nullable; set for likes)
  - `read_at` (TIMESTAMPTZ, nullable)
  - `created_at` (TIMESTAMPTZ)
- **Indexes**: `(recipient_id, created_at DESC)`
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-08-07

### session
- **Purpose**: Express session store (`connect-pg-simple`)
- **Columns**: Managed by `connect-pg-simple` (`sid`, `sess`, `expire`)
- **Notes**: Auto-created when DB is healthy (`createTableIfMissing: true`)
- **Last Modified**: 2026-08-04

## Views

None yet.

## Functions

None yet.

## Migrations

SQL files live in `server/db/migrations/` (`NNN_description.sql`). Apply with `npm run db:migrate`. See that folder’s README for conventions.

### Baseline (pre-runner, in `schema.sql`)
- Shell init: `users` + provider index; session table via `connect-pg-simple`
- Core product: organizations, profiles, taxonomy, pebbles, collections, social, flags
- Dropped `users.is_moderator`; added `users.profile_pic_url`

### `01_add_attachment_media_type.sql`
- Added `attachment` to `pebble_media.media_type` (UI rename from graph; `graph` still accepted)

### `02_place_address_components.sql`
- Added `place_locality`, `place_admin_area`, `place_country` to `users`, `pebbles`, and `organizations`

### `03_notifications.sql`
- Added `notification_preferences` and `notifications` tables

### `04_pebble_hero_image.sql`
- Added `pebbles.hero_image_url`

### `05_composer_drafts_taxonomy.sql`
- Added `pebbles.status`, `observed_at`, `weather`
- Added `pebble_fields`, `pebble_other_tags`, `pebble_resources`, `pebble_questions`
- Seeded the remaining scientific fields and a short phenomenon list for each

### `07_observation_pin_name.sql`
- Added `pebbles.observed_on`, `pebbles.observed_time`, and `pebbles.pin_name`
- Left existing `observed_at` values in place

### `09_user_blurb.sql`
- Added `users.blurb` (VARCHAR(500))

### `08_phenomenon_topics.sql`
- Added `phenomena.offered` and an index for the composer list
- Seeded the discipline topic list and marked those rows offered
- Left any phenomenon a pebble still references; removed unreferenced topics that are not on that list
