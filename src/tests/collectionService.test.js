jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(),
}));

const { query } = require('../../server/db');
const collectionService = require('../../server/services/collectionService');
const { collectionQueries } = require('../../server/queries');

describe('collection delete', () => {
  beforeEach(() => {
    query.mockReset();
  });

  test('forbids a non-owner', async () => {
    query.mockImplementation(async (sql) => {
      if (sql === collectionQueries.findById) {
        return {
          rows: [{ collection_id: 4, owner_id: 1, name: 'Climate Science' }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(collectionService.remove(4, 2)).rejects.toMatchObject({ status: 403 });
    expect(query.mock.calls.some((call) => call[0] === collectionQueries.remove)).toBe(false);
  });

  test('the owner delete removes the collection and not the pebbles', async () => {
    query.mockImplementation(async (sql) => {
      if (sql === collectionQueries.findById) {
        return {
          rows: [{ collection_id: 4, owner_id: 1, name: 'Climate Science' }],
          rowCount: 1,
        };
      }
      if (sql === collectionQueries.remove) {
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(collectionService.remove(4, 1)).resolves.toEqual({ success: true });
    expect(query).toHaveBeenCalledWith(collectionQueries.remove, [4, 1]);
    expect(collectionQueries.remove).toContain('DELETE FROM collections');
    expect(collectionQueries.remove).not.toMatch(/pebble/i);
  });
});
