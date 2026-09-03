/** Ocean brand token from tailwind.config.js — used for Google marker SVG fill. */
export const MAP_PIN_COLOR = '#2563EB';

/** Default camera range (meters) for a full-Earth globe view on Map3DElement. */
export const GLOBE_CAMERA_RANGE = 18_000_000;

/** Approximate on-screen pin diameter in CSS pixels (matches `.pebble-map-pin`). */
export const MAP_PIN_DIAMETER_PX = 32;

/** Assumed map viewport height for overlap math. */
const ASSUMED_VIEWPORT_PX = 640;

/**
 * Approximate meters represented by one screen pixel at the given camera range.
 * Tighter than degree-grid clustering so pins merge only when markers would overlap.
 */
export const metersPerPixelFromRange = (rangeMeters) => {
  const range = Number(rangeMeters);
  if (!Number.isFinite(range) || range <= 0) return 1000;
  return range / ASSUMED_VIEWPORT_PX;
};

/** Distance at which two pin centers would visually overlap. */
export const overlapRadiusMeters = (rangeMeters) =>
  metersPerPixelFromRange(rangeMeters) * MAP_PIN_DIAMETER_PX;

/**
 * Map a 3D camera range (meters) onto a coarse zoom band (for tests / legacy callers).
 */
export const zoomFromCameraRange = (rangeMeters) => {
  const range = Number(rangeMeters);
  if (!Number.isFinite(range) || range <= 0) return 2;
  if (range >= 12_000_000) return 2;
  if (range >= 4_000_000) return 4;
  if (range >= 1_000_000) return 6;
  if (range >= 250_000) return 8;
  if (range >= 50_000) return 10;
  if (range >= 12_000) return 12;
  return 14;
};

/** Camera range that frames a pin group for flyCameraTo. */
export const rangeForPins = (pebbles) => {
  const bounds = boundsFromPins(pebbles);
  if (!bounds) return 5000;
  const latSpan = bounds.north - bounds.south;
  const lngSpan = bounds.east - bounds.west;
  const maxDeg = Math.max(latSpan, lngSpan, 0.02);
  return Math.min(Math.max(maxDeg * 111_000 * 2.5, 2500), 8_000_000);
};

export const isMappablePebble = (pebble) => {
  if (!pebble) return false;
  if (pebble.place_lat == null || pebble.place_lng == null) return false;
  const lat = Number(pebble.place_lat);
  const lng = Number(pebble.place_lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

const pinCoords = (pebble) => ({
  lat: Number(pebble.place_lat),
  lng: Number(pebble.place_lng),
});

const centroid = (pins) => {
  const total = pins.reduce(
    (acc, pin) => {
      const { lat, lng } = pinCoords(pin);
      return { lat: acc.lat + lat, lng: acc.lng + lng };
    },
    { lat: 0, lng: 0 }
  );
  return {
    lat: total.lat / pins.length,
    lng: total.lng / pins.length,
  };
};

/** Haversine distance in meters. */
export const distanceMeters = (a, b) => {
  const lat1 = (Number(a.lat) * Math.PI) / 180;
  const lat2 = (Number(b.lat) * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((Number(b.lng) - Number(a.lng)) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Round coords so pebbles at the same place stay stacked at max zoom. */
export const locationKey = (pebble) => {
  const { lat, lng } = pinCoords(pebble);
  return `${lat.toFixed(5)}:${lng.toFixed(5)}`;
};

const pinsShareLocation = (pins) => {
  if (!pins.length) return false;
  const key = locationKey(pins[0]);
  return pins.every((pin) => locationKey(pin) === key);
};

const itemKey = (item) => {
  if (item.pin_type === 'user' || item.user_id != null) {
    return `user-${item.user_id}`;
  }
  return `pebble-${item.pebble_id}`;
};

/**
 * Cluster mappable pins when their markers would overlap at the current camera range.
 * Accepts either a camera range in meters, or a legacy zoom band (≤ 20).
 * Returns items shaped as:
 *   { type: 'cluster'|'stack'|'pin', lat, lng, count, pins, key, pinKind }
 */
export const clusterMapPins = (pebbles, rangeOrZoom) => {
  const pins = (Array.isArray(pebbles) ? pebbles : []).filter(isMappablePebble);
  if (pins.length === 0) return [];

  const numeric = Number(rangeOrZoom) || 0;
  // Legacy zoom bands are small integers; camera ranges are meters.
  const rangeMeters = numeric > 0 && numeric <= 20 ? rangeForZoomBand(numeric) : numeric || GLOBE_CAMERA_RANGE;
  const radius = overlapRadiusMeters(rangeMeters);

  const clusters = [];
  const assigned = new Set();

  for (let i = 0; i < pins.length; i += 1) {
    if (assigned.has(i)) continue;
    const group = [pins[i]];
    assigned.add(i);
    const origin = pinCoords(pins[i]);

    for (let j = i + 1; j < pins.length; j += 1) {
      if (assigned.has(j)) continue;
      const other = pinCoords(pins[j]);
      if (distanceMeters(origin, other) <= radius) {
        group.push(pins[j]);
        assigned.add(j);
      }
    }

    if (group.length === 1) {
      const pebble = group[0];
      const { lat, lng } = pinCoords(pebble);
      const pinKind = pebble.pin_type === 'user' ? 'user' : 'pebble';
      clusters.push({
        type: 'pin',
        lat,
        lng,
        count: 1,
        pins: group,
        key: `pin-${itemKey(pebble)}`,
        pinKind,
      });
      continue;
    }

    const center = centroid(group);
    const stacked = pinsShareLocation(group);
    const allUsers = group.every((p) => p.pin_type === 'user');
    const allPebbles = group.every((p) => p.pin_type !== 'user');
    clusters.push({
      type: stacked ? 'stack' : 'cluster',
      lat: center.lat,
      lng: center.lng,
      count: group.length,
      pins: group,
      key: stacked
        ? `stack-${locationKey(group[0])}`
        : `cluster-${group.map(itemKey).sort().join('-')}`,
      pinKind: allUsers ? 'user' : allPebbles ? 'pebble' : 'mixed',
    });
  }

  return clusters;
};

/** Approximate camera range for a legacy zoom band (used by older tests/callers). */
export const rangeForZoomBand = (zoom) => {
  const z = Number(zoom) || 0;
  if (z <= 2) return 18_000_000;
  if (z <= 4) return 8_000_000;
  if (z <= 6) return 2_000_000;
  if (z <= 8) return 500_000;
  if (z <= 10) return 100_000;
  if (z <= 12) return 25_000;
  return 5_000;
};

/**
 * Approximate visible lat/lng bounds from a Map3D camera center + range.
 * Used to Airbnb-filter the side feed as the globe moves.
 */
export const viewportBoundsFromCamera = (center, rangeMeters) => {
  const lat = Number(center?.lat);
  const lng = Number(center?.lng);
  const range = Number(rangeMeters);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(range) || range <= 0) {
    return null;
  }
  // Visible span ~ camera range projected to ground (with padding).
  const halfMeters = range * 0.55;
  const latPad = halfMeters / 111_000;
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const lngPad = halfMeters / (111_000 * cosLat);
  return {
    north: lat + latPad,
    south: lat - latPad,
    east: lng + lngPad,
    west: lng - lngPad,
  };
};

/** True when a pin's coordinates fall inside viewport bounds. */
export const pinInViewport = (pin, bounds) => {
  if (!bounds || !isMappablePebble(pin)) return false;
  const { lat, lng } = pinCoords(pin);
  if (lat > bounds.north || lat < bounds.south) return false;
  if (bounds.west <= bounds.east) {
    return lng >= bounds.west && lng <= bounds.east;
  }
  // Antimeridian wrap
  return lng >= bounds.west || lng <= bounds.east;
};

export const filterPinsByViewport = (pins, bounds) =>
  (Array.isArray(pins) ? pins : []).filter((pin) => pinInViewport(pin, bounds));

/** LatLngBoundsLiteral-style object for framing pin groups. */
export const boundsFromPins = (pebbles) => {
  const pins = (Array.isArray(pebbles) ? pebbles : []).filter(isMappablePebble);
  if (pins.length === 0) return null;

  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const pebble of pins) {
    const { lat, lng } = pinCoords(pebble);
    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    west = Math.min(west, lng);
  }

  return { north, south, east, west };
};
