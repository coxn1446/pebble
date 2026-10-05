const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchWeatherSuggestion = async ({ lat, lng, date, time }) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    date,
  });
  if (time) params.set('time', time);
  try {
    const res = await fetch(`/api/weather?${params.toString()}`, { credentials: 'include' });
    const data = await parseJson(res);
    return data.weather || null;
  } catch (err) {
    return null;
  }
};
