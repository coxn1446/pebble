const suggestUsers = `
  SELECT
    user_id,
    username,
    display_name,
    profile_pic_url,
    place_name
  FROM users
  WHERE (
      username ILIKE '%' || $1 || '%'
      OR display_name ILIKE '%' || $1 || '%'
    )
    AND (
      $2::int IS NULL
      OR user_id <> ALL (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $2
      )
    )
  ORDER BY username ASC
  LIMIT 8
`;

const suggestPlaces = `
  SELECT DISTINCT ON (label)
    label,
    place_lat,
    place_lng
  FROM (
    SELECT
      COALESCE(NULLIF(place_locality, ''), NULLIF(place_name, ''), place_admin_area) AS label,
      place_lat,
      place_lng
    FROM pebbles
    WHERE is_private = FALSE
      AND (
        place_name ILIKE '%' || $1 || '%'
        OR place_locality ILIKE '%' || $1 || '%'
        OR place_admin_area ILIKE '%' || $1 || '%'
        OR place_country ILIKE '%' || $1 || '%'
      )
    UNION ALL
    SELECT
      COALESCE(NULLIF(place_locality, ''), NULLIF(place_name, ''), place_admin_area) AS label,
      place_lat,
      place_lng
    FROM users
    WHERE content_searchable = TRUE
      AND (
        place_name ILIKE '%' || $1 || '%'
        OR place_locality ILIKE '%' || $1 || '%'
        OR place_admin_area ILIKE '%' || $1 || '%'
        OR place_country ILIKE '%' || $1 || '%'
      )
  ) places
  WHERE label IS NOT NULL AND label <> ''
  ORDER BY label ASC
  LIMIT 8
`;

const suggestFields = `
  SELECT field_id, name
  FROM fields
  WHERE name ILIKE '%' || $1 || '%'
  ORDER BY name ASC
  LIMIT 6
`;

const suggestPhenomena = `
  SELECT ph.phenomenon_id, ph.name, ph.field_id, f.name AS field_name
  FROM phenomena ph
  JOIN fields f ON f.field_id = ph.field_id
  WHERE ph.offered = TRUE
    AND ph.name ILIKE '%' || $1 || '%'
  ORDER BY ph.name ASC
  LIMIT 6
`;

const suggestNotes = `
  SELECT
    p.pebble_id,
    p.title,
    p.place_lat,
    p.place_lng
  FROM pebbles p
  JOIN users u ON u.user_id = p.author_id
  WHERE p.status = 'published'
    AND p.field_notes::text ILIKE '%' || $1 || '%'
    AND (
      (
        p.is_private = FALSE
        AND (
          u.content_searchable = TRUE
          OR ($2::int IS NOT NULL AND p.author_id = $2)
          OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = $2 AND f.followed_id = p.author_id
          )
        )
      )
      OR (
        p.is_private = TRUE
        AND $2::int IS NOT NULL
        AND (
          p.author_id = $2
          OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = $2 AND f.followed_id = p.author_id
          )
        )
      )
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
  LIMIT 5
`;

module.exports = {
  suggestUsers,
  suggestPlaces,
  suggestFields,
  suggestPhenomena,
  suggestNotes,
};
