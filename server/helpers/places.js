/**
 * Google Places stub.
 */
const getPlacesApiKey = () => process.env.GOOGLE_PLACES_API_KEY || null;

module.exports = { getPlacesApiKey };
