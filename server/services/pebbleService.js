const { isDbHealthy, query } = require('../db');
const { pebbleQueries, socialQueries } = require('../queries');
const notificationService = require('./notificationService');

const EMPTY_NOTES = [{ type: 'paragraph', children: [{ text: '' }] }];

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const enrichPebble = async (row, viewerId = null) => {
  if (!row) return null;
  const [phenomena, media, likeCountResult, likedResult] = await Promise.all([
    query(pebbleQueries.listPhenomenaForPebble, [row.pebble_id]),
    query(pebbleQueries.listMedia, [row.pebble_id]),
    query(pebbleQueries.likeCount, [row.pebble_id]),
    viewerId
      ? query(pebbleQueries.userLiked, [viewerId, row.pebble_id])
      : Promise.resolve({ rows: [] }),
  ]);
  return {
    ...row,
    phenomena: phenomena.rows,
    media: media.rows,
    like_count: row.like_count ?? likeCountResult.rows[0]?.count ?? 0,
    liked_by_me: row.liked_by_me ?? Boolean(likedResult.rows[0]),
  };
};

const canViewPebble = async (row, viewerId) => {
  if (!row) return false;
  if (viewerId && row.author_id === viewerId) return true;
  if (row.is_private) return false;

  if (viewerId) {
    const blocked = await query(socialQueries.isBlockedEitherWay, [viewerId, row.author_id]);
    if (blocked.rows[0]) return false;

    const following = await query(socialQueries.isFollowing, [viewerId, row.author_id]);
    if (following.rows[0]) return true;
  }

  if (row.author_content_searchable === false) return false;
  return true;
};

const setPhenomena = async (pebbleId, phenomenonIds = []) => {
  await query(pebbleQueries.clearPhenomena, [pebbleId]);
  const ids = Array.isArray(phenomenonIds) ? phenomenonIds : [];
  for (const id of ids) {
    await query(pebbleQueries.addPhenomenon, [pebbleId, Number(id)]);
  }
};

const create = async (authorId, data) => {
  requireDb();
  if (!data?.title?.trim()) {
    const err = new Error('Title is required');
    err.status = 400;
    throw err;
  }
  const fieldNotes = data.fieldNotes || EMPTY_NOTES;
  const { rows } = await query(pebbleQueries.insert, [
    authorId,
    data.title.trim(),
    data.description || null,
    data.placeId || null,
    data.placeName || null,
    data.placeLat ?? null,
    data.placeLng ?? null,
    data.placeLocality || null,
    data.placeAdminArea || null,
    data.placeCountry || null,
    data.heroImageUrl || null,
    JSON.stringify(fieldNotes),
    Boolean(data.isPrivate),
  ]);
  const pebble = rows[0];
  await setPhenomena(pebble.pebble_id, data.phenomenonIds);

  if (Array.isArray(data.mediaIds)) {
    for (const mediaId of data.mediaIds) {
      await query(pebbleQueries.attachMedia, [Number(mediaId), pebble.pebble_id]);
    }
  }

  return enrichPebble(await getRaw(pebble.pebble_id), authorId);
};

const getRaw = async (pebbleId) => {
  const { rows } = await query(pebbleQueries.findById, [pebbleId]);
  return rows[0] || null;
};

const getById = async (pebbleId, viewerId = null) => {
  requireDb();
  const row = await getRaw(pebbleId);
  if (!row) {
    const err = new Error('Pebble not found');
    err.status = 404;
    throw err;
  }
  const allowed = await canViewPebble(row, viewerId);
  if (!allowed) {
    const err = new Error('Pebble not found');
    err.status = 404;
    throw err;
  }
  return enrichPebble(row, viewerId);
};

const update = async (pebbleId, authorId, data) => {
  requireDb();
  const existing = await getRaw(pebbleId);
  if (!existing || existing.author_id !== authorId) {
    const err = new Error('Pebble not found');
    err.status = 404;
    throw err;
  }

  const { rows } = await query(pebbleQueries.update, [
    pebbleId,
    data.title?.trim() ?? null,
    data.description !== undefined ? data.description : null,
    data.placeId !== undefined ? data.placeId : null,
    data.placeName !== undefined ? data.placeName : null,
    data.placeLat !== undefined ? data.placeLat : null,
    data.placeLng !== undefined ? data.placeLng : null,
    data.placeLocality !== undefined ? data.placeLocality : null,
    data.placeAdminArea !== undefined ? data.placeAdminArea : null,
    data.placeCountry !== undefined ? data.placeCountry : null,
    data.heroImageUrl !== undefined ? data.heroImageUrl : null,
    data.fieldNotes !== undefined ? JSON.stringify(data.fieldNotes) : null,
    typeof data.isPrivate === 'boolean' ? data.isPrivate : null,
    authorId,
  ]);

  if (data.phenomenonIds !== undefined) {
    await setPhenomena(pebbleId, data.phenomenonIds);
  }

  return enrichPebble(await getRaw(rows[0].pebble_id), authorId);
};

const remove = async (pebbleId, authorId) => {
  requireDb();
  const result = await query(pebbleQueries.remove, [pebbleId, authorId]);
  if (result.rowCount === 0) {
    const err = new Error('Pebble not found');
    err.status = 404;
    throw err;
  }
  return { success: true };
};

const getFeed = async (viewerId) => {
  requireDb();
  const { rows } = await query(pebbleQueries.feed, [viewerId]);
  return Promise.all(rows.map((row) => enrichPebble(row, viewerId)));
};

const normalizeSearchFilters = (filters = {}) => {
  const q = filters.q != null ? String(filters.q).trim() : '';
  const author = filters.author != null ? String(filters.author).trim() : '';
  const region = filters.region != null ? String(filters.region).trim() : '';
  const fieldId =
    filters.fieldId != null && String(filters.fieldId).trim() !== ''
      ? Number(filters.fieldId)
      : null;
  return {
    q: q || null,
    author: author || null,
    region: region || null,
    fieldId: Number.isFinite(fieldId) ? fieldId : null,
  };
};

const listForMap = async (viewerId, filters = {}) => {
  requireDb();
  const { q, author, region, fieldId } = normalizeSearchFilters(filters);
  const { rows } = await query(pebbleQueries.mapPins, [
    viewerId,
    q,
    fieldId,
    author,
    region,
  ]);
  return rows;
};

const search = async (filters = {}, viewerId = null) => {
  requireDb();
  const normalized =
    typeof filters === 'string' ? normalizeSearchFilters({ q: filters }) : normalizeSearchFilters(filters);
  const { q, author, region, fieldId } = normalized;
  if (!q && !author && !region && !fieldId) return [];
  const { rows } = await query(pebbleQueries.search, [q || '', viewerId, fieldId, author, region]);
  return Promise.all(rows.map((row) => enrichPebble(row, viewerId)));
};

const listByAuthor = async (authorId, viewerId = null) => {
  requireDb();
  const { rows } = await query(pebbleQueries.listByAuthor, [authorId, viewerId]);
  return Promise.all(rows.map((row) => enrichPebble(row, viewerId)));
};

const like = async (pebbleId, userId) => {
  requireDb();
  const before = await getById(pebbleId, userId);
  const alreadyLiked = before.liked_by_me;
  await query(pebbleQueries.like, [userId, pebbleId]);
  if (!alreadyLiked && before.author_id !== userId) {
    await notificationService.createIfAllowed({
      recipientId: before.author_id,
      actorId: userId,
      type: 'like',
      pebbleId,
    });
  }
  return getById(pebbleId, userId);
};

const unlike = async (pebbleId, userId) => {
  requireDb();
  await query(pebbleQueries.unlike, [userId, pebbleId]);
  return getById(pebbleId, userId);
};

module.exports = {
  create,
  getById,
  update,
  remove,
  getFeed,
  listForMap,
  search,
  listByAuthor,
  like,
  unlike,
};
