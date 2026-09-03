const bcrypt = require('bcrypt');
const { isDbHealthy, query, withTransaction } = require('../db');
const { userQueries, organizationQueries } = require('../queries');

const DB_REQUIRED = 'Database is unavailable. Start Postgres and apply server/db/schema.sql.';

const sanitizeUser = (row) => {
  if (!row) return null;
  const { password, ...user } = row;
  return user;
};

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error(DB_REQUIRED);
    err.status = 503;
    throw err;
  }
};

const getUserById = async (userId) => {
  if (!isDbHealthy()) return null;
  try {
    const { rows } = await query(userQueries.findById, [userId]);
    return sanitizeUser(rows[0] || null);
  } catch {
    return null;
  }
};

const validateLocalCredentials = async (email, password) => {
  requireDb();
  const { rows } = await query(userQueries.findByEmail, [email]);
  const row = rows[0];
  if (!row || !row.password) return null;
  const ok = await bcrypt.compare(password, row.password);
  return ok ? sanitizeUser(row) : null;
};

const registerLocalUser = async ({
  email,
  password,
  username,
  displayName,
  accountType = 'personal',
  organizationName,
}) => {
  requireDb();
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const type = accountType === 'organization' ? 'organization' : 'personal';
  if (type === 'organization' && !organizationName && !displayName && !username) {
    const err = new Error('Organization name is required for organization accounts');
    err.status = 400;
    throw err;
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const name = displayName || username || email;

    if (type === 'organization') {
      return await withTransaction(async (client) => {
        const orgResult = await client.query(organizationQueries.insert, [
          organizationName || name,
          null,
          null,
          null,
          null,
        ]);
        const org = orgResult.rows[0];
        const userResult = await client.query(userQueries.insertLocalUser, [
          email,
          username || null,
          hash,
          name,
          'organization',
        ]);
        const linked = await client.query(userQueries.linkOrganization, [
          userResult.rows[0].user_id,
          org.organization_id,
        ]);
        return sanitizeUser(linked.rows[0]);
      });
    }

    const { rows } = await query(userQueries.insertLocalUser, [
      email,
      username || null,
      hash,
      name,
      'personal',
    ]);
    return sanitizeUser(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const e = new Error('Email or username already in use');
      e.status = 409;
      throw e;
    }
    if (err.status) throw err;
    throw err;
  }
};

const findOrCreateOAuthUser = async (provider, profile) => {
  requireDb();
  const providerId = profile.id || profile.sub;
  const email = profile.emails?.[0]?.value || profile.email || null;
  const displayName = profile.displayName || profile.name?.givenName || email || provider;

  const existing = await query(userQueries.findByProvider, [provider, providerId]);
  if (existing.rows[0]) {
    return sanitizeUser(existing.rows[0]);
  }
  const { rows } = await query(userQueries.insertOAuthUser, [
    email,
    provider,
    providerId,
    displayName,
  ]);
  return sanitizeUser(rows[0]);
};

module.exports = {
  getUserById,
  validateLocalCredentials,
  registerLocalUser,
  findOrCreateOAuthUser,
};
