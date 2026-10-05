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
  if (filters.favorites) params.set('favorites', '1');
  if (filters.mine) params.set('mine', '1');
  if (filters.hasPhoto) params.set('has_photo', '1');
  if (filters.hasVideo) params.set('has_video', '1');
  if (filters.hasData) params.set('has_data', '1');
  return params;
};

const pad2 = (value) => String(value).padStart(2, '0');

export const calendarDay = (value) => {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`;
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};

export const clockMinutes = (value) => {
  if (value == null || value === '') return '';
  const match = String(value).match(/^(\d{2}):(\d{2})/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return '';
  return `${match[1]}:${match[2]}`;
};

export const readObservation = (pebble) => {
  const observedOn = calendarDay(pebble?.observed_on);
  if (observedOn || pebble?.observed_time) {
    return { observedOn, observedTime: clockMinutes(pebble?.observed_time) };
  }
  if (pebble?.observed_at) {
    const date = new Date(pebble.observed_at);
    if (!Number.isNaN(date.getTime())) {
      return {
        observedOn: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
        observedTime: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
      };
    }
  }
  return { observedOn: '', observedTime: '' };
};

export const formatObserved = (pebble) => {
  const observedOn = calendarDay(pebble?.observed_on);
  const observedTime = clockMinutes(pebble?.observed_time);
  if (observedOn && observedTime) return `${observedOn} ${observedTime}`;
  if (observedOn) return observedOn;
  if (!pebble?.observed_at) return '';
  const date = new Date(pebble.observed_at);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

export const pinLabel = (pebble) => {
  const pin = pebble?.pin_name != null ? String(pebble.pin_name).trim() : '';
  if (pin) return pin;
  const place = pebble?.place_name != null ? String(pebble.place_name).trim() : '';
  return place;
};

export const publishedMapPath = (pebble) => {
  const params = new URLSearchParams();
  params.set('mine', '1');
  params.set('pebble', String(pebble.pebble_id));
  return `/?${params.toString()}`;
};

export const fetchFeed = async (filters = {}) => {
  const params = buildSearchParams(filters);
  const query = params.toString();
  const res = await fetch(`/api/pebbles/feed${query ? `?${query}` : ''}`, { credentials: 'include' });
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
