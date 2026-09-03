import { fetchSearchSuggestions } from '../helpers/searchHelpers';

describe('searchHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('returns empty array for short queries without fetching', async () => {
    await expect(fetchSearchSuggestions('a')).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fetches suggestions for longer queries', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [{ type: 'user', id: 'user-1', label: 'Kaitlin', value: 'kaitlin' }],
      }),
    });
    await expect(fetchSearchSuggestions('Kaitlin')).resolves.toEqual([
      { type: 'user', id: 'user-1', label: 'Kaitlin', value: 'kaitlin' },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/search/suggest?q=Kaitlin',
      { credentials: 'include' }
    );
  });

  test('surfaces API errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Search failed' }),
    });
    await expect(fetchSearchSuggestions('portland')).rejects.toThrow('Search failed');
  });
});
