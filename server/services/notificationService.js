const { isDbHealthy, query } = require('../db');
const { notificationQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const ensurePreferences = async (userId) => {
  await query(notificationQueries.ensurePreferences, [userId]);
};

const getPreferences = async (userId) => {
  requireDb();
  await ensurePreferences(userId);
  const { rows } = await query(notificationQueries.getPreferences, [userId]);
  return rows[0];
};

const updatePreferences = async (userId, data) => {
  requireDb();
  await ensurePreferences(userId);
  const { rows } = await query(notificationQueries.updatePreferences, [
    userId,
    typeof data.notifyOnFollow === 'boolean' ? data.notifyOnFollow : null,
    typeof data.notifyOnLike === 'boolean' ? data.notifyOnLike : null,
  ]);
  return rows[0];
};

const createIfAllowed = async ({ recipientId, actorId, type, pebbleId = null }) => {
  requireDb();
  if (!recipientId || !actorId || recipientId === actorId) return null;
  await ensurePreferences(recipientId);
  const prefs = await getPreferences(recipientId);
  if (type === 'follow' && !prefs.notify_on_follow) return null;
  if (type === 'like' && !prefs.notify_on_like) return null;
  const { rows } = await query(notificationQueries.insert, [
    recipientId,
    actorId,
    type,
    pebbleId,
  ]);
  return rows[0] || null;
};

const listForUser = async (userId) => {
  requireDb();
  const { rows } = await query(notificationQueries.listForUser, [userId]);
  return rows;
};

const markRead = async (notificationId, userId) => {
  requireDb();
  const { rows } = await query(notificationQueries.markRead, [notificationId, userId]);
  if (!rows[0]) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const markAllRead = async (userId) => {
  requireDb();
  await query(notificationQueries.markAllRead, [userId]);
  return { success: true };
};

const getUnreadCount = async (userId) => {
  requireDb();
  const { rows } = await query(notificationQueries.unreadCount, [userId]);
  return rows[0]?.count ?? 0;
};

module.exports = {
  getPreferences,
  updatePreferences,
  createIfAllowed,
  listForUser,
  markRead,
  markAllRead,
  getUnreadCount,
};
