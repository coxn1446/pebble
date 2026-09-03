import { fetchFollowers, fetchFollowing, fetchMapUsers } from '../helpers/userHelpers';

describe('userHelpers social/map', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('fetchFollowers hits followers endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ user_id: 2, username: 'a' }] }),
    });
    await expect(fetchFollowers('testuser')).resolves.toEqual([
      { user_id: 2, username: 'a' },
    ]);
    expect(global.fetch).toHaveBeenCalledWith('/api/users/testuser/followers', {
      credentials: 'include',
    });
  });

  test('fetchFollowing hits following endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    });
    await fetchFollowing('testuser');
    expect(global.fetch).toHaveBeenCalledWith('/api/users/testuser/following', {
      credentials: 'include',
    });
  });

  test('fetchMapUsers encodes filters', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    });
    await fetchMapUsers({ q: 'portland', region: 'Maine' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/users/map?q=portland&region=Maine',
      { credentials: 'include' }
    );
  });

  test('surfaces permission errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not authenticated' }),
    });
    await expect(fetchMapUsers()).rejects.toThrow('Not authenticated');
  });
});
