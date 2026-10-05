import {
  addPebbleToCollection,
  createCollection,
  deleteCollection,
  fetchCollections,
  inviteToCollection,
} from '../helpers/collectionHelpers';

describe('collectionHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('fetchCollections returns list', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ collections: [{ collection_id: 1, name: 'A' }] }),
    });
    await expect(fetchCollections()).resolves.toEqual([{ collection_id: 1, name: 'A' }]);
  });

  test('fetchCollections throws on 401', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not authenticated' }),
    });
    await expect(fetchCollections()).rejects.toThrow('Not authenticated');
  });

  test('createCollection posts privacy flags', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        collection: { collection_id: 2, name: 'Private', is_private: true },
      }),
    });
    const result = await createCollection({
      name: 'Private',
      isPrivate: true,
      isCollaborative: true,
    });
    expect(result.is_private).toBe(true);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({
      name: 'Private',
      isPrivate: true,
      isCollaborative: true,
    });
  });

  test('inviteToCollection and add pebble use authz endpoints', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ member: { user_id: 3, status: 'invited' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Not allowed to add pebbles to this collection' }),
      });

    await inviteToCollection(1, 3);
    await expect(addPebbleToCollection(1, 10)).rejects.toThrow(
      'Not allowed to add pebbles to this collection'
    );
  });

  test('deleteCollection rejects a non-owner', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Only the owner can delete this collection' }),
    });
    await expect(deleteCollection(4)).rejects.toThrow('Only the owner can delete this collection');
    expect(global.fetch).toHaveBeenCalledWith('/api/collections/4', {
      method: 'DELETE',
      credentials: 'include',
    });
  });
});
