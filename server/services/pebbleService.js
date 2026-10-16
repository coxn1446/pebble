const { isDbHealthy, query } = require('../db');
const { pebbleQueries, socialQueries } = require('../queries');
const notificationService = require('./notificationService');

const FIELD_NOTES_WORD_CAP = 250;
const WEATHER = new Set([
  'sunny',
  'partly_cloudy',
  'cloudy',
  'rain',
  'thunderstorm',
  'snow',
  'sleet',
  'windy',
  'foggy',
  'icy',
  'severe',
  'clear_night',
]);
const LEGACY_WEATHER = {
  sun: 'sunny',
  cloud: 'cloudy',
  wind: 'windy',
};

const collectNoteText = (nodes) => {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return '';
      if (typeof node.text === 'string') return node.text;
      return collectNoteText(node.children);
    })
    .join(' ');
};

const countFieldNoteWords = (value) => {
  const text = collectNoteText(value).trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

const EMPTY_NOTES = [{ type: 'paragraph', children: [{ text: '' }] }];

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const groupRows = (rows) => {
  const grouped = new Map();
  for (const row of rows || []) {
    if (row.pebble_id == null) continue;
    const { pebble_id: pebbleId, ...rest } = row;
    if (!grouped.has(pebbleId)) grouped.set(pebbleId, []);
    grouped.get(pebbleId).push(rest);
  }
  return grouped;
};

const shapePebble = (row, extras) => {
  const { favorite_rank: _favoriteRank, ...pebble } = row;
  return {
    ...pebble,
    phenomena: extras.phenomena,
    media: extras.media,
    fields: extras.fields,
    other_tags: extras.otherTags,
    resources: extras.resources,
    questions: extras.questions,
    like_count: row.like_count ?? extras.likeCount ?? 0,
    liked_by_me: row.liked_by_me ?? extras.liked,
  };
};

const enrichPebble = async (row, viewerId = null) => {
  if (!row) return null;
  const [phenomena, media, fields, otherTags, resources, questions, likeCountResult, likedResult] =
    await Promise.all([
    query(pebbleQueries.listPhenomenaForPebble, [row.pebble_id]),
    query(pebbleQueries.listMedia, [row.pebble_id]),
    query(pebbleQueries.listFieldsForPebble, [row.pebble_id]),
    query(pebbleQueries.listOtherTags, [row.pebble_id]),
    query(pebbleQueries.listResources, [row.pebble_id]),
    query(pebbleQueries.listQuestions, [row.pebble_id]),
    query(pebbleQueries.likeCount, [row.pebble_id]),
    viewerId
      ? query(pebbleQueries.userLiked, [viewerId, row.pebble_id])
      : Promise.resolve({ rows: [] }),
  ]);
  return shapePebble(row, {
    phenomena: phenomena.rows,
    media: media.rows,
    fields: fields.rows,
    otherTags: otherTags.rows,
    resources: resources.rows,
    questions: questions.rows,
    likeCount: likeCountResult.rows[0]?.count,
    liked: Boolean(likedResult.rows[0]),
  });
};

const enrichMany = async (rows, viewerId = null) => {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.pebble_id);
  const [phenomena, media, fields, otherTags, resources, questions, liked] = await Promise.all([
    query(pebbleQueries.listPhenomenaForPebbles, [ids]),
    query(pebbleQueries.listMediaForPebbles, [ids]),
    query(pebbleQueries.listFieldsForPebbles, [ids]),
    query(pebbleQueries.listOtherTagsForPebbles, [ids]),
    query(pebbleQueries.listResourcesForPebbles, [ids]),
    query(pebbleQueries.listQuestionsForPebbles, [ids]),
    viewerId
      ? query(pebbleQueries.likedAmong, [viewerId, ids])
      : Promise.resolve({ rows: [] }),
  ]);
  const phenomenaBy = groupRows(phenomena.rows);
  const mediaBy = groupRows(media.rows);
  const fieldsBy = groupRows(fields.rows);
  const tagsBy = groupRows(otherTags.rows);
  const resourcesBy = groupRows(resources.rows);
  const questionsBy = groupRows(questions.rows);
  const likedIds = new Set((liked.rows || []).map((row) => row.pebble_id));
  return rows.map((row) =>
    shapePebble(row, {
      phenomena: phenomenaBy.get(row.pebble_id) || [],
      media: mediaBy.get(row.pebble_id) || [],
      fields: fieldsBy.get(row.pebble_id) || [],
      otherTags: tagsBy.get(row.pebble_id) || [],
      resources: resourcesBy.get(row.pebble_id) || [],
      questions: questionsBy.get(row.pebble_id) || [],
      liked: likedIds.has(row.pebble_id),
    })
  );
};

const canViewPebble = async (row, viewerId) => {
  if (!row) return false;
  if (row.status === 'draft') return Boolean(viewerId && row.author_id === viewerId);
  if (viewerId && row.author_id === viewerId) return true;

  if (viewerId) {
    const blocked = await query(socialQueries.isBlockedEitherWay, [viewerId, row.author_id]);
    if (blocked.rows[0]) return false;

    const following = await query(socialQueries.isFollowing, [viewerId, row.author_id]);
    if (following.rows[0]) return true;
  }

  if (row.is_private) return false;
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

const setFields = async (pebbleId, fieldIds = []) => {
  await query(pebbleQueries.clearFields, [pebbleId]);
  const ids = Array.isArray(fieldIds) ? fieldIds : [];
  for (const id of ids) {
    const numeric = Number(id);
    if (Number.isFinite(numeric)) await query(pebbleQueries.addField, [pebbleId, numeric]);
  }
};

const setOtherTags = async (pebbleId, tags = []) => {
  await query(pebbleQueries.clearOtherTags, [pebbleId]);
  const names = Array.isArray(tags) ? tags : [];
  const seen = new Set();
  for (const raw of names) {
    const name = String(raw || '').trim().slice(0, 80);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    await query(pebbleQueries.addOtherTag, [pebbleId, name]);
  }
};

const setResources = async (pebbleId, resources = []) => {
  await query(pebbleQueries.clearResources, [pebbleId]);
  const list = Array.isArray(resources) ? resources : [];
  let order = 0;
  for (const raw of list) {
    const url = String(typeof raw === 'string' ? raw : raw?.url || '').trim();
    if (!url) continue;
    if (!/^https?:\/\//i.test(url)) {
      const err = new Error('Further reading links must start with http:// or https://');
      err.status = 400;
      throw err;
    }
    await query(pebbleQueries.addResource, [pebbleId, url, order]);
    order += 1;
  }
};

const setQuestions = async (pebbleId, questions = []) => {
  await query(pebbleQueries.clearQuestions, [pebbleId]);
  const list = Array.isArray(questions) ? questions : [];
  let order = 0;
  for (const raw of list) {
    const prompt = String(typeof raw === 'string' ? raw : raw?.prompt || '').trim();
    if (!prompt) continue;
    await query(pebbleQueries.addQuestion, [pebbleId, prompt, order]);
    order += 1;
  }
};

const clampNumber = (value, fallback, min, max) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

const setMedia = async (pebbleId, mediaIds, mediaDetails) => {
  const ids = (Array.isArray(mediaIds) ? mediaIds : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  if (ids.length === 0) {
    await query(pebbleQueries.clearMedia, [pebbleId]);
    return;
  }
  await query(pebbleQueries.deleteMediaExcept, [pebbleId, ids]);
  for (const id of ids) {
    await query(pebbleQueries.attachMedia, [id, pebbleId]);
  }
  const details = Array.isArray(mediaDetails) ? mediaDetails : [];
  for (const item of details) {
    const id = Number(item.mediaId ?? item.media_id);
    if (!Number.isFinite(id)) continue;
    const title = String(item.title || '').trim().slice(0, 160);
    const caption = String(item.caption || '').trim().slice(0, 280);
    await query(pebbleQueries.updateMediaDetails, [
      id,
      pebbleId,
      title || null,
      caption || null,
      clampNumber(item.previewX ?? item.preview_x, 50, 0, 100),
      clampNumber(item.previewY ?? item.preview_y, 50, 0, 100),
      clampNumber(item.previewScale ?? item.preview_scale, 1, 1, 3),
    ]);
  }
};

const phenomenonList = (phenomenonIds) =>
  (Array.isArray(phenomenonIds) ? phenomenonIds : [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

const assertPhenomenonList = (phenomenonIds) => {
  if (phenomenonList(phenomenonIds).length) return;
  const err = new Error('Choose a phenomenon topic');
  err.status = 400;
  throw err;
};

const hasCoordinate = (value) => value != null && value !== '' && Number.isFinite(Number(value));

const assertLocation = (status, data, existing) => {
  if (status !== 'published') return;
  const lat = data.placeLat !== undefined ? data.placeLat : existing?.place_lat;
  const lng = data.placeLng !== undefined ? data.placeLng : existing?.place_lng;
  if (hasCoordinate(lat) && hasCoordinate(lng)) return;
  const err = new Error('Add a location');
  err.status = 400;
  throw err;
};

const assertNamedPin = (status, data, existing) => {
  if (status !== 'published') return;
  const lat = data.placeLat !== undefined ? data.placeLat : existing?.place_lat;
  const lng = data.placeLng !== undefined ? data.placeLng : existing?.place_lng;
  if (!hasCoordinate(lat) || !hasCoordinate(lng)) return;
  const placeName = data.placeName !== undefined ? data.placeName : existing?.place_name;
  const pinName = data.pinName !== undefined ? data.pinName : existing?.pin_name;
  if (String(placeName || '').trim() || String(pinName || '').trim()) return;
  const err = new Error('Name the pin');
  err.status = 400;
  throw err;
};

const assertPublishedPhenomena = async (status, pebbleId, data) => {
  if (status !== 'published') return;
  if (data.phenomenonIds !== undefined) {
    assertPhenomenonList(data.phenomenonIds);
    return;
  }
  const { rows } = await query(pebbleQueries.countPhenomena, [pebbleId]);
  if (!rows[0]?.count) assertPhenomenonList([]);
};

const assertNotes = (fieldNotes) => {
  if (countFieldNoteWords(fieldNotes) > FIELD_NOTES_WORD_CAP) {
    const err = new Error(`Field notes are limited to ${FIELD_NOTES_WORD_CAP} words`);
    err.status = 400;
    throw err;
  }
};

const normalizeWeather = (weather) => {
  if (weather == null || weather === '') return null;
  const raw = String(weather);
  const value = LEGACY_WEATHER[raw] || raw;
  if (!WEATHER.has(value)) {
    const err = new Error('Unknown weather');
    err.status = 400;
    throw err;
  }
  return value;
};

const normalizeDate = (value) => {
  if (value == null || value === '') return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const err = new Error('Date must be YYYY-MM-DD');
    err.status = 400;
    throw err;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    const err = new Error('Date must be YYYY-MM-DD');
    err.status = 400;
    throw err;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
};

const normalizeTime = (value) => {
  if (value == null || value === '') return null;
  const match = String(value).trim().match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (!match) {
    const err = new Error('Time must be HH:mm');
    err.status = 400;
    throw err;
  }
  return `${match[1]}:${match[2]}`;
};

const normalizePinName = (value) => {
  if (value == null) return null;
  const name = String(value).trim().slice(0, 512);
  return name || null;
};

const resolveObservation = (data, existing) => {
  const touches = data.observedOn !== undefined || data.observedTime !== undefined;
  if (!touches) {
    return {
      observed_on: existing?.observed_on || null,
      observed_time: existing?.observed_time || null,
      observed_at:
        data.observedAt !== undefined ? data.observedAt || null : existing?.observed_at || null,
    };
  }
  const observedOn = normalizeDate(data.observedOn);
  const observedTime = normalizeTime(data.observedTime);
  if (!observedOn || !observedTime) {
    return {
      observed_on: observedOn,
      observed_time: null,
      observed_at: null,
    };
  }
  if (data.observedAt) {
    return {
      observed_on: observedOn,
      observed_time: observedTime,
      observed_at: data.observedAt,
    };
  }
  return {
    observed_on: observedOn,
    observed_time: observedTime,
    observed_at: `${observedOn}T${observedTime}:00.000Z`,
  };
};

const normalizeStatus = (status, fallback = 'published') => {
  if (status === 'draft' || status === 'published') return status;
  return fallback;
};

const columnValues = (authorId, data, existing = null) => {
  const status = normalizeStatus(data.status, existing?.status || 'published');
  const title = data.title !== undefined ? String(data.title).trim() : existing?.title || '';
  if (status === 'published' && !title) {
    const err = new Error('Title is required');
    err.status = 400;
    throw err;
  }
  const fieldNotes = data.fieldNotes !== undefined ? data.fieldNotes || EMPTY_NOTES : existing?.field_notes || EMPTY_NOTES;
  assertNotes(fieldNotes);
  const pick = (key, column) => (data[key] !== undefined ? data[key] : existing?.[column] ?? null);
  const observation = resolveObservation(data, existing);
  return {
    status,
    values: [
      authorId,
      title,
      pick('description', 'description') || null,
      pick('placeId', 'place_id'),
      pick('placeName', 'place_name'),
      pick('placeLat', 'place_lat'),
      pick('placeLng', 'place_lng'),
      pick('placeLocality', 'place_locality'),
      pick('placeAdminArea', 'place_admin_area'),
      pick('placeCountry', 'place_country'),
      pick('heroImageUrl', 'hero_image_url'),
      JSON.stringify(fieldNotes),
      data.isPrivate !== undefined ? Boolean(data.isPrivate) : Boolean(existing?.is_private),
      status,
      observation.observed_on,
      observation.observed_time,
      observation.observed_at,
      data.weather !== undefined ? normalizeWeather(data.weather) : existing?.weather || null,
      data.pinName !== undefined ? normalizePinName(data.pinName) : existing?.pin_name || null,
    ],
  };
};

const applyRelations = async (pebbleId, data) => {
  if (data.phenomenonIds !== undefined) await setPhenomena(pebbleId, data.phenomenonIds);
  if (data.fieldIds !== undefined) await setFields(pebbleId, data.fieldIds);
  if (data.otherTags !== undefined) await setOtherTags(pebbleId, data.otherTags);
  if (data.resources !== undefined) await setResources(pebbleId, data.resources);
  if (data.questions !== undefined) await setQuestions(pebbleId, data.questions);
  if (data.mediaIds !== undefined || data.media !== undefined) {
    const ids =
      data.mediaIds !== undefined
        ? data.mediaIds
        : (data.media || []).map((item) => item.mediaId ?? item.media_id);
    await setMedia(pebbleId, ids, data.media);
  }
};

const create = async (authorId, data) => {
  requireDb();
  const { status, values } = columnValues(authorId, data || {});
  if (status === 'published') assertPhenomenonList(data?.phenomenonIds);
  assertLocation(status, data || {});
  assertNamedPin(status, data || {});
  const { rows } = await query(pebbleQueries.insert, values);
  const pebble = rows[0];
  await applyRelations(pebble.pebble_id, {
    phenomenonIds: data.phenomenonIds || [],
    fieldIds: data.fieldIds || [],
    otherTags: data.otherTags || [],
    resources: data.resources || [],
    questions: data.questions || [],
    mediaIds: data.mediaIds || [],
    media: data.media,
  });
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

  const { status, values } = columnValues(authorId, data, existing);
  await assertPublishedPhenomena(status, pebbleId, data);
  assertLocation(status, data, existing);
  assertNamedPin(status, data, existing);
  const [, ...rest] = values;
  const { rows } = await query(pebbleQueries.update, [pebbleId, ...rest, authorId]);
  await applyRelations(pebbleId, data);
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

const getFeed = async (viewerId, filters = {}) => {
  requireDb();
  const favorites = Boolean(filters.favorites);
  const mine = Boolean(filters.mine);
  const { rows } = await query(pebbleQueries.feed, [viewerId, favorites, mine]);
  return enrichMany(rows, viewerId);
};

const normalizeSearchFilters = (filters = {}) => {
  const q = filters.q != null ? String(filters.q).trim() : '';
  const author = filters.author != null ? String(filters.author).trim() : '';
  const region = filters.region != null ? String(filters.region).trim() : '';
  const fieldId =
    filters.fieldId != null && String(filters.fieldId).trim() !== ''
      ? Number(filters.fieldId)
      : null;
  const notes = []
    .concat(filters.notes || [])
    .map((term) => String(term || '').trim())
    .filter(Boolean);
  const phenomenonId =
    filters.phenomenonId != null && String(filters.phenomenonId).trim() !== ''
      ? Number(filters.phenomenonId)
      : null;
  return {
    q: q || null,
    author: author || null,
    region: region || null,
    fieldId: Number.isFinite(fieldId) ? fieldId : null,
    phenomenonId: Number.isFinite(phenomenonId) ? phenomenonId : null,
    notes,
    favorites: Boolean(filters.favorites),
    mine: Boolean(filters.mine),
    hasPhoto: Boolean(filters.hasPhoto),
    hasVideo: Boolean(filters.hasVideo),
    hasData: Boolean(filters.hasData),
  };
};

const listForMap = async (viewerId, filters = {}) => {
  requireDb();
  const { q, author, region, fieldId, phenomenonId, notes, favorites, mine, hasPhoto, hasVideo, hasData } =
    normalizeSearchFilters(filters);
  const { rows } = await query(pebbleQueries.mapPins, [
    viewerId,
    q,
    fieldId,
    author,
    region,
    favorites,
    mine,
    hasPhoto,
    hasVideo,
    hasData,
    phenomenonId,
    notes,
  ]);
  return rows.map(({ favorite_rank: _favoriteRank, ...pin }) => pin);
};

const search = async (filters = {}, viewerId = null) => {
  requireDb();
  const normalized =
    typeof filters === 'string' ? normalizeSearchFilters({ q: filters }) : normalizeSearchFilters(filters);
  const { q, author, region, fieldId, phenomenonId, notes, favorites, mine, hasPhoto, hasVideo, hasData } = normalized;
  if (mine && !viewerId) return [];
  if (
    !q &&
    !author &&
    !region &&
    !fieldId &&
    !phenomenonId &&
    !notes.length &&
    !favorites &&
    !mine &&
    !hasPhoto &&
    !hasVideo &&
    !hasData
  ) {
    return [];
  }
  const { rows } = await query(pebbleQueries.search, [
    q || '',
    viewerId,
    fieldId,
    author,
    region,
    favorites,
    mine,
    hasPhoto,
    hasVideo,
    hasData,
    phenomenonId,
    notes,
  ]);
  return enrichMany(rows, viewerId);
};

const listByAuthor = async (authorId, viewerId = null) => {
  requireDb();
  const { rows } = await query(pebbleQueries.listByAuthor, [authorId, viewerId]);
  return enrichMany(rows, viewerId);
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
