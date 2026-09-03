const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const searchOrganizations = async (q) => {
  const res = await fetch(`/api/organizations/search?q=${encodeURIComponent(q || '')}`, {
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.organizations || [];
};

export const createOrganization = async (payload) => {
  const res = await fetch('/api/organizations', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data.organization;
};
