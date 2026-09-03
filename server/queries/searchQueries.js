const suggestUsers = `
  SELECT
    user_id,
    username,
    display_name,
    profile_pic_url,
    place_name
  FROM users
  WHERE content_searchable = TRUE
    AND (
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

module.exports = {
  suggestUsers,
  suggestPlaces,
};
