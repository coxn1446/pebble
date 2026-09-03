/**
 * Google Places / Maps helpers.
 * Advanced markers require a Cloud Console Map ID (vector map).
 * Falls back to Google's documented DEMO_MAP_ID when unset.
 */
const DEFAULT_MAP_ID = 'DEMO_MAP_ID';

const getPlacesApiKey = () => process.env.GOOGLE_PLACES_API_KEY || null;

const getMapsMapId = () => process.env.GOOGLE_MAPS_MAP_ID || DEFAULT_MAP_ID;

module.exports = { getPlacesApiKey, getMapsMapId, DEFAULT_MAP_ID };
