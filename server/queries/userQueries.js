const USER_FIELDS = `
  user_id,
  email,
  username,
  auth_provider,
  provider_id,
  display_name,
  account_type,
  profession,
  field_of_study,
  employer_org_id,
  organization_id,
  place_id,
  place_name,
  place_lat,
  place_lng,
  place_locality,
  place_admin_area,
  place_country,
  profile_pic_url,
  blurb,
  content_searchable,
  created_at,
  updated_at
`;

const PUBLIC_USER_FIELDS = `
  user_id,
  username,
  display_name,
  account_type,
  profession,
  field_of_study,
  employer_org_id,
  organization_id,
  place_id,
  place_name,
  place_lat,
  place_lng,
  place_locality,
  place_admin_area,
  place_country,
  profile_pic_url,
  blurb,
  content_searchable,
  created_at
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

const findByUsername = `
  SELECT ${PUBLIC_USER_FIELDS}
  FROM users
  WHERE LOWER(username) = LOWER($1)
`;

const findByProvider = `
  SELECT ${USER_FIELDS}
  FROM users
  WHERE auth_provider = $1 AND provider_id = $2
`;

const insertLocalUser = `
  INSERT INTO users (email, username, password, auth_provider, display_name, account_type)
  VALUES ($1, $2, $3, 'local', $4, $5)
  RETURNING ${USER_FIELDS}
`;

const insertOAuthUser = `
  INSERT INTO users (email, auth_provider, provider_id, display_name, account_type)
  VALUES ($1, $2, $3, $4, 'personal')
  RETURNING ${USER_FIELDS}
`;

const linkOrganization = `
  UPDATE users
  SET organization_id = $2, updated_at = NOW()
  WHERE user_id = $1
  RETURNING ${USER_FIELDS}
`;

const updateProfile = `
  UPDATE users
  SET
    display_name = COALESCE($2, display_name),
    username = COALESCE($3, username),
    profession = COALESCE($4, profession),
    field_of_study = COALESCE($5, field_of_study),
    employer_org_id = COALESCE($6, employer_org_id),
    place_id = COALESCE($7, place_id),
    place_name = COALESCE($8, place_name),
    place_lat = COALESCE($9, place_lat),
    place_lng = COALESCE($10, place_lng),
    place_locality = COALESCE($11, place_locality),
    place_admin_area = COALESCE($12, place_admin_area),
    place_country = COALESCE($13, place_country),
    content_searchable = COALESCE($14, content_searchable),
    profile_pic_url = COALESCE($15, profile_pic_url),
    updated_at = NOW()
  WHERE user_id = $1
  RETURNING ${USER_FIELDS}
`;

const clearEmployer = `
  UPDATE users
  SET employer_org_id = NULL, updated_at = NOW()
  WHERE user_id = $1
  RETURNING ${USER_FIELDS}
`;

const clearProfilePic = `
  UPDATE users
  SET profile_pic_url = NULL, updated_at = NOW()
  WHERE user_id = $1
  RETURNING ${USER_FIELDS}
`;

const setBlurb = `
  UPDATE users
  SET blurb = $2, updated_at = NOW()
  WHERE user_id = $1
  RETURNING ${USER_FIELDS}
`;

const followerCount = `
  SELECT COUNT(*)::int AS count
  FROM follows
  WHERE followed_id = $1
`;

const followingCount = `
  SELECT COUNT(*)::int AS count
  FROM follows
  WHERE follower_id = $1
`;

const PUBLIC_USER_FIELDS_U = `
  u.user_id,
  u.username,
  u.display_name,
  u.account_type,
  u.profession,
  u.field_of_study,
  u.employer_org_id,
  u.organization_id,
  u.place_id,
  u.place_name,
  u.place_lat,
  u.place_lng,
  u.place_locality,
  u.place_admin_area,
  u.place_country,
  u.profile_pic_url,
  u.content_searchable,
  u.created_at
`;

const listFollowers = `
  SELECT ${PUBLIC_USER_FIELDS_U}
  FROM users u
  JOIN follows f ON f.follower_id = u.user_id
  WHERE f.followed_id = $1
    AND (
      $2::int IS NULL
      OR u.user_id <> ALL (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $2
      )
    )
  ORDER BY f.created_at DESC
  LIMIT 100
`;

const listFollowing = `
  SELECT ${PUBLIC_USER_FIELDS_U}
  FROM users u
  JOIN follows f ON f.followed_id = u.user_id
  WHERE f.follower_id = $1
    AND (
      $2::int IS NULL
      OR u.user_id <> ALL (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $2
      )
    )
  ORDER BY f.created_at DESC
  LIMIT 100
`;

/**
 * Map user pins: searchable users with coordinates, excluding blocks.
 */
const mapPins = `
  SELECT
    user_id,
    username,
    display_name,
    profile_pic_url,
    field_of_study,
    place_id,
    place_name,
    place_lat,
    place_lng,
    place_locality,
    place_admin_area,
    place_country
  FROM users
  WHERE content_searchable = TRUE
    AND place_lat IS NOT NULL
    AND place_lng IS NOT NULL
    AND (
      $1::int IS NULL
      OR user_id <> ALL (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
      )
    )
  ORDER BY username ASC
  LIMIT 500
`;

module.exports = {
  USER_FIELDS,
  PUBLIC_USER_FIELDS,
  findById,
  findByEmail,
  findByUsername,
  findByProvider,
  insertLocalUser,
  insertOAuthUser,
  linkOrganization,
  updateProfile,
  clearEmployer,
  clearProfilePic,
  setBlurb,
  followerCount,
  followingCount,
  listFollowers,
  listFollowing,
  mapPins,
};
