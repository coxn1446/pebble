import { fetchMe, fetchMyProfile, fetchUserProfile, updateMe } from '../helpers/userHelpers';
import { createMockUser } from './__mocks__/fetchMocks';

describe('userHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('fetchMe returns current user', async () => {
    const user = createMockUser();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user }),
    });
    await expect(fetchMe()).resolves.toEqual(user);
  });

  test('updateMe patches privacy settings', async () => {
    const user = createMockUser({ content_searchable: false });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user }),
    });
    const result = await updateMe({ contentSearchable: false });
    expect(result.content_searchable).toBe(false);
  });

  test('fetchMyProfile loads the signed-in profile without a username', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: createMockUser(), pebbles: [] }),
    });
    const data = await fetchMyProfile();
    expect(global.fetch).toHaveBeenCalledWith('/api/users/me/profile', { credentials: 'include' });
    expect(data.user.username).toBe('testuser');
  });

  test('fetchUserProfile encodes username and returns pebbles', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: createMockUser(), pebbles: [] }),
    });
    const data = await fetchUserProfile('Ada Lovelace');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/users/Ada%20Lovelace',
      { credentials: 'include' }
    );
    expect(data.pebbles).toEqual([]);
  });

  test('fetchUserProfile handles blocked/missing users', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'User not available' }),
    });
    await expect(fetchUserProfile('blocked')).rejects.toThrow('User not available');
  });
});
