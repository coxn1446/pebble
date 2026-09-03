const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const createFlag = async ({ targetType, targetId, reason, details }) => {
  const res = await fetch('/api/flags', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetType, targetId, reason, details }),
  });
  const data = await parseJson(res);
  return data.flag;
};
