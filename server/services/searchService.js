const { isDbHealthy, query } = require('../db');
const { searchQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const take = (rows, count) => rows.slice(0, count);

const suggest = async (q, viewerId = null) => {
  requireDb();
  const term = String(q || '').trim();
  if (term.length < 2) return [];

  const [users, places, fields, phenomena, notes] = await Promise.all([
    query(searchQueries.suggestUsers, [term, viewerId]),
    query(searchQueries.suggestPlaces, [term]),
    query(searchQueries.suggestFields, [term]),
    query(searchQueries.suggestPhenomena, [term]),
    query(searchQueries.suggestNotes, [term, viewerId]),
  ]);

  const suggestions = [];

  for (const user of take(users.rows, 4)) {
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

  for (const place of take(places.rows, 4)) {
    suggestions.push({
      type: 'place',
      id: `place-${place.label}`,
      label: place.label,
      subtitle: 'Location',
      value: place.label,
      place_lat: place.place_lat,
      place_lng: place.place_lng,
    });
  }

  for (const field of take(fields.rows, 4)) {
    suggestions.push({
      type: 'field',
      id: `field-${field.field_id}`,
      label: field.name,
      subtitle: 'Field',
      value: field.name,
      field_id: field.field_id,
      field_name: field.name,
    });
  }

  for (const phenomenon of take(phenomena.rows, 4)) {
    suggestions.push({
      type: 'phenomenon',
      id: `phenomenon-${phenomenon.phenomenon_id}`,
      label: phenomenon.name,
      subtitle: phenomenon.field_name,
      value: phenomenon.name,
      phenomenon_id: phenomenon.phenomenon_id,
      field_id: phenomenon.field_id,
      field_name: phenomenon.field_name,
    });
  }

  for (const pebble of take(notes.rows, 4)) {
    suggestions.push({
      type: 'pebble',
      id: `pebble-${pebble.pebble_id}`,
      label: pebble.title,
      subtitle: 'Field notes',
      value: pebble.title,
      pebble_id: pebble.pebble_id,
      place_lat: pebble.place_lat,
      place_lng: pebble.place_lng,
    });
  }

  return suggestions;
};

module.exports = {
  suggest,
};
