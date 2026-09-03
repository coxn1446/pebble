const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const followUser = async (userId) => {
  const res = await fetch(`/api/social/follow/${userId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson(res);
};

export const unfollowUser = async (userId) => {
  const res = await fetch(`/api/social/follow/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseJson(res);
};

export const blockUser = async (userId) => {
  const res = await fetch(`/api/social/block/${userId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson(res);
};

export const unblockUser = async (userId) => {
  const res = await fetch(`/api/social/block/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseJson(res);
};
