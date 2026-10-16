jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(),
}));

const { query } = require('../../server/db');
const searchService = require('../../server/services/searchService');
const { searchQueries } = require('../../server/queries');

describe('search suggestions', () => {
  beforeEach(() => {
    query.mockImplementation(async (sql) => {
      const text = String(sql);
      if (text.includes('FROM users') && text.includes('username ILIKE')) {
        return {
          rows: [
            {
              user_id: 3,
              username: 'ada',
              display_name: 'Ada Lovelace',
              profile_pic_url: 'https://example.com/ada.jpg',
            },
          ],
        };
      }
      if (text.includes('FROM fields')) {
        return { rows: [{ field_id: 2, name: 'Earth Science' }] };
      }
      if (text.includes('FROM phenomena')) {
        return {
          rows: [{ phenomenon_id: 8, name: 'erosion', field_id: 2, field_name: 'Earth Science' }],
        };
      }
      if (text.includes('field_notes')) {
        return {
          rows: [{ pebble_id: 12, title: 'Soil notes', place_lat: 1, place_lng: 2 }],
        };
      }
      return { rows: [] };
    });
  });

  test('returns people, fields, phenomena, and field-note pebbles', async () => {
    const suggestions = await searchService.suggest('ear', 1);
    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'user',
          username: 'ada',
          profile_pic_url: 'https://example.com/ada.jpg',
        }),
        expect.objectContaining({ type: 'field', label: 'Earth Science', field_id: 2 }),
        expect.objectContaining({
          type: 'phenomenon',
          label: 'erosion',
          field_name: 'Earth Science',
        }),
        expect.objectContaining({ type: 'pebble', pebble_id: 12, subtitle: 'Field notes' }),
      ])
    );
  });

  test('people search matches a username even when their content is hidden', () => {
    expect(searchQueries.suggestUsers).toContain("username ILIKE '%' || $1 || '%'");
    expect(searchQueries.suggestUsers).toContain("display_name ILIKE '%' || $1 || '%'");
    expect(searchQueries.suggestUsers).not.toContain('content_searchable');
  });
});
