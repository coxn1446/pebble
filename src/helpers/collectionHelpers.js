const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchCollections = async () => {
  const res = await fetch('/api/collections', { credentials: 'include' });
  const data = await parseJson(res);
  return data.collections || [];
};

export const fetchCollection = async (id) => {
  const res = await fetch(`/api/collections/${id}`, { credentials: 'include' });
  const data = await parseJson(res);
  return data.collection;
};

export const createCollection = async (payload) => {
  const res = await fetch('/api/collections', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.collection;
};

export const updateCollection = async (id, payload) => {
  const res = await fetch(`/api/collections/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.collection;
};

export const deleteCollection = async (id) => {
  const res = await fetch(`/api/collections/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseJson(res);
};

export const inviteToCollection = async (id, userId) => {
  const res = await fetch(`/api/collections/${id}/invite`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await parseJson(res);
  return data.member;
};

export const acceptCollectionInvite = async (id) => {
  const res = await fetch(`/api/collections/${id}/accept`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.collection;
};

export const addPebbleToCollection = async (id, pebbleId) => {
  const res = await fetch(`/api/collections/${id}/pebbles`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pebbleId }),
  });
  const data = await parseJson(res);
  return data.collection;
};

export const removePebbleFromCollection = async (id, pebbleId) => {
  const res = await fetch(`/api/collections/${id}/pebbles/${pebbleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.collection;
};
