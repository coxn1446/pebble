const listFields = `
  SELECT field_id, name, created_at
  FROM fields
  ORDER BY name ASC
`;

const listPhenomena = `
  SELECT phenomenon_id, field_id, name, created_at
  FROM phenomena
  WHERE offered = TRUE
    AND ($1::int IS NULL OR field_id = $1)
  ORDER BY name ASC
`;

module.exports = {
  listFields,
  listPhenomena,
};
