const ORG_FIELDS = `
  organization_id,
  name,
  place_id,
  place_name,
  place_lat,
  place_lng,
  created_at,
  updated_at
`;

const insert = `
  INSERT INTO organizations (name, place_id, place_name, place_lat, place_lng)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING ${ORG_FIELDS}
`;

const findById = `
  SELECT ${ORG_FIELDS}
  FROM organizations
  WHERE organization_id = $1
`;

const search = `
  SELECT ${ORG_FIELDS}
  FROM organizations
  WHERE name ILIKE '%' || $1 || '%'
  ORDER BY name ASC
  LIMIT 20
`;

const update = `
  UPDATE organizations
  SET
    name = COALESCE($2, name),
    place_id = COALESCE($3, place_id),
    place_name = COALESCE($4, place_name),
    place_lat = COALESCE($5, place_lat),
    place_lng = COALESCE($6, place_lng),
    updated_at = NOW()
  WHERE organization_id = $1
  RETURNING ${ORG_FIELDS}
`;

module.exports = {
  ORG_FIELDS,
  insert,
  findById,
  search,
  update,
};
