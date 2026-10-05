import {
  DEFAULT_AVATAR_COLOR_CLASSES,
  getDefaultAvatarColorClass,
  getDefaultAvatarPinClass,
} from '../helpers/avatarHelpers';

describe('avatarHelpers', () => {
  test('keeps one color for a person and can differ between people', () => {
    expect(getDefaultAvatarColorClass(42)).toBe(getDefaultAvatarColorClass(42));
    expect(getDefaultAvatarPinClass(42)).toBe(getDefaultAvatarPinClass(42));
    expect(DEFAULT_AVATAR_COLOR_CLASSES).toContain(getDefaultAvatarColorClass(42));

    const colors = new Set(
      [1, 2, 3, 4, 5, 8, 13, 21, 34, 55].map((id) => getDefaultAvatarColorClass(id))
    );
    expect(colors.size).toBeGreaterThan(1);
  });

  test('uses only configured brand color classes', () => {
    expect(DEFAULT_AVATAR_COLOR_CLASSES).toEqual([
      'bg-ocean',
      'bg-moss',
      'bg-sandstone',
      'bg-pebble',
      'bg-ocean-hover',
    ]);
  });

  test('handles invalid ids without throwing', () => {
    expect(DEFAULT_AVATAR_COLOR_CLASSES).toContain(getDefaultAvatarColorClass(null));
    expect(getDefaultAvatarPinClass(undefined)).toMatch(/^avatar-bg-/);
  });
});
