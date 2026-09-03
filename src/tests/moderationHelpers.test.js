import { createFlag } from '../helpers/moderationHelpers';

describe('moderationHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('createFlag posts report payload', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ flag: { flag_id: 1, status: 'pending' } }),
    });
    const flag = await createFlag({
      targetType: 'pebble',
      targetId: 10,
      reason: 'Offensive content',
      details: 'spam',
    });
    expect(flag.status).toBe('pending');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/flags',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('createFlag requires authentication', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not authenticated' }),
    });
    await expect(
      createFlag({
        targetType: 'user',
        targetId: 2,
        reason: 'Harassment',
      })
    ).rejects.toThrow('Not authenticated');
  });

  test('createFlag surfaces validation errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Reason is required' }),
    });
    await expect(
      createFlag({
        targetType: 'pebble',
        targetId: 10,
        reason: '',
      })
    ).rejects.toThrow('Reason is required');
  });
});
