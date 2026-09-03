const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

const buildSearchParams = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.fieldId) params.set('field_id', String(filters.fieldId));
  if (filters.author) params.set('author', filters.author);
  if (filters.region) params.set('region', filters.region);
  return params;
};

export const fetchFeed = async () => {
  const res = await fetch('/api/pebbles/feed', { credentials: 'include' });
  const data = await parseJson(res);
  return data.pebbles || [];
};

export const fetchMapPebbles = async (filters = {}) => {
  const params = buildSearchParams(filters);
  const query = params.toString();
  const res = await fetch(`/api/pebbles/map${query ? `?${query}` : ''}`, {
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.pebbles || [];
};

export const searchPebbles = async (filters = {}) => {
  const normalized =
    typeof filters === 'string' ? { q: filters } : filters || {};
  const params = buildSearchParams(normalized);
  const query = params.toString();
  if (!query) return [];
  const res = await fetch(`/api/pebbles/search?${query}`, {
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.pebbles || [];
};

export const fetchPebble = async (id) => {
  const res = await fetch(`/api/pebbles/${id}`, { credentials: 'include' });
  const data = await parseJson(res);
  return data.pebble;
};

export const createPebble = async (payload) => {
  const res = await fetch('/api/pebbles', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.pebble;
};

export const updatePebble = async (id, payload) => {
  const res = await fetch(`/api/pebbles/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.pebble;
};

export const deletePebble = async (id) => {
  const res = await fetch(`/api/pebbles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseJson(res);
};

export const likePebble = async (id) => {
  const res = await fetch(`/api/pebbles/${id}/like`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.pebble;
};

export const unlikePebble = async (id) => {
  const res = await fetch(`/api/pebbles/${id}/like`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.pebble;
};
