export const createMockUser = (overrides = {}) => ({
  user_id: 1,
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  account_type: 'personal',
  content_searchable: true,
  ...overrides,
});

export const createMockPebble = (overrides = {}) => ({
  pebble_id: 10,
  author_id: 2,
  title: 'Sample pebble',
  description: 'A discovery',
  author_username: 'scientist',
  author_display_name: 'Scientist',
  place_name: 'Lab',
  is_private: false,
  like_count: 0,
  liked_by_me: false,
  phenomena: [],
  field_notes: [{ type: 'paragraph', children: [{ text: 'Notes' }] }],
  ...overrides,
});

export const createDefaultFetchMock = () => {
  return (url) => {
    if (url === '/api/places/key') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ key: null, mapId: null, configured: false }),
      });
    }
    if (url === '/api/taxonomy/fields') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ fields: [{ field_id: 1, name: 'Biology' }] }),
      });
    }
    if (typeof url === 'string' && url.startsWith('/api/taxonomy/phenomena')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          phenomena: [{ phenomenon_id: 1, field_id: 1, name: 'evolution' }],
        }),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Endpoint not mocked' }),
    });
  };
};

export const createAuthFetchMock = (authenticated = false, user = null) => {
  const defaultMock = createDefaultFetchMock();
  const resolvedUser = user || createMockUser();
  return (url, options = {}) => {
    if (url === '/api/auth/me') {
      if (authenticated) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user: resolvedUser }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Not authenticated' }),
      });
    }
    if (url === '/api/pebbles/feed') {
      if (!authenticated) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Not authenticated' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ pebbles: [createMockPebble()] }),
      });
    }
    if (typeof url === 'string' && url.startsWith('/api/pebbles/map')) {
      if (!authenticated) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Not authenticated' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ pebbles: [] }),
      });
    }
    if (typeof url === 'string' && url.startsWith('/api/users/map')) {
      if (!authenticated) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Not authenticated' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ users: [] }),
      });
    }
    if (typeof url === 'string' && url.startsWith('/api/search/suggest')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ suggestions: [] }),
      });
    }
    if (url === '/api/notifications' || url === '/api/notifications/preferences') {
      if (!authenticated) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Not authenticated' }),
        });
      }
      if (url === '/api/notifications/preferences') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            preferences: {
              user_id: resolvedUser.user_id,
              notify_on_follow: true,
              notify_on_like: true,
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ notifications: [], unreadCount: 0 }),
      });
    }
    if (url === '/api/collections' && (!options.method || options.method === 'GET')) {
      if (!authenticated) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Not authenticated' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          collections: [
            {
              collection_id: 1,
              name: 'Saved',
              is_private: false,
              is_collaborative: false,
            },
          ],
        }),
      });
    }
    return defaultMock(url, options);
  };
};
