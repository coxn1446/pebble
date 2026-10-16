-- Replace auth_provider + provider_id with google_id and apple_id.
-- A password hash means local login. Either provider id can be set on the same row.

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
  ELSE
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_uidx
  ON users (google_id)
  WHERE google_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_apple_id_uidx
  ON users (apple_id)
  WHERE apple_id IS NOT NULL;
