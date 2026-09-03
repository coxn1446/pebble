import { formatRelativeTime } from '../helpers/timeHelpers';

describe('timeHelpers', () => {
  test('formats recent times', () => {
    const now = Date.now();
    expect(formatRelativeTime(new Date(now - 30_000).toISOString())).toMatch(/s$/);
    expect(formatRelativeTime(new Date(now - 5 * 60_000).toISOString())).toMatch(/m$/);
    expect(formatRelativeTime(new Date(now - 3 * 3600_000).toISOString())).toMatch(/h$/);
  });

  test('returns empty string for invalid values', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime('not-a-date')).toBe('');
  });
});
