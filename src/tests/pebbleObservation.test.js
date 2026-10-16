jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
}));

const { query } = require('../../server/db');
const pebbleService = require('../../server/services/pebbleService');
const { pebbleQueries } = require('../../server/queries');

const stored = {
  pebble_id: 4,
  author_id: 1,
  title: 'Shelf',
  status: 'published',
  place_lat: 1,
  place_lng: 2,
  place_name: 'Antarctica',
  observed_at: '2020-05-01T18:00:00.000Z',
  observed_on: null,
  observed_time: null,
};

const mockQuery = () => {
  query.mockImplementation(async (sql) => {
    const text = String(sql);
    if (text.includes('INSERT INTO pebbles') || text.includes('UPDATE pebbles')) {
      return { rows: [{ pebble_id: 4 }] };
    }
    if (text.includes('WHERE p.pebble_id = $1')) {
      return { rows: [stored] };
    }
    return { rows: [], rowCount: 0 };
  });
};

const insertParams = () =>
  query.mock.calls.find((call) => String(call[0]).includes('INSERT INTO pebbles'))[1];

const updateParams = () =>
  query.mock.calls.find((call) => String(call[0]).includes('UPDATE pebbles'))[1];

describe('pebble observation persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery();
  });

  test('saves a date without inventing a clock time', async () => {
    await pebbleService.create(1, {
      title: 'Shelf',
      status: 'published',
      phenomenonIds: [9],
      placeLat: -75,
      placeLng: 0,
      observedOn: '2021-07-27',
      observedTime: null,
      pinName: 'Antarctica',
    });

    const params = insertParams();
    expect(params[14]).toBe('2021-07-27');
    expect(params[15]).toBeNull();
    expect(params[16]).toBeNull();
    expect(params[18]).toBe('Antarctica');
  });

  test('stores 15:00 as 15:00 and keeps an existing timestamp when the clock is unchanged', async () => {
    await pebbleService.create(1, {
      title: 'Shelf',
      status: 'published',
      phenomenonIds: [9],
      placeLat: -75,
      placeLng: 0,
      placeName: 'Field',
      observedOn: '2021-07-27',
      observedTime: '15:00',
    });
    expect(insertParams()[15]).toBe('15:00');
    expect(insertParams()[16]).toBe('2021-07-27T15:00:00.000Z');

    await pebbleService.update(4, 1, {
      title: 'Shelf',
      phenomenonIds: [9],
      observedOn: '2020-05-01',
      observedTime: '14:00',
      observedAt: '2020-05-01T18:00:00.000Z',
    });
    expect(updateParams()[16]).toBe('2020-05-01T18:00:00.000Z');
  });

  test('rejects an unknown weather value', async () => {
    await expect(
      pebbleService.create(1, { title: 'Shelf', status: 'published', weather: 'hail' })
    ).rejects.toMatchObject({ message: 'Unknown weather', status: 400 });
    expect(query).not.toHaveBeenCalled();
  });

  test('keyword search matches the pin name, phenomenon names, and other tags', () => {
    expect(pebbleQueries.search).toContain("p.pin_name ILIKE '%' || $1 || '%'");
    expect(pebbleQueries.search).toContain('JOIN phenomena ph ON ph.phenomenon_id = pp.phenomenon_id');
    expect(pebbleQueries.search).toContain("ot.name ILIKE '%' || $1 || '%'");
    expect(pebbleQueries.mapPins).toContain("p.pin_name ILIKE '%' || $2 || '%'");
    expect(pebbleQueries.mapPins).toContain("ph.name ILIKE '%' || $2 || '%'");
    expect(pebbleQueries.search).toContain("p.field_notes::text ILIKE '%' || $1 || '%'");
    expect(pebbleQueries.search).toContain('unnest($12::text[])');
    expect(pebbleQueries.mapPins).toContain('unnest($12::text[])');
  });

  test('a published pebble requires a phenomenon topic', async () => {
    await expect(
      pebbleService.create(1, { title: 'Shelf', status: 'published' })
    ).rejects.toMatchObject({ message: 'Choose a phenomenon topic', status: 400 });
    expect(query).not.toHaveBeenCalled();
  });

  test('a published pin with coordinates needs a place or a pin name', async () => {
    await expect(
      pebbleService.create(1, {
        title: 'Shelf',
        status: 'published',
        phenomenonIds: [9],
        placeLat: 1,
        placeLng: 2,
        placeName: '  ',
        pinName: '',
      })
    ).rejects.toMatchObject({ message: 'Name the pin', status: 400 });
    expect(query).not.toHaveBeenCalled();
  });

  test('saves an image title with the caption and crop', async () => {
    await pebbleService.update(4, 1, {
      phenomenonIds: [9],
      mediaIds: [3],
      media: [
        {
          mediaId: 3,
          title: '  Ice face  ',
          caption: 'Noon',
          previewX: 20,
          previewY: 80,
          previewScale: 1.5,
        },
      ],
    });
    const call = query.mock.calls.find((item) => String(item[0]).includes('SET title'));
    expect(call[1]).toEqual([3, 4, 'Ice face', 'Noon', 20, 80, 1.5]);
  });

  test('a published pebble requires a location', async () => {
    await expect(
      pebbleService.create(1, {
        title: 'Shelf',
        status: 'published',
        phenomenonIds: [9],
      })
    ).rejects.toMatchObject({ message: 'Add a location', status: 400 });
  });
});
