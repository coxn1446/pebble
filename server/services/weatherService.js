const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const NIGHT_HOURS = new Set([0, 1, 2, 3, 4, 5, 20, 21, 22, 23]);

const chipForWeatherCode = (code, hour) => {
  const value = Number(code);
  if (!Number.isFinite(value)) return null;
  if ((value === 0 || value === 1) && hour != null && NIGHT_HOURS.has(hour)) return 'clear_night';
  if (value === 0 || value === 1) return 'sunny';
  if (value === 2) return 'partly_cloudy';
  if (value === 3) return 'cloudy';
  if (value === 45 || value === 48) return 'foggy';
  if (value === 56 || value === 57 || value === 66 || value === 67) return 'sleet';
  if (
    value === 51 ||
    value === 53 ||
    value === 55 ||
    value === 61 ||
    value === 63 ||
    value === 65 ||
    value === 80 ||
    value === 81 ||
    value === 82
  ) {
    return 'rain';
  }
  if (
    value === 71 ||
    value === 73 ||
    value === 75 ||
    value === 77 ||
    value === 85 ||
    value === 86
  ) {
    return 'snow';
  }
  if (value === 95) return 'thunderstorm';
  if (value === 96 || value === 99) return 'severe';
  return null;
};

const readCode = (payload, { date, time }) => {
  if (time && payload?.hourly?.time && Array.isArray(payload.hourly.weather_code)) {
    const key = `${date}T${time.slice(0, 2)}:00`;
    const index = payload.hourly.time.indexOf(key);
    if (index >= 0) return payload.hourly.weather_code[index];
    return null;
  }
  if (!time && Array.isArray(payload?.daily?.weather_code) && payload.daily.weather_code.length) {
    return payload.daily.weather_code[0];
  }
  return null;
};

const fetchPayload = async (base, params) => {
  try {
    const response = await fetch(`${base}?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const lookup = async ({ lat, lng, date, time } = {}) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const day = String(date || '');
  const clock = time ? String(time).slice(0, 5) : '';
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  if (clock && !/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) return null;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: day,
    end_date: day,
    timezone: 'auto',
  });
  if (clock) params.set('hourly', 'weather_code');
  else params.set('daily', 'weather_code');

  let payload = await fetchPayload(ARCHIVE_URL, params);
  let code = payload ? readCode(payload, { date: day, time: clock || null }) : null;
  if (code == null) {
    payload = await fetchPayload(FORECAST_URL, params);
    code = payload ? readCode(payload, { date: day, time: clock || null }) : null;
  }
  if (code == null) return null;
  const hour = clock ? Number(clock.slice(0, 2)) : null;
  return chipForWeatherCode(code, hour);
};

module.exports = {
  lookup,
  chipForWeatherCode,
};
