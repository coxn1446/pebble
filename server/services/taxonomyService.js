const { isDbHealthy, query } = require('../db');
const { taxonomyQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const listFields = async () => {
  requireDb();
  const { rows } = await query(taxonomyQueries.listFields);
  return rows;
};

const listPhenomena = async (fieldId = null) => {
  requireDb();
  const { rows } = await query(taxonomyQueries.listPhenomena, [
    fieldId ? Number(fieldId) : null,
  ]);
  return rows;
};

module.exports = {
  listFields,
  listPhenomena,
};
