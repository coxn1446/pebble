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
  if (filters.author) params.set('author', filters.author);
  if (filters.region) params.set('region', filters.region);
  return params;
};

export const fetchMe = async () => {
  const res = await fetch('/api/users/me', { credentials: 'include' });
  const data = await parseJson(res);
  return data.user;
};

export const updateMe = async (payload) => {
  const res = await fetch('/api/users/me', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.user;
};

export const fetchMyProfile = async () => {
  const res = await fetch('/api/users/me/profile', { credentials: 'include' });
  return parseJson(res);
};

export const fetchUserProfile = async (username) => {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
    credentials: 'include',
  });
  return parseJson(res);
};

export const fetchFollowers = async (username) => {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}/followers`, {
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.users || [];
};

export const fetchFollowing = async (username) => {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}/following`, {
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.users || [];
};

export const fetchMapUsers = async (filters = {}) => {
  const params = buildSearchParams(filters);
  const query = params.toString();
  const res = await fetch(`/api/users/map${query ? `?${query}` : ''}`, {
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.users || [];
};
