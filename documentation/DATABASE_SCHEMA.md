# Database Schema Documentation

> **IMPORTANT**: Update this file whenever ANY database changes are made.

## Last Updated
2026-08-04 (pebble shell init)

## Overview

Pebble uses PostgreSQL for **users and sessions**. Apply `server/db/schema.sql` manually (no migration runner).

For Cloud Run QA/prod, app data lives in schemas `qa` and `prod` on one database (`DB_SCHEMA`). Apply schema SQL after `SET search_path TO qa, public;` (or `prod`).

## Tables

### users
- **Purpose**: User accounts for local and OAuth authentication
- **Columns**:
  - `user_id` (SERIAL PRIMARY KEY)
  - `email` (VARCHAR UNIQUE) — primary login identifier
  - `username` (VARCHAR UNIQUE) — optional
  - `password` (VARCHAR) — bcrypt hash; null for OAuth-only users
  - `auth_provider` (VARCHAR) — `local` | `google` | `apple`
  - `provider_id` (VARCHAR) — external subject id for OAuth
  - `display_name` (VARCHAR)
  - `created_at` (TIMESTAMPTZ DEFAULT NOW())
  - `updated_at` (TIMESTAMPTZ DEFAULT NOW())
- **Indexes**:
  - unique on `email`
  - unique on `username`
  - unique on `(auth_provider, provider_id)` where `provider_id` is not null
- **Source**: `server/db/schema.sql`
- **Last Modified**: 2026-08-04

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

### 2026-08-04_shell_init
- Created `users` table and unique provider index via `server/db/schema.sql`
- Session table created by `connect-pg-simple` at runtime
