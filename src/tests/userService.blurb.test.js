jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(),
}));

const { query } = require('../../server/db');
const userService = require('../../server/services/userService');
const { userQueries } = require('../../server/queries');

const userRow = (blurb) => ({
  user_id: 1,
  username: 'ada',
  display_name: 'Ada',
  blurb,
});

describe('user blurb', () => {
  beforeEach(() => {
    query.mockReset();
  });

  const mockProfileWrite = (stored) => {
    query.mockImplementation(async (sql, params) => {
      if (sql === userQueries.updateProfile) {
        return { rows: [userRow(stored.blurb)], rowCount: 1 };
      }
      if (sql === userQueries.setBlurb) {
        stored.blurb = params[1];
        return { rows: [userRow(stored.blurb)], rowCount: 1 };
      }
      if (sql === userQueries.findById) {
        return { rows: [userRow(stored.blurb)], rowCount: 1 };
      }
      if (sql === userQueries.followerCount || sql === userQueries.followingCount) {
        return { rows: [{ count: 0 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });
  };

  test('saves a blurb and clears an empty one', async () => {
    const stored = { blurb: null };
    mockProfileWrite(stored);

    const saved = await userService.updateMe(1, {
      blurb: '  I watch ice shelves. The coast tells the story. Notes stay short.  ',
    });
    expect(saved.blurb).toBe('I watch ice shelves. The coast tells the story. Notes stay short.');

    const cleared = await userService.updateMe(1, { blurb: '   ' });
    expect(cleared.blurb).toBeNull();
  });

  test('rejects a blurb longer than three sentences worth of text', async () => {
    mockProfileWrite({ blurb: null });
    await expect(userService.updateMe(1, { blurb: 'a'.repeat(501) })).rejects.toMatchObject({
      status: 400,
    });
    expect(query).not.toHaveBeenCalled();
  });
});
