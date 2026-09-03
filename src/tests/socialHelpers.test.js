import { blockUser, followUser, unfollowUser } from '../helpers/socialHelpers';

describe('socialHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('followUser posts to follow endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    await expect(followUser(5)).resolves.toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/social/follow/5',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('unfollowUser deletes follow', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    await unfollowUser(5);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/social/follow/5',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  test('blockUser surfaces validation errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Cannot block yourself' }),
    });
    await expect(blockUser(1)).rejects.toThrow('Cannot block yourself');
  });
});
