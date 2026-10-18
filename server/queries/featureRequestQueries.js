const insertRequest = `
  INSERT INTO feature_requests (author_id, body)
  VALUES ($1, $2::jsonb)
  RETURNING feature_request_id, author_id, created_at
`;

const insertFile = `
  INSERT INTO feature_request_files (
    feature_request_id,
    file_url,
    file_name,
    content_type,
    storage_key
  )
  VALUES ($1, $2, $3, $4, $5)
`;

const listLog = `
  SELECT
    feature_request_log_id,
    description,
    release_date,
    status,
    created_by,
    created_at
  FROM feature_request_log
  ORDER BY created_at DESC, feature_request_log_id DESC
`;

const insertLog = `
  INSERT INTO feature_request_log (description, release_date, status, created_by)
  VALUES ($1, $2, $3, $4)
  RETURNING
    feature_request_log_id,
    description,
    release_date,
    status,
    created_by,
    created_at
`;

module.exports = {
  insertRequest,
  insertFile,
  listLog,
  insertLog,
};
