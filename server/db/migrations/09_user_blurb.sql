-- Short profile blurb, about three sentences.
ALTER TABLE users ADD COLUMN IF NOT EXISTS blurb VARCHAR(500);
