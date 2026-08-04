-- Pebble initial schema (run manually — no migration runner).
-- Local:
--   createdb pebble
--   psql -d pebble -f server/db/schema.sql
-- Cloud SQL (qa/prod schemas): set search_path first, then run this file.

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  provider_id VARCHAR(255),
  display_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_provider_uidx
  ON users (auth_provider, provider_id)
  WHERE provider_id IS NOT NULL;

-- session table is created by connect-pg-simple when createTableIfMissing is true.
