const PEBBLE_FIELDS = `
  p.pebble_id,
  p.author_id,
  p.title,
  p.description,
  p.place_id,
  p.place_name,
  p.place_lat,
  p.place_lng,
  p.place_locality,
  p.place_admin_area,
  p.place_country,
  p.hero_image_url,
  p.field_notes,
  p.is_private,
  p.created_at,
  p.updated_at
`;

const AUTHOR_FIELDS = `
  u.username AS author_username,
  u.display_name AS author_display_name,
  u.profile_pic_url AS author_profile_pic_url
`;

const insert = `
  INSERT INTO pebbles (
    author_id, title, description,
    place_id, place_name, place_lat, place_lng,
    place_locality, place_admin_area, place_country,
    hero_image_url, field_notes, is_private
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13)
  RETURNING pebble_id, author_id, title, description,
    place_id, place_name, place_lat, place_lng,
    place_locality, place_admin_area, place_country,
    hero_image_url, field_notes, is_private, created_at, updated_at
`;

const findById = `
  SELECT ${PEBBLE_FIELDS},
    ${AUTHOR_FIELDS},
    u.content_searchable AS author_content_searchable
  FROM pebbles p
  JOIN users u ON u.user_id = p.author_id
  WHERE p.pebble_id = $1
`;

const update = `
  UPDATE pebbles
  SET
    title = COALESCE($2, title),
    description = COALESCE($3, description),
    place_id = COALESCE($4, place_id),
    place_name = COALESCE($5, place_name),
    place_lat = COALESCE($6, place_lat),
    place_lng = COALESCE($7, place_lng),
    place_locality = COALESCE($8, place_locality),
    place_admin_area = COALESCE($9, place_admin_area),
    place_country = COALESCE($10, place_country),
    hero_image_url = COALESCE($11, hero_image_url),
    field_notes = COALESCE($12::jsonb, field_notes),
    is_private = COALESCE($13, is_private),
    updated_at = NOW()
  WHERE pebble_id = $1 AND author_id = $14
  RETURNING pebble_id, author_id, title, description,
    place_id, place_name, place_lat, place_lng,
    place_locality, place_admin_area, place_country,
    hero_image_url, field_notes, is_private, created_at, updated_at
`;

const remove = `
  DELETE FROM pebbles
  WHERE pebble_id = $1 AND author_id = $2
`;

const clearPhenomena = `
  DELETE FROM pebble_phenomena WHERE pebble_id = $1
`;

const addPhenomenon = `
  INSERT INTO pebble_phenomena (pebble_id, phenomenon_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

const listPhenomenaForPebble = `
  SELECT ph.phenomenon_id, ph.name, ph.field_id, f.name AS field_name
  FROM pebble_phenomena pp
  JOIN phenomena ph ON ph.phenomenon_id = pp.phenomenon_id
  JOIN fields f ON f.field_id = ph.field_id
  WHERE pp.pebble_id = $1
  ORDER BY f.name, ph.name
`;

const attachMedia = `
  UPDATE pebble_media
  SET pebble_id = $2
  WHERE media_id = $1 AND (pebble_id IS NULL OR pebble_id = $2)
  RETURNING media_id, pebble_id, media_url, media_type, filename, created_at
`;

const insertMedia = `
  INSERT INTO pebble_media (pebble_id, media_url, media_type, filename)
  VALUES ($1, $2, $3, $4)
  RETURNING media_id, pebble_id, media_url, media_type, filename, created_at
`;

const listMedia = `
  SELECT media_id, pebble_id, media_url, media_type, filename, created_at
  FROM pebble_media
  WHERE pebble_id = $1
  ORDER BY created_at ASC
`;

const like = `
  INSERT INTO pebble_likes (user_id, pebble_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

const unlike = `
  DELETE FROM pebble_likes
  WHERE user_id = $1 AND pebble_id = $2
`;

const likeCount = `
  SELECT COUNT(*)::int AS count FROM pebble_likes WHERE pebble_id = $1
`;

const userLiked = `
  SELECT 1 FROM pebble_likes WHERE user_id = $1 AND pebble_id = $2 LIMIT 1
`;

/**
 * Feed: followed users' non-private pebbles (even if author is not searchable),
 * plus discoverable public pebbles from searchable authors (not blocked).
 */
const feed = `
  SELECT DISTINCT ${PEBBLE_FIELDS},
    ${AUTHOR_FIELDS},
    (SELECT COUNT(*)::int FROM pebble_likes pl WHERE pl.pebble_id = p.pebble_id) AS like_count,
    EXISTS (
      SELECT 1 FROM pebble_likes pl WHERE pl.pebble_id = p.pebble_id AND pl.user_id = $1
    ) AS liked_by_me
  FROM pebbles p
  JOIN users u ON u.user_id = p.author_id
  WHERE p.is_private = FALSE
    AND p.author_id <> ALL (
      SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
      UNION
      SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
    )
    AND (
      EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = $1 AND f.followed_id = p.author_id
      )
      OR (
        u.content_searchable = TRUE
        AND p.author_id <> $1
      )
      OR p.author_id = $1
    )
  ORDER BY p.created_at DESC
  LIMIT 50
`;

/**
 * Advanced search: optional q, field_id, author, region.
 * Params: $1 q, $2 viewerId, $3 fieldId, $4 author, $5 region
 */
const search = `
  SELECT DISTINCT ${PEBBLE_FIELDS},
    ${AUTHOR_FIELDS},
    (SELECT COUNT(*)::int FROM pebble_likes pl WHERE pl.pebble_id = p.pebble_id) AS like_count
  FROM pebbles p
  JOIN users u ON u.user_id = p.author_id
  WHERE p.is_private = FALSE
    AND u.content_searchable = TRUE
    AND (
      $1::text IS NULL
      OR $1 = ''
      OR p.title ILIKE '%' || $1 || '%'
      OR p.description ILIKE '%' || $1 || '%'
      OR p.place_name ILIKE '%' || $1 || '%'
      OR p.place_locality ILIKE '%' || $1 || '%'
      OR p.place_admin_area ILIKE '%' || $1 || '%'
      OR p.place_country ILIKE '%' || $1 || '%'
    )
    AND (
      $3::int IS NULL
      OR EXISTS (
        SELECT 1 FROM pebble_phenomena pp
        JOIN phenomena ph ON ph.phenomenon_id = pp.phenomenon_id
        WHERE pp.pebble_id = p.pebble_id AND ph.field_id = $3
      )
    )
    AND (
      $4::text IS NULL
      OR $4 = ''
      OR u.username ILIKE '%' || $4 || '%'
      OR u.display_name ILIKE '%' || $4 || '%'
    )
    AND (
      $5::text IS NULL
      OR $5 = ''
      OR p.place_locality ILIKE '%' || $5 || '%'
      OR p.place_admin_area ILIKE '%' || $5 || '%'
      OR p.place_country ILIKE '%' || $5 || '%'
      OR p.place_name ILIKE '%' || $5 || '%'
    )
    AND (
      $2::int IS NULL
      OR p.author_id <> ALL (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $2
      )
    )
  ORDER BY p.created_at DESC
  LIMIT 40
`;

const listByAuthor = `
  SELECT ${PEBBLE_FIELDS},
    ${AUTHOR_FIELDS},
    (SELECT COUNT(*)::int FROM pebble_likes pl WHERE pl.pebble_id = p.pebble_id) AS like_count
  FROM pebbles p
  JOIN users u ON u.user_id = p.author_id
  WHERE p.author_id = $1
    AND (
      p.author_id = $2
      OR (p.is_private = FALSE AND u.content_searchable = TRUE)
      OR (
        p.is_private = FALSE
        AND EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_id = $2 AND f.followed_id = p.author_id
        )
      )
    )
  ORDER BY p.created_at DESC
`;

/**
 * Map pins: same visibility as feed, but only pebbles with coordinates.
 * Lean payload for client-side clustering (no media/phenomena enrichment).
 */
const mapPins = `
  SELECT DISTINCT
    p.pebble_id,
    p.title,
    p.place_id,
    p.place_name,
    p.place_lat,
    p.place_lng,
    p.place_locality,
    p.place_admin_area,
    p.place_country,
    p.created_at,
    u.username AS author_username,
    u.display_name AS author_display_name
  FROM pebbles p
  JOIN users u ON u.user_id = p.author_id
  WHERE p.is_private = FALSE
    AND p.place_lat IS NOT NULL
    AND p.place_lng IS NOT NULL
    AND p.author_id <> ALL (
      SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
      UNION
      SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
    )
    AND (
      EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = $1 AND f.followed_id = p.author_id
      )
      OR (
        u.content_searchable = TRUE
        AND p.author_id <> $1
      )
      OR p.author_id = $1
    )
    AND (
      $2::text IS NULL
      OR $2 = ''
      OR p.title ILIKE '%' || $2 || '%'
      OR p.description ILIKE '%' || $2 || '%'
      OR p.place_name ILIKE '%' || $2 || '%'
      OR p.place_locality ILIKE '%' || $2 || '%'
      OR p.place_admin_area ILIKE '%' || $2 || '%'
      OR p.place_country ILIKE '%' || $2 || '%'
      OR u.username ILIKE '%' || $2 || '%'
      OR u.display_name ILIKE '%' || $2 || '%'
    )
    AND (
      $3::int IS NULL
      OR EXISTS (
        SELECT 1 FROM pebble_phenomena pp
        JOIN phenomena ph ON ph.phenomenon_id = pp.phenomenon_id
        WHERE pp.pebble_id = p.pebble_id AND ph.field_id = $3
      )
    )
    AND (
      $4::text IS NULL
      OR $4 = ''
      OR u.username ILIKE '%' || $4 || '%'
      OR u.display_name ILIKE '%' || $4 || '%'
    )
    AND (
      $5::text IS NULL
      OR $5 = ''
      OR p.place_locality ILIKE '%' || $5 || '%'
      OR p.place_admin_area ILIKE '%' || $5 || '%'
      OR p.place_country ILIKE '%' || $5 || '%'
      OR p.place_name ILIKE '%' || $5 || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT 500
`;

module.exports = {
  insert,
  findById,
  update,
  remove,
  clearPhenomena,
  addPhenomenon,
  listPhenomenaForPebble,
  attachMedia,
  insertMedia,
  listMedia,
  like,
  unlike,
  likeCount,
  userLiked,
  feed,
  search,
  listByAuthor,
  mapPins,
};
