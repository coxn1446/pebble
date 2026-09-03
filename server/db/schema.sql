-- Pebble schema (run manually — no migration runner).
-- Local:
--   createdb pebble
--   psql -d pebble -f server/db/schema.sql
-- Cloud SQL (qa/prod schemas): set search_path first, then run this file.

CREATE TABLE IF NOT EXISTS organizations (
  organization_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  place_id VARCHAR(255),
  place_name VARCHAR(512),
  place_lat DOUBLE PRECISION,
  place_lng DOUBLE PRECISION,
  place_locality VARCHAR(255),
  place_admin_area VARCHAR(255),
  place_country VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  provider_id VARCHAR(255),
  display_name VARCHAR(255),
  account_type VARCHAR(20) NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'organization')),
  profession VARCHAR(255),
  field_of_study VARCHAR(255),
  employer_org_id INTEGER REFERENCES organizations (organization_id) ON DELETE SET NULL,
  organization_id INTEGER REFERENCES organizations (organization_id) ON DELETE SET NULL,
  place_id VARCHAR(255),
  place_name VARCHAR(512),
  place_lat DOUBLE PRECISION,
  place_lng DOUBLE PRECISION,
  place_locality VARCHAR(255),
  place_admin_area VARCHAR(255),
  place_country VARCHAR(255),
  profile_pic_url TEXT,
  content_searchable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade path for shells that already created the base users table.
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'personal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profession VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employer_org_id INTEGER REFERENCES organizations (organization_id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations (organization_id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_name VARCHAR(512);
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_lat DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_lng DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_locality VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_admin_area VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_country VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS content_searchable BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;
ALTER TABLE users DROP COLUMN IF EXISTS is_moderator;

CREATE UNIQUE INDEX IF NOT EXISTS users_provider_uidx
  ON users (auth_provider, provider_id)
  WHERE provider_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS fields (
  field_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phenomena (
  phenomenon_id SERIAL PRIMARY KEY,
  field_id INTEGER NOT NULL REFERENCES fields (field_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (field_id, name)
);

CREATE TABLE IF NOT EXISTS pebbles (
  pebble_id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  title VARCHAR(512) NOT NULL,
  description TEXT,
  place_id VARCHAR(255),
  place_name VARCHAR(512),
  place_lat DOUBLE PRECISION,
  place_lng DOUBLE PRECISION,
  place_locality VARCHAR(255),
  place_admin_area VARCHAR(255),
  place_country VARCHAR(255),
  hero_image_url TEXT,
  field_notes JSONB NOT NULL DEFAULT '[{"type":"paragraph","children":[{"text":""}]}]'::jsonb,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pebbles_author_idx ON pebbles (author_id);
CREATE INDEX IF NOT EXISTS pebbles_created_idx ON pebbles (created_at DESC);

CREATE TABLE IF NOT EXISTS pebble_phenomena (
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  phenomenon_id INTEGER NOT NULL REFERENCES phenomena (phenomenon_id) ON DELETE CASCADE,
  PRIMARY KEY (pebble_id, phenomenon_id)
);

CREATE TABLE IF NOT EXISTS pebble_media (
  media_id SERIAL PRIMARY KEY,
  pebble_id INTEGER REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(50) NOT NULL
    CHECK (media_type IN ('image', 'video', 'audio', 'data', 'attachment', 'graph')),
  filename VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pebble_likes (
  user_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, pebble_id)
);

CREATE TABLE IF NOT EXISTS collections (
  collection_id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_collaborative BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_members (
  collection_id INTEGER NOT NULL REFERENCES collections (collection_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, user_id)
);

CREATE TABLE IF NOT EXISTS collection_pebbles (
  collection_id INTEGER NOT NULL REFERENCES collections (collection_id) ON DELETE CASCADE,
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  added_by INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, pebble_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  followed_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> followed_id)
);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS content_flags (
  flag_id SERIAL PRIMARY KEY,
  flagger_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('pebble', 'user')),
  target_id INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  details VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_flags_status_idx ON content_flags (status);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users (user_id) ON DELETE CASCADE,
  notify_on_follow BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_like BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('follow', 'like')),
  pebble_id INTEGER REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON notifications (recipient_id, created_at DESC);

-- Seed scientific fields and sample phenomena (idempotent).
INSERT INTO fields (name) VALUES
  ('Biology'),
  ('Physics'),
  ('Chemistry'),
  ('Earth Science'),
  ('Astronomy'),
  ('Mathematics'),
  ('Computer Science'),
  ('Psychology')
ON CONFLICT (name) DO NOTHING;

INSERT INTO phenomena (field_id, name)
SELECT f.field_id, p.name
FROM fields f
JOIN (
  VALUES
    ('Biology', 'evolution'),
    ('Biology', 'photosynthesis'),
    ('Biology', 'natural selection'),
    ('Physics', 'gravity'),
    ('Physics', 'electromagnetism'),
    ('Physics', 'quantum entanglement'),
    ('Chemistry', 'catalysis'),
    ('Chemistry', 'oxidation'),
    ('Earth Science', 'plate tectonics'),
    ('Earth Science', 'erosion'),
    ('Astronomy', 'redshift'),
    ('Astronomy', 'black holes'),
    ('Mathematics', 'fractals'),
    ('Computer Science', 'machine learning'),
    ('Psychology', 'cognitive bias')
) AS p(field_name, name) ON p.field_name = f.name
ON CONFLICT (field_id, name) DO NOTHING;

-- session table is created by connect-pg-simple when createTableIfMissing is true.
