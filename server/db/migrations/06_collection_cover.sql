-- Author-chosen cover photo for a collection tile.
ALTER TABLE collections ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
