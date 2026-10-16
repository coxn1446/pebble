-- Optional header shown above a media item's caption.

ALTER TABLE pebble_media ADD COLUMN IF NOT EXISTS title VARCHAR(160);
