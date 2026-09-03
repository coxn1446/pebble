const { isDbHealthy, query } = require('../db');
const { moderationQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

/**
 * Persist a content report. Review happens in a separate password-gated admin UI later.
 */
const createFlag = async (flaggerId, data) => {
  requireDb();
  const targetType = data.targetType;
  if (!['pebble', 'user'].includes(targetType)) {
    const err = new Error('Invalid target type');
    err.status = 400;
    throw err;
  }
  if (!data.reason?.trim()) {
    const err = new Error('Reason is required');
    err.status = 400;
    throw err;
  }
  if (!data.targetId) {
    const err = new Error('Target id is required');
    err.status = 400;
    throw err;
  }
  const { rows } = await query(moderationQueries.insertFlag, [
    flaggerId,
    targetType,
    Number(data.targetId),
    data.reason.trim(),
    data.details || null,
  ]);
  return rows[0];
};

module.exports = {
  createFlag,
};
