const crypto = require('crypto');
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
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
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
          normalizedEmail,
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
      normalizedEmail,
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

const normalizeEmail = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
};

const oauthStateSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (typeof secret === 'string' && secret.trim()) return secret.trim();
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'qa') {
    const err = new Error('SESSION_SECRET is required');
    err.status = 500;
    throw err;
  }
  return 'dev-session-secret-change-me';
};

const signOAuthState = (payload) => {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 15 * 60 * 1000,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', oauthStateSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const readOAuthState = (state) => {
  if (typeof state !== 'string' || !state.includes('.')) return null;
  const [body, sig] = state.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', oauthStateSecret()).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

const clientOrigin = () =>
  (process.env.DEFAULT_CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

const oauthCallbackUrl = (provider) => `${clientOrigin()}/api/auth/${provider}/callback`;

const decodeJwtPayload = (token) => {
  if (typeof token !== 'string' || !token.includes('.')) return {};
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return {};
  }
};

const extractAppleIdToken = (idToken) => {
  if (typeof idToken === 'string' && idToken.includes('.')) return idToken;
  if (idToken && typeof idToken === 'object') {
    return idToken.id_token || idToken.idToken || null;
  }
  return null;
};

const parseAppleUser = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const profileFromAppleCallback = ({ idToken, profile, req } = {}) => {
  const token = extractAppleIdToken(idToken);
  const decoded = decodeJwtPayload(token);
  const appleUser = req?.appleProfile || parseAppleUser(req?.body?.user);
  const email = normalizeEmail(
    appleUser.email || decoded.email || profile?.emails?.[0]?.value || profile?.email
  );
  const named = [appleUser.name?.firstName, appleUser.name?.lastName].filter(Boolean).join(' ').trim();
  const providerId = decoded.sub || profile?.id || profile?.sub;
  return {
    id: providerId,
    emails: email ? [{ value: email }] : [],
    email,
    displayName: named || profile?.displayName || email || 'apple',
  };
};

const sanitizeHandle = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 24);

const oauthUsernameBase = (email, providerId) => {
  const local = email && email.includes('@') ? email.split('@')[0] : '';
  const fromEmail = sanitizeHandle(local);
  if (fromEmail.length >= 2) return fromEmail;
  const suffix = String(providerId || '').replace(/[^a-z0-9]/gi, '').slice(-8).toLowerCase();
  return sanitizeHandle(`user${suffix}`) || 'user';
};

const availableUsername = async (base) => {
  for (let n = 0; n < 20; n += 1) {
    const suffix = n === 0 ? '' : String(n + 1);
    const candidate = `${base.slice(0, 24 - suffix.length)}${suffix}`;
    const { rows } = await query(userQueries.findByUsername, [candidate]);
    if (!rows[0]) return candidate;
  }
  const err = new Error('Could not create a username');
  err.status = 409;
  throw err;
};

const providerQueries = (provider) => {
  if (provider === 'google') {
    return { findById: userQueries.findByGoogleId, link: userQueries.linkGoogleId, column: 'google_id' };
  }
  if (provider === 'apple') {
    return { findById: userQueries.findByAppleId, link: userQueries.linkAppleId, column: 'apple_id' };
  }
  const err = new Error('Unknown sign-in provider');
  err.status = 400;
  throw err;
};

const conflictError = () => {
  const err = new Error('This sign-in is already linked to a different account');
  err.status = 409;
  throw err;
};

const findOrCreateOAuthUser = async (provider, profile, { linkUserId } = {}) => {
  requireDb();
  const providerId = profile?.id || profile?.sub;
  if (!providerId) {
    const err = new Error('Sign in did not return a provider account id');
    err.status = 400;
    throw err;
  }
  const email = normalizeEmail(profile?.emails?.[0]?.value || profile?.email);
  const displayName = profile?.displayName || profile?.name?.givenName || email || provider;
  const subject = String(providerId);
  const { findById, link, column } = providerQueries(provider);

  const existing = await query(findById, [subject]);
  if (existing.rows[0]) {
    if (linkUserId && Number(existing.rows[0].user_id) !== Number(linkUserId)) {
      conflictError();
    }
    return sanitizeUser(existing.rows[0]);
  }

  if (linkUserId) {
    const current = await query(userQueries.findById, [linkUserId]);
    const row = current.rows[0];
    if (!row) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    const linkedId = row[column];
    if (linkedId && linkedId !== subject) conflictError();
    if (linkedId === subject) return sanitizeUser(row);
    const { rows } = await query(link, [row.user_id, subject]);
    return sanitizeUser(rows[0]);
  }

  if (email) {
    const byEmail = await query(userQueries.findByEmail, [email]);
    const row = byEmail.rows[0];
    if (row) {
      const linkedId = row[column];
      if (linkedId && linkedId !== subject) conflictError();
      if (linkedId === subject) return sanitizeUser(row);
      const { rows } = await query(link, [row.user_id, subject]);
      return sanitizeUser(rows[0]);
    }
  }

  if (!email) {
    const err = new Error('Email is required');
    err.status = 400;
    throw err;
  }

  const username = await availableUsername(oauthUsernameBase(email, subject));

  try {
    const { rows } = await query(userQueries.insertOAuthUser, [
      email,
      username,
      provider === 'google' ? subject : null,
      provider === 'apple' ? subject : null,
      displayName,
    ]);
    return sanitizeUser(rows[0]);
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'users_username_key') {
      const retryName = await availableUsername(`${username.slice(0, 20)}${Date.now().toString().slice(-4)}`);
      const { rows } = await query(userQueries.insertOAuthUser, [
        email,
        retryName,
        provider === 'google' ? subject : null,
        provider === 'apple' ? subject : null,
        displayName,
      ]);
      return sanitizeUser(rows[0]);
    }
    if (err.code === '23505') conflictError();
    throw err;
  }
};

module.exports = {
  getUserById,
  validateLocalCredentials,
  registerLocalUser,
  findOrCreateOAuthUser,
  profileFromAppleCallback,
  signOAuthState,
  readOAuthState,
  oauthCallbackUrl,
  clientOrigin,
};
