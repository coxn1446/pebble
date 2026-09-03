-- In-app notifications and per-user preference toggles.

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users (user_id) ON DELETE CASCADE,
  notify_on_follow BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_like BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('follow', 'like')),
  pebble_id INTEGER REFERENCES pebbles (pebble_id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON notifications (recipient_id, created_at DESC);
