-- Cover/hero image URL for pebbles (same pattern as users.profile_pic_url).

ALTER TABLE pebbles ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
