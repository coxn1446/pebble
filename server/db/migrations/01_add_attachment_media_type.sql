-- Allow pebble_media.media_type = 'attachment' (keeps legacy 'graph').
-- Safe to run after schema.sql: drops and re-adds the check constraint.

ALTER TABLE pebble_media DROP CONSTRAINT IF EXISTS pebble_media_media_type_check;
ALTER TABLE pebble_media
  ADD CONSTRAINT pebble_media_media_type_check
  CHECK (media_type IN ('image', 'video', 'audio', 'data', 'attachment', 'graph'));
