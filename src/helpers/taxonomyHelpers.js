const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchFields = async () => {
  const res = await fetch('/api/taxonomy/fields', { credentials: 'include' });
  const data = await parseJson(res);
  return data.fields || [];
};

export const fetchPhenomena = async (fieldId) => {
  const qs = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : '';
  const res = await fetch(`/api/taxonomy/phenomena${qs}`, { credentials: 'include' });
  const data = await parseJson(res);
  return data.phenomena || [];
};
