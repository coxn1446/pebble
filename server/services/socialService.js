const { isDbHealthy, query } = require('../db');
const { socialQueries, userQueries } = require('../queries');
const notificationService = require('./notificationService');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const follow = async (followerId, followedId) => {
  requireDb();
  const targetId = Number(followedId);
  if (followerId === targetId) {
    const err = new Error('Cannot follow yourself');
    err.status = 400;
    throw err;
  }
  const user = await query(userQueries.findById, [targetId]);
  if (!user.rows[0]) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const blocked = await query(socialQueries.isBlockedEitherWay, [followerId, targetId]);
  if (blocked.rows[0]) {
    const err = new Error('Cannot follow this user');
    err.status = 403;
    throw err;
  }
  const already = await query(socialQueries.isFollowing, [followerId, targetId]);
  await query(socialQueries.follow, [followerId, targetId]);
  if (!already.rows[0]) {
    await notificationService.createIfAllowed({
      recipientId: targetId,
      actorId: followerId,
      type: 'follow',
    });
  }
  return { success: true };
};

const unfollow = async (followerId, followedId) => {
  requireDb();
  await query(socialQueries.unfollow, [followerId, Number(followedId)]);
  return { success: true };
};

const block = async (blockerId, blockedId) => {
  requireDb();
  const targetId = Number(blockedId);
  if (blockerId === targetId) {
    const err = new Error('Cannot block yourself');
    err.status = 400;
    throw err;
  }
  const user = await query(userQueries.findById, [targetId]);
  if (!user.rows[0]) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  await query(socialQueries.block, [blockerId, targetId]);
  await query(socialQueries.removeFollowsBothWays, [blockerId, targetId]);
  return { success: true };
};

const unblock = async (blockerId, blockedId) => {
  requireDb();
  await query(socialQueries.unblock, [blockerId, Number(blockedId)]);
  return { success: true };
};

module.exports = {
  follow,
  unfollow,
  block,
  unblock,
};
