-- Feature requests submitted by allowed accounts, plus the release log.

CREATE TABLE IF NOT EXISTS feature_requests (
  feature_request_id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_request_files (
  feature_request_file_id SERIAL PRIMARY KEY,
  feature_request_id INTEGER NOT NULL REFERENCES feature_requests (feature_request_id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(512) NOT NULL,
  content_type VARCHAR(255),
  storage_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feature_request_files_request_idx
  ON feature_request_files (feature_request_id);

CREATE TABLE IF NOT EXISTS feature_request_log (
  feature_request_log_id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  release_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'wip', 'completed')),
  created_by INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
