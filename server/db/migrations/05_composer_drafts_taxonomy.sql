-- Composer drafts, observation metadata, multi-field, other tags, resources, questions.

ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published';
ALTER TABLE pebbles DROP CONSTRAINT IF EXISTS pebbles_status_check;
ALTER TABLE pebbles ADD CONSTRAINT pebbles_status_check CHECK (status IN ('draft', 'published'));

ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ;
ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS weather VARCHAR(32);

CREATE INDEX IF NOT EXISTS pebbles_status_idx ON pebbles (status);

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

INSERT INTO fields (name) VALUES
  ('Agricultural Science'),
  ('Climate Science'),
  ('Engineering & Technology'),
  ('Environmental Science'),
  ('Health & Medicine'),
  ('Marine Science'),
  ('Materials Science'),
  ('Microbiology'),
  ('Neuroscience'),
  ('Paleontology')
ON CONFLICT (name) DO NOTHING;

INSERT INTO phenomena (field_id, name)
SELECT f.field_id, p.name
FROM fields f
JOIN (
  VALUES
    ('Agricultural Science', 'soil fertility'),
    ('Agricultural Science', 'crop rotation'),
    ('Climate Science', 'greenhouse effect'),
    ('Climate Science', 'sea level rise'),
    ('Engineering & Technology', 'robotics'),
    ('Engineering & Technology', 'sensors'),
    ('Environmental Science', 'pollution'),
    ('Environmental Science', 'biodiversity'),
    ('Health & Medicine', 'epidemiology'),
    ('Health & Medicine', 'vaccines'),
    ('Marine Science', 'coral bleaching'),
    ('Marine Science', 'tides'),
    ('Materials Science', 'polymers'),
    ('Materials Science', 'crystallography'),
    ('Microbiology', 'bacteria'),
    ('Microbiology', 'viruses'),
    ('Neuroscience', 'synapses'),
    ('Neuroscience', 'memory'),
    ('Paleontology', 'fossils'),
    ('Paleontology', 'extinction')
) AS p(field_name, name) ON p.field_name = f.name
ON CONFLICT (field_id, name) DO NOTHING;
