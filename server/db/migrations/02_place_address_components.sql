-- Denormalized Google Places address hierarchy for region filtering.

ALTER TABLE users ADD COLUMN IF NOT EXISTS place_locality VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_admin_area VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_country VARCHAR(255);

ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS place_locality VARCHAR(255);
ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS place_admin_area VARCHAR(255);
ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS place_country VARCHAR(255);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS place_locality VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS place_admin_area VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS place_country VARCHAR(255);
