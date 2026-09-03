const insertFlag = `
  INSERT INTO content_flags (flagger_id, target_type, target_id, reason, details)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING flag_id, flagger_id, target_type, target_id, reason, details, status, created_at, updated_at
`;

module.exports = {
  insertFlag,
};
