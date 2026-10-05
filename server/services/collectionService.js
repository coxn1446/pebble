const { isDbHealthy, query } = require('../db');
const { collectionQueries, pebbleQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const getCollectionOrThrow = async (collectionId) => {
  const { rows } = await query(collectionQueries.findById, [collectionId]);
  if (!rows[0]) {
    const err = new Error('Collection not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const canView = async (collection, userId) => {
  if (!collection.is_private) return true;
  if (collection.owner_id === userId) return true;
  const member = await query(collectionQueries.getMember, [collection.collection_id, userId]);
  return member.rows[0]?.status === 'accepted';
};

const canAddPebbles = async (collection, userId) => {
  if (collection.owner_id === userId) return true;
  if (!collection.is_collaborative) return false;
  const member = await query(collectionQueries.getMember, [collection.collection_id, userId]);
  return member.rows[0]?.status === 'accepted';
};

const create = async (ownerId, data) => {
  requireDb();
  if (!data?.name?.trim()) {
    const err = new Error('Collection name is required');
    err.status = 400;
    throw err;
  }
  const { rows } = await query(collectionQueries.insert, [
    ownerId,
    data.name.trim(),
    Boolean(data.isPrivate),
    Boolean(data.isCollaborative),
    data.coverImageUrl || null,
  ]);
  return rows[0];
};

const listForUser = async (userId) => {
  requireDb();
  const { rows } = await query(collectionQueries.listForUser, [userId]);
  return rows;
};

const getById = async (collectionId, userId) => {
  requireDb();
  const collection = await getCollectionOrThrow(collectionId);
  const allowed = await canView(collection, userId);
  if (!allowed) {
    const err = new Error('Collection not found');
    err.status = 404;
    throw err;
  }
  const [members, pebbles] = await Promise.all([
    query(collectionQueries.listMembers, [collectionId]),
    query(collectionQueries.listPebbles, [collectionId]),
  ]);
  return {
    ...collection,
    members: members.rows,
    pebbles: pebbles.rows,
  };
};

const update = async (collectionId, ownerId, data) => {
  requireDb();
  const { rows } = await query(collectionQueries.update, [
    collectionId,
    data.name?.trim() ?? null,
    typeof data.isPrivate === 'boolean' ? data.isPrivate : null,
    typeof data.isCollaborative === 'boolean' ? data.isCollaborative : null,
    ownerId,
    data.coverImageUrl || null,
  ]);
  if (!rows[0]) {
    const err = new Error('Collection not found');
    err.status = 404;
    throw err;
  }
  return getById(collectionId, ownerId);
};

const remove = async (collectionId, ownerId) => {
  requireDb();
  const collection = await getCollectionOrThrow(collectionId);
  if (Number(collection.owner_id) !== Number(ownerId)) {
    const err = new Error('Only the owner can delete this collection');
    err.status = 403;
    throw err;
  }
  const result = await query(collectionQueries.remove, [collectionId, ownerId]);
  if (result.rowCount === 0) {
    const err = new Error('Collection not found');
    err.status = 404;
    throw err;
  }
  return { success: true };
};

const invite = async (collectionId, ownerId, userId) => {
  requireDb();
  const collection = await getCollectionOrThrow(collectionId);
  if (collection.owner_id !== ownerId) {
    const err = new Error('Only the owner can invite collaborators');
    err.status = 403;
    throw err;
  }
  if (!collection.is_collaborative) {
    const err = new Error('Collection is not collaborative');
    err.status = 400;
    throw err;
  }
  if (userId === ownerId) {
    const err = new Error('Cannot invite yourself');
    err.status = 400;
    throw err;
  }
  const { rows } = await query(collectionQueries.inviteMember, [collectionId, userId]);
  return rows[0];
};

const acceptInvite = async (collectionId, userId) => {
  requireDb();
  const { rows } = await query(collectionQueries.acceptInvite, [collectionId, userId]);
  if (!rows[0]) {
    const err = new Error('Invite not found');
    err.status = 404;
    throw err;
  }
  return getById(collectionId, userId);
};

const addPebble = async (collectionId, userId, pebbleId) => {
  requireDb();
  const collection = await getCollectionOrThrow(collectionId);
  const allowed = await canAddPebbles(collection, userId);
  if (!allowed) {
    const err = new Error('Not allowed to add pebbles to this collection');
    err.status = 403;
    throw err;
  }
  const pebble = await query(pebbleQueries.findById, [pebbleId]);
  if (!pebble.rows[0]) {
    const err = new Error('Pebble not found');
    err.status = 404;
    throw err;
  }
  await query(collectionQueries.addPebble, [collectionId, pebbleId, userId]);
  return getById(collectionId, userId);
};

const removePebble = async (collectionId, userId, pebbleId) => {
  requireDb();
  const collection = await getCollectionOrThrow(collectionId);
  const isOwner = collection.owner_id === userId;
  const canAdd = await canAddPebbles(collection, userId);
  if (!isOwner && !canAdd) {
    const err = new Error('Not allowed');
    err.status = 403;
    throw err;
  }
  await query(collectionQueries.removePebble, [collectionId, pebbleId]);
  return getById(collectionId, userId);
};

module.exports = {
  create,
  listForUser,
  getById,
  update,
  remove,
  invite,
  acceptInvite,
  addPebble,
  removePebble,
};
