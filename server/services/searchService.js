const { isDbHealthy, query } = require('../db');
const { searchQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const suggest = async (q, viewerId = null) => {
  requireDb();
  const term = String(q || '').trim();
  if (term.length < 2) return [];

  const [users, places] = await Promise.all([
    query(searchQueries.suggestUsers, [term, viewerId]),
    query(searchQueries.suggestPlaces, [term]),
  ]);

  const suggestions = [];

  for (const user of users.rows) {
    suggestions.push({
      type: 'user',
      id: `user-${user.user_id}`,
      label: user.display_name || user.username,
      subtitle: `@${user.username}`,
      value: user.username,
      user_id: user.user_id,
      username: user.username,
      profile_pic_url: user.profile_pic_url,
    });
  }

  for (const place of places.rows) {
    suggestions.push({
      type: 'place',
      id: `place-${place.label}`,
      label: place.label,
      subtitle: 'Place',
      value: place.label,
      place_lat: place.place_lat,
      place_lng: place.place_lng,
    });
  }

  return suggestions.slice(0, 12);
};

module.exports = {
  suggest,
};
