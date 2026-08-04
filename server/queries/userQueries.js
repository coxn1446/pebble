const USER_FIELDS = `
  user_id,
  email,
  username,
  auth_provider,
  provider_id,
  display_name,
  created_at,
  updated_at
`;

const findById = `
  SELECT ${USER_FIELDS}
  FROM users
  WHERE user_id = $1
`;

const findByEmail = `
  SELECT ${USER_FIELDS}, password
  FROM users
  WHERE email = $1
`;

const findByProvider = `
  SELECT ${USER_FIELDS}
  FROM users
  WHERE auth_provider = $1 AND provider_id = $2
`;

const insertLocalUser = `
  INSERT INTO users (email, username, password, auth_provider, display_name)
  VALUES ($1, $2, $3, 'local', $4)
  RETURNING ${USER_FIELDS}
`;

const insertOAuthUser = `
  INSERT INTO users (email, auth_provider, provider_id, display_name)
  VALUES ($1, $2, $3, $4)
  RETURNING ${USER_FIELDS}
`;

module.exports = {
  USER_FIELDS,
  findById,
  findByEmail,
  findByProvider,
  insertLocalUser,
  insertOAuthUser,
};
