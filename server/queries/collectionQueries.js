const COLLECTION_FIELDS = `
  c.collection_id,
  c.owner_id,
  c.name,
  c.is_private,
  c.is_collaborative,
  c.cover_image_url,
  c.created_at,
  c.updated_at
`;

const insert = `
  INSERT INTO collections (owner_id, name, is_private, is_collaborative, cover_image_url)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING collection_id, owner_id, name, is_private, is_collaborative, cover_image_url, created_at, updated_at
`;

const findById = `
  SELECT ${COLLECTION_FIELDS}
  FROM collections c
  WHERE c.collection_id = $1
`;

const listForUser = `
  SELECT ${COLLECTION_FIELDS},
    (
      SELECT COALESCE(json_agg(cp.pebble_id), '[]'::json)
      FROM collection_pebbles cp
      WHERE cp.collection_id = c.collection_id
    ) AS pebble_ids
  FROM collections c
  WHERE c.owner_id = $1
    OR EXISTS (
      SELECT 1
      FROM collection_members m
      WHERE m.collection_id = c.collection_id
        AND m.user_id = $1
        AND m.status = 'accepted'
    )
  ORDER BY c.updated_at DESC
`;

const update = `
  UPDATE collections
  SET
    name = COALESCE($2, name),
    is_private = COALESCE($3, is_private),
    is_collaborative = COALESCE($4, is_collaborative),
    cover_image_url = COALESCE($6, cover_image_url),
    updated_at = NOW()
  WHERE collection_id = $1 AND owner_id = $5
  RETURNING collection_id, owner_id, name, is_private, is_collaborative, cover_image_url, created_at, updated_at
`;

const remove = `
  DELETE FROM collections
  WHERE collection_id = $1 AND owner_id = $2
`;

const inviteMember = `
  INSERT INTO collection_members (collection_id, user_id, status)
  VALUES ($1, $2, 'invited')
  ON CONFLICT (collection_id, user_id) DO UPDATE SET status = 'invited'
  RETURNING collection_id, user_id, status, created_at
`;

const acceptInvite = `
  UPDATE collection_members
  SET status = 'accepted'
  WHERE collection_id = $1 AND user_id = $2 AND status = 'invited'
  RETURNING collection_id, user_id, status, created_at
`;

const getMember = `
  SELECT collection_id, user_id, status, created_at
  FROM collection_members
  WHERE collection_id = $1 AND user_id = $2
`;

const listMembers = `
  SELECT m.collection_id, m.user_id, m.status, m.created_at, u.username, u.display_name
  FROM collection_members m
  JOIN users u ON u.user_id = m.user_id
  WHERE m.collection_id = $1
  ORDER BY m.created_at ASC
`;

const addPebble = `
  INSERT INTO collection_pebbles (collection_id, pebble_id, added_by)
  VALUES ($1, $2, $3)
  ON CONFLICT DO NOTHING
  RETURNING collection_id, pebble_id, added_by, created_at
`;

const removePebble = `
  DELETE FROM collection_pebbles
  WHERE collection_id = $1 AND pebble_id = $2
`;

const listPebbles = `
  SELECT p.pebble_id, p.author_id, p.title, p.description, p.place_name, p.is_private,
         p.created_at, p.updated_at, u.username AS author_username, u.display_name AS author_display_name,
         cp.added_by, cp.created_at AS added_at
  FROM collection_pebbles cp
  JOIN pebbles p ON p.pebble_id = cp.pebble_id
  JOIN users u ON u.user_id = p.author_id
  WHERE cp.collection_id = $1
  ORDER BY cp.created_at DESC
`;

module.exports = {
  insert,
  findById,
  listForUser,
  update,
  remove,
  inviteMember,
  acceptInvite,
  getMember,
  listMembers,
  addPebble,
  removePebble,
  listPebbles,
};
