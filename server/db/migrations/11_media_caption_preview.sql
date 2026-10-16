-- Optional caption and Instagram-style preview crop for each media row.

ALTER TABLE pebble_media ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE pebble_media ADD COLUMN IF NOT EXISTS preview_x NUMERIC(5,2) NOT NULL DEFAULT 50;
ALTER TABLE pebble_media ADD COLUMN IF NOT EXISTS preview_y NUMERIC(5,2) NOT NULL DEFAULT 50;
ALTER TABLE pebble_media ADD COLUMN IF NOT EXISTS preview_scale NUMERIC(4,2) NOT NULL DEFAULT 1;
