import {
  createPebble,
  fetchFeed,
  fetchMapPebbles,
  likePebble,
  searchPebbles,
  unlikePebble,
} from '../helpers/pebbleHelpers';
import { createMockPebble } from './__mocks__/fetchMocks';

describe('pebbleHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('fetchFeed returns pebbles on success', async () => {
    const pebbles = [createMockPebble()];
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ pebbles }),
    });

    await expect(fetchFeed()).resolves.toEqual(pebbles);
    expect(global.fetch).toHaveBeenCalledWith('/api/pebbles/feed', { credentials: 'include' });
  });

  test('fetchFeed throws on unauthorized', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not authenticated' }),
    });

    await expect(fetchFeed()).rejects.toThrow('Not authenticated');
  });

  test('fetchMapPebbles returns pebbles on success', async () => {
    const pebbles = [
      createMockPebble({ place_lat: 43.65, place_lng: -70.25, place_name: 'Portland, ME' }),
    ];
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ pebbles }),
    });

    await expect(fetchMapPebbles()).resolves.toEqual(pebbles);
    expect(global.fetch).toHaveBeenCalledWith('/api/pebbles/map', { credentials: 'include' });
  });

  test('fetchMapPebbles throws on unauthorized', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not authenticated' }),
    });

    await expect(fetchMapPebbles()).rejects.toThrow('Not authenticated');
  });

  test('searchPebbles encodes query and advanced filters', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ pebbles: [] }),
    });

    await searchPebbles('evolution study');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pebbles/search?q=evolution+study',
      { credentials: 'include' }
    );

    await searchPebbles({ q: 'gravity', fieldId: 2, author: 'ada', region: 'Maine' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pebbles/search?q=gravity&field_id=2&author=ada&region=Maine',
      { credentials: 'include' }
    );
  });

  test('fetchMapPebbles encodes filters', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ pebbles: [] }),
    });
    await fetchMapPebbles({ author: 'ada', region: 'Maine' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pebbles/map?author=ada&region=Maine',
      { credentials: 'include' }
    );
  });

  test('createPebble posts payload', async () => {
    const pebble = createMockPebble({ title: 'New' });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ pebble }),
    });

    const result = await createPebble({ title: 'New', isPrivate: true });
    expect(result.title).toBe('New');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pebbles',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('like and unlike hit correct endpoints', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ pebble: createMockPebble({ liked_by_me: true }) }),
    });

    await likePebble(10);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pebbles/10/like',
      expect.objectContaining({ method: 'POST' })
    );

    await unlikePebble(10);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pebbles/10/like',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  test('createPebble surfaces permission errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    });

    await expect(createPebble({ title: 'X' })).rejects.toThrow('Forbidden');
  });
});
