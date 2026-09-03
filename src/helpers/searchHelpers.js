const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchSearchSuggestions = async (q) => {
  const term = String(q || '').trim();
  if (term.length < 2) return [];
  const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, {
    credentials: 'include',
  });
  const data = await parseJson(res);
  return data.suggestions || [];
};
