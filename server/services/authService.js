const bcrypt = require('bcrypt');
const { isDbHealthy, query } = require('../db');
const { userQueries } = require('../queries');

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

const registerLocalUser = async ({ email, password, username, displayName }) => {
  requireDb();
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(userQueries.insertLocalUser, [
      email,
      username || null,
      hash,
      displayName || username || email,
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
