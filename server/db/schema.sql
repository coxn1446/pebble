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
  google_id VARCHAR(255),
  apple_id VARCHAR(255),
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
  blurb VARCHAR(500),
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
ALTER TABLE users ADD COLUMN IF NOT EXISTS blurb VARCHAR(500);
ALTER TABLE users DROP COLUMN IF EXISTS is_moderator;

-- Older shells stored a single auth_provider + provider_id. Move those subjects
-- onto google_id / apple_id so one account can keep a password and both providers.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'users'
      AND column_name = 'auth_provider'
  ) THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255);

    UPDATE users
    SET google_id = provider_id
    WHERE auth_provider = 'google'
      AND provider_id IS NOT NULL
      AND google_id IS NULL;

    UPDATE users
    SET apple_id = provider_id
    WHERE auth_provider = 'apple'
      AND provider_id IS NOT NULL
      AND apple_id IS NULL;

    DROP INDEX IF EXISTS users_provider_uidx;
    ALTER TABLE users DROP COLUMN provider_id;
    ALTER TABLE users DROP COLUMN auth_provider;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_uidx
  ON users (google_id)
  WHERE google_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_apple_id_uidx
  ON users (apple_id)
  WHERE apple_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS fields (
  field_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phenomena (
  phenomenon_id SERIAL PRIMARY KEY,
  field_id INTEGER NOT NULL REFERENCES fields (field_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  offered BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (field_id, name)
);

ALTER TABLE phenomena ADD COLUMN IF NOT EXISTS offered BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS phenomena_offered_field_idx
  ON phenomena (field_id)
  WHERE offered;

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
  status VARCHAR(20) NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
  observed_at TIMESTAMPTZ,
  observed_on DATE,
  observed_time TIME,
  weather VARCHAR(32),
  pin_name VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pebbles_author_idx ON pebbles (author_id);
CREATE INDEX IF NOT EXISTS pebbles_created_idx ON pebbles (created_at DESC);
CREATE INDEX IF NOT EXISTS pebbles_status_idx ON pebbles (status);

CREATE TABLE IF NOT EXISTS pebble_phenomena (
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  phenomenon_id INTEGER NOT NULL REFERENCES phenomena (phenomenon_id) ON DELETE CASCADE,
  PRIMARY KEY (pebble_id, phenomenon_id)
);

CREATE TABLE IF NOT EXISTS pebble_fields (
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES fields (field_id) ON DELETE CASCADE,
  PRIMARY KEY (pebble_id, field_id)
);

CREATE TABLE IF NOT EXISTS pebble_other_tags (
  other_tag_id SERIAL PRIMARY KEY,
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  UNIQUE (pebble_id, name)
);

CREATE TABLE IF NOT EXISTS pebble_resources (
  resource_id SERIAL PRIMARY KEY,
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pebble_questions (
  question_id SERIAL PRIMARY KEY,
  pebble_id INTEGER NOT NULL REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pebble_media (
  media_id SERIAL PRIMARY KEY,
  pebble_id INTEGER REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(50) NOT NULL
    CHECK (media_type IN ('image', 'video', 'audio', 'data', 'attachment', 'graph')),
  filename VARCHAR(512),
  title VARCHAR(160),
  caption TEXT,
  preview_x NUMERIC(5,2) NOT NULL DEFAULT 50,
  preview_y NUMERIC(5,2) NOT NULL DEFAULT 50,
  preview_scale NUMERIC(4,2) NOT NULL DEFAULT 1,
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
  cover_image_url TEXT,
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

-- Seed scientific fields and the offered phenomenon topics (idempotent).
INSERT INTO fields (name) VALUES
  ('Agricultural Science'),
  ('Astronomy'),
  ('Biology'),
  ('Chemistry'),
  ('Climate Science'),
  ('Computer Science'),
  ('Earth Science'),
  ('Engineering & Technology'),
  ('Environmental Science'),
  ('Health & Medicine'),
  ('Marine Science'),
  ('Materials Science'),
  ('Mathematics'),
  ('Microbiology'),
  ('Neuroscience'),
  ('Paleontology'),
  ('Physics'),
  ('Psychology')
ON CONFLICT (name) DO NOTHING;

INSERT INTO phenomena (field_id, name)
SELECT f.field_id, p.name
FROM fields f
JOIN (
  VALUES
    ('Agricultural Science', 'Crop Science & Plant Production'),
    ('Agricultural Science', 'Soil Science'),
    ('Agricultural Science', 'Animal Science & Livestock'),
    ('Agricultural Science', 'Food & Agriculture'),
    ('Agricultural Science', 'Sustainable Agriculture'),
    ('Agricultural Science', 'Agricultural Technology'),
    ('Agricultural Science', 'Genetics & Breeding'),
    ('Agricultural Science', 'Pests, Diseases & Crop Protection'),
    ('Agricultural Science', 'Water & Irrigation'),
    ('Agricultural Science', 'Agricultural Economics & Systems'),
    ('Astronomy', 'Solar System'),
    ('Astronomy', 'Stars'),
    ('Astronomy', 'Galaxies & the Universe'),
    ('Astronomy', 'Planets & Moons'),
    ('Astronomy', 'Space Exploration'),
    ('Astronomy', 'The Sun & Solar Activity'),
    ('Astronomy', 'Earth & Space'),
    ('Astronomy', 'Gravity & Orbits'),
    ('Astronomy', 'Cosmology'),
    ('Astronomy', 'Astrobiology & Life in the Universe'),
    ('Biology', 'Cell Biology'),
    ('Biology', 'Genetics & Heredity'),
    ('Biology', 'Evolution'),
    ('Biology', 'Ecology & Ecosystems'),
    ('Biology', 'Biodiversity & Classification'),
    ('Biology', 'Plants'),
    ('Biology', 'Animals'),
    ('Biology', 'Reproduction & Development'),
    ('Biology', 'Physiology & Body Systems'),
    ('Biology', 'Behavior'),
    ('Biology', 'Biotechnology'),
    ('Chemistry', 'Matter & Its Properties'),
    ('Chemistry', 'Atomic Structure'),
    ('Chemistry', 'The Periodic Table'),
    ('Chemistry', 'Chemical Reactions'),
    ('Chemistry', 'Chemical Bonds'),
    ('Chemistry', 'Solutions & Mixtures'),
    ('Chemistry', 'Acids & Bases'),
    ('Chemistry', 'Energy & Thermochemistry'),
    ('Chemistry', 'Rates & Equilibrium'),
    ('Chemistry', 'Organic Chemistry'),
    ('Chemistry', 'Biochemistry'),
    ('Climate Science', 'Climate Systems'),
    ('Climate Science', 'Weather & Atmospheric Processes'),
    ('Climate Science', 'Climate Change'),
    ('Climate Science', 'Greenhouse Effect'),
    ('Climate Science', 'Carbon Cycle'),
    ('Climate Science', 'Oceans & Climate'),
    ('Climate Science', 'Ice, Snow & Glaciers'),
    ('Climate Science', 'Climate Modeling & Data'),
    ('Climate Science', 'Climate Impacts'),
    ('Climate Science', 'Climate Solutions & Adaptation'),
    ('Computer Science', 'Computing & Algorithms'),
    ('Computer Science', 'Programming & Coding'),
    ('Computer Science', 'Data & Data Science'),
    ('Computer Science', 'Artificial Intelligence & Machine Learning'),
    ('Computer Science', 'Computer Systems & Hardware'),
    ('Computer Science', 'Networks & the Internet'),
    ('Computer Science', 'Cybersecurity'),
    ('Computer Science', 'Human-Computer Interaction'),
    ('Computer Science', 'Computational Modeling & Simulation'),
    ('Computer Science', 'Robotics & Automation'),
    ('Earth Science', 'Geology & Rocks'),
    ('Earth Science', 'Plate Tectonics'),
    ('Earth Science', 'Earthquakes & Volcanoes'),
    ('Earth Science', 'Earth''s Interior'),
    ('Earth Science', 'Minerals & Resources'),
    ('Earth Science', 'Weather & Atmosphere'),
    ('Earth Science', 'Water Cycle & Freshwater'),
    ('Earth Science', 'Oceans'),
    ('Earth Science', 'Landforms & Surface Processes'),
    ('Earth Science', 'Natural Hazards'),
    ('Earth Science', 'Earth''s History'),
    ('Engineering & Technology', 'Mechanical Engineering'),
    ('Engineering & Technology', 'Civil & Structural Engineering'),
    ('Engineering & Technology', 'Electrical Engineering'),
    ('Engineering & Technology', 'Chemical Engineering'),
    ('Engineering & Technology', 'Biomedical Engineering'),
    ('Engineering & Technology', 'Environmental Engineering'),
    ('Engineering & Technology', 'Aerospace Engineering'),
    ('Engineering & Technology', 'Robotics & Automation'),
    ('Engineering & Technology', 'Energy & Power Systems'),
    ('Engineering & Technology', 'Design & Prototyping'),
    ('Engineering & Technology', 'Technology & Society'),
    ('Environmental Science', 'Ecosystems & Biodiversity'),
    ('Environmental Science', 'Conservation'),
    ('Environmental Science', 'Pollution'),
    ('Environmental Science', 'Natural Resources'),
    ('Environmental Science', 'Water Resources'),
    ('Environmental Science', 'Waste & Recycling'),
    ('Environmental Science', 'Environmental Health'),
    ('Environmental Science', 'Human Impacts'),
    ('Environmental Science', 'Sustainability'),
    ('Environmental Science', 'Environmental Monitoring'),
    ('Environmental Science', 'Restoration & Management'),
    ('Health & Medicine', 'Human Anatomy'),
    ('Health & Medicine', 'Human Physiology'),
    ('Health & Medicine', 'Nutrition'),
    ('Health & Medicine', 'Disease & Infection'),
    ('Health & Medicine', 'Immunology'),
    ('Health & Medicine', 'Genetics & Genomics'),
    ('Health & Medicine', 'Public Health'),
    ('Health & Medicine', 'Epidemiology'),
    ('Health & Medicine', 'Medical Technology'),
    ('Health & Medicine', 'Pharmacology & Treatments'),
    ('Health & Medicine', 'Reproductive & Developmental Health'),
    ('Marine Science', 'Marine Ecosystems'),
    ('Marine Science', 'Oceanography'),
    ('Marine Science', 'Marine Biology'),
    ('Marine Science', 'Coral Reefs'),
    ('Marine Science', 'Marine Food Webs'),
    ('Marine Science', 'Ocean Circulation'),
    ('Marine Science', 'Waves, Tides & Currents'),
    ('Marine Science', 'Marine Geology'),
    ('Marine Science', 'Ocean Chemistry'),
    ('Marine Science', 'Marine Conservation'),
    ('Marine Science', 'Human Impacts on Oceans'),
    ('Materials Science', 'Metals'),
    ('Materials Science', 'Ceramics & Glass'),
    ('Materials Science', 'Polymers & Plastics'),
    ('Materials Science', 'Composites'),
    ('Materials Science', 'Biomaterials'),
    ('Materials Science', 'Nanomaterials'),
    ('Materials Science', 'Material Properties'),
    ('Materials Science', 'Material Structure'),
    ('Materials Science', 'Material Processing & Manufacturing'),
    ('Materials Science', 'Material Failure & Durability'),
    ('Materials Science', 'Sustainable Materials'),
    ('Mathematics', 'Number & Quantity'),
    ('Mathematics', 'Algebra'),
    ('Mathematics', 'Geometry'),
    ('Mathematics', 'Measurement'),
    ('Mathematics', 'Functions'),
    ('Mathematics', 'Statistics'),
    ('Mathematics', 'Probability'),
    ('Mathematics', 'Data Analysis & Visualization'),
    ('Mathematics', 'Calculus'),
    ('Mathematics', 'Mathematical Modeling'),
    ('Mathematics', 'Logic & Problem Solving'),
    ('Microbiology', 'Bacteria'),
    ('Microbiology', 'Viruses'),
    ('Microbiology', 'Fungi'),
    ('Microbiology', 'Protists & Microorganisms'),
    ('Microbiology', 'Microbial Genetics'),
    ('Microbiology', 'Microbial Evolution'),
    ('Microbiology', 'Microbial Ecology'),
    ('Microbiology', 'Microbiomes'),
    ('Microbiology', 'Infectious Disease'),
    ('Microbiology', 'Immunology'),
    ('Microbiology', 'Biotechnology & Fermentation'),
    ('Neuroscience', 'Brain Structure & Function'),
    ('Neuroscience', 'Neurons & Nervous Systems'),
    ('Neuroscience', 'Sensation & Perception'),
    ('Neuroscience', 'Learning & Memory'),
    ('Neuroscience', 'Emotions'),
    ('Neuroscience', 'Behavior'),
    ('Neuroscience', 'Sleep & Circadian Rhythms'),
    ('Neuroscience', 'Brain Development'),
    ('Neuroscience', 'Neuroplasticity'),
    ('Neuroscience', 'Neurological Disorders'),
    ('Neuroscience', 'Neurotechnology'),
    ('Paleontology', 'Fossils & Fossilization'),
    ('Paleontology', 'Dinosaurs'),
    ('Paleontology', 'Ancient Life'),
    ('Paleontology', 'Evolutionary History'),
    ('Paleontology', 'Extinction'),
    ('Paleontology', 'Human Evolution'),
    ('Paleontology', 'Paleoecology'),
    ('Paleontology', 'Ancient Environments & Climate'),
    ('Paleontology', 'Geologic Time'),
    ('Paleontology', 'Mass Extinctions'),
    ('Physics', 'Motion & Forces'),
    ('Physics', 'Energy'),
    ('Physics', 'Momentum'),
    ('Physics', 'Gravity'),
    ('Physics', 'Waves & Sound'),
    ('Physics', 'Light & Optics'),
    ('Physics', 'Electricity & Magnetism'),
    ('Physics', 'Heat & Thermodynamics'),
    ('Physics', 'Matter & Properties'),
    ('Physics', 'Nuclear & Particle Physics'),
    ('Physics', 'Relativity & Quantum Physics'),
    ('Psychology', 'Human Behavior'),
    ('Psychology', 'Cognition & Thinking'),
    ('Psychology', 'Learning'),
    ('Psychology', 'Memory'),
    ('Psychology', 'Emotion'),
    ('Psychology', 'Motivation'),
    ('Psychology', 'Development Across the Lifespan'),
    ('Psychology', 'Social Behavior'),
    ('Psychology', 'Personality'),
    ('Psychology', 'Mental Health'),
    ('Psychology', 'Perception & Sensation')
) AS p(field_name, name) ON p.field_name = f.name
ON CONFLICT (field_id, name) DO UPDATE SET offered = TRUE;

-- session table is created by connect-pg-simple when createTableIfMissing is true.
