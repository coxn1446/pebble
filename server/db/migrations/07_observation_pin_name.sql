-- Date-only observations, optional clock time, and a researcher-typed pin name.
-- Existing observed_at values are left unchanged.
ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS observed_on DATE;
ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS observed_time TIME;
ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS pin_name VARCHAR(512);
