const { isDbHealthy, query } = require('../db');
const { organizationQueries, userQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const create = async (userId, data) => {
  requireDb();
  const userResult = await query(userQueries.findById, [userId]);
  const user = userResult.rows[0];
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (user.account_type === 'organization' && user.organization_id) {
    const err = new Error('Organization account already has an organization');
    err.status = 409;
    throw err;
  }
  if (!data?.name) {
    const err = new Error('Organization name is required');
    err.status = 400;
    throw err;
  }

  const { rows } = await query(organizationQueries.insert, [
    data.name,
    data.placeId || null,
    data.placeName || null,
    data.placeLat ?? null,
    data.placeLng ?? null,
  ]);
  const org = rows[0];

  if (user.account_type === 'organization') {
    await query(userQueries.linkOrganization, [userId, org.organization_id]);
  }

  return org;
};

const getById = async (organizationId) => {
  requireDb();
  const { rows } = await query(organizationQueries.findById, [organizationId]);
  if (!rows[0]) {
    const err = new Error('Organization not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const search = async (q) => {
  requireDb();
  if (!q || !String(q).trim()) return [];
  const { rows } = await query(organizationQueries.search, [String(q).trim()]);
  return rows;
};

module.exports = {
  create,
  getById,
  search,
};
