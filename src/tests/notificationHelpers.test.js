import {
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../helpers/notificationHelpers';

describe('notificationHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('fetchNotifications returns payload', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0 }),
    });
    await expect(fetchNotifications()).resolves.toEqual({
      notifications: [],
      unreadCount: 0,
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications', {
      credentials: 'include',
    });
  });

  test('markNotificationRead posts to id endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ notification: { notification_id: 3, read_at: 'now' } }),
    });
    await expect(markNotificationRead(3)).resolves.toEqual({
      notification_id: 3,
      read_at: 'now',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/3/read',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('markAllNotificationsRead hits read-all', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    await markAllNotificationsRead();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/read-all',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('preference helpers hit preferences endpoints', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        preferences: { notify_on_follow: false, notify_on_like: true },
      }),
    });
    await expect(fetchNotificationPreferences()).resolves.toEqual({
      notify_on_follow: false,
      notify_on_like: true,
    });
    await updateNotificationPreferences({ notifyOnFollow: false });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/notifications/preferences',
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  test('surfaces auth errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not authenticated' }),
    });
    await expect(fetchNotifications()).rejects.toThrow('Not authenticated');
  });
});
