import {
  boundsFromPins,
  clusterMapPins,
  distanceMeters,
  filterPinsByViewport,
  isMappablePebble,
  MAP_PIN_COLOR,
  overlapRadiusMeters,
  pinInViewport,
  PLACE_CAMERA_RANGE,
  rangeForPins,
  viewportBoundsFromCamera,
  zoomFromCameraRange,
} from '../helpers/mapHelpers';

const pin = (id, lat, lng, overrides = {}) => ({
  pebble_id: id,
  title: `Pebble ${id}`,
  place_name: 'Somewhere',
  place_lat: lat,
  place_lng: lng,
  ...overrides,
});

describe('mapHelpers', () => {
  test('MAP_PIN_COLOR matches ocean brand token', () => {
    expect(MAP_PIN_COLOR).toBe('#2563EB');
  });

  test('isMappablePebble requires finite lat/lng', () => {
    expect(isMappablePebble(pin(1, 43.65, -70.25))).toBe(true);
    expect(isMappablePebble({ place_lat: null, place_lng: -70 })).toBe(false);
    expect(isMappablePebble({ place_lat: 43, place_lng: 'x' })).toBe(false);
    expect(isMappablePebble(null)).toBe(false);
  });

  test('clusterMapPins returns empty for empty or non-mappable input', () => {
    expect(clusterMapPins([], 4)).toEqual([]);
    expect(clusterMapPins([{ place_lat: null, place_lng: null }], 4)).toEqual([]);
    expect(clusterMapPins(null, 4)).toEqual([]);
  });

  test('clusterMapPins merges pins that would visually overlap at globe range', () => {
    const pins = [
      pin(1, 43.65, -70.25),
      pin(2, 43.66, -70.26),
      pin(3, 35.68, 139.69),
    ];
    const result = clusterMapPins(pins, 18_000_000);
    const maine = result.find((item) => item.pins.some((p) => p.pebble_id === 1));
    const tokyo = result.find((item) => item.pins.some((p) => p.pebble_id === 3));
    expect(maine.type).toBe('cluster');
    expect(maine.count).toBe(2);
    expect(maine.pins.map((p) => p.pebble_id).sort()).toEqual([1, 2]);
    expect(tokyo.type).toBe('pin');
  });

  test('clusterMapPins keeps far-apart pins separate at street-level range', () => {
    const pins = [pin(1, 43.65, -70.25), pin(2, 44.5, -69.0)];
    const low = clusterMapPins(pins, 18_000_000);
    expect(low).toHaveLength(1);
    expect(low[0].type).toBe('cluster');

    const high = clusterMapPins(pins, 5_000);
    expect(high).toHaveLength(2);
    expect(high.every((item) => item.type === 'pin')).toBe(true);
  });

  test('clusterMapPins keeps a lone pin as type pin', () => {
    const result = clusterMapPins([pin(9, 43.65, -70.25)], 18_000_000);
    expect(result).toEqual([
      expect.objectContaining({
        type: 'pin',
        count: 1,
        key: 'pin-pebble-9',
        lat: 43.65,
        lng: -70.25,
      }),
    ]);
  });

  test('clusterMapPins stacks pebbles that share a location at high zoom', () => {
    const result = clusterMapPins(
      [pin(1, 43.65, -70.25, { title: 'A' }), pin(2, 43.65, -70.25, { title: 'B' })],
      5_000
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        type: 'stack',
        count: 2,
      })
    );
  });

  test('cluster centroid averages member coordinates', () => {
    const result = clusterMapPins([pin(1, 40, -70), pin(2, 42, -72)], 18_000_000);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(41);
    expect(result[0].lng).toBe(-71);
  });

  test('overlapRadiusMeters grows with camera range', () => {
    expect(overlapRadiusMeters(18_000_000)).toBeGreaterThan(overlapRadiusMeters(5_000));
  });

  test('distanceMeters is roughly zero for identical points', () => {
    expect(distanceMeters({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBeCloseTo(0, 5);
  });

  test('boundsFromPins returns null for empty set', () => {
    expect(boundsFromPins([])).toBeNull();
  });

  test('boundsFromPins computes north/south/east/west', () => {
    expect(boundsFromPins([pin(1, 10, 20), pin(2, 30, 5)])).toEqual({
      north: 30,
      south: 10,
      east: 20,
      west: 5,
    });
  });

  test('zoomFromCameraRange maps globe ranges to coarse zoom bands', () => {
    expect(zoomFromCameraRange(18_000_000)).toBe(2);
    expect(zoomFromCameraRange(500_000)).toBe(8);
    expect(zoomFromCameraRange(5_000)).toBe(14);
  });

  test('rangeForPins keeps a single pin at a place-scale range', () => {
    const range = rangeForPins([pin(1, -75.2, -0.1)]);
    expect(range).toBe(PLACE_CAMERA_RANGE);
    expect(range).toBeGreaterThan(50_000);
    expect(range).toBeLessThan(1_000_000);
  });

  test('rangeForPins scales with pin spread', () => {
    const tight = rangeForPins([pin(1, 43.65, -70.25), pin(2, 43.66, -70.26)]);
    const wide = rangeForPins([pin(1, 40, -70), pin(2, 45, -65)]);
    expect(tight).toBe(PLACE_CAMERA_RANGE);
    expect(wide).toBeGreaterThan(PLACE_CAMERA_RANGE);
  });

  test('viewportBoundsFromCamera returns a box around the camera center', () => {
    const bounds = viewportBoundsFromCamera({ lat: 43.65, lng: -70.25 }, 50_000);
    expect(bounds.north).toBeGreaterThan(43.65);
    expect(bounds.south).toBeLessThan(43.65);
    expect(bounds.east).toBeGreaterThan(-70.25);
    expect(bounds.west).toBeLessThan(-70.25);
  });

  test('filterPinsByViewport keeps only pins inside bounds', () => {
    const bounds = { north: 44, south: 43, east: -70, west: -71 };
    const pins = [pin(1, 43.65, -70.25), pin(2, 10, 10)];
    expect(pinInViewport(pins[0], bounds)).toBe(true);
    expect(pinInViewport(pins[1], bounds)).toBe(false);
    expect(filterPinsByViewport(pins, bounds).map((p) => p.pebble_id)).toEqual([1]);
  });
});

