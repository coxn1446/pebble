import {
  DEFAULT_AVATAR_COLOR_CLASSES,
  DEFAULT_AVATAR_EMOJIS,
  getDefaultAvatarColorClass,
  getDefaultAvatarEmoji,
} from '../helpers/avatarHelpers';

describe('avatarHelpers', () => {
  test('returns deterministic emoji and color class for a user id', () => {
    expect(getDefaultAvatarEmoji(42)).toBe(getDefaultAvatarEmoji(42));
    expect(getDefaultAvatarColorClass(42)).toBe(getDefaultAvatarColorClass(42));
    expect(DEFAULT_AVATAR_EMOJIS).toContain(getDefaultAvatarEmoji(42));
    expect(DEFAULT_AVATAR_COLOR_CLASSES).toContain(getDefaultAvatarColorClass(42));
  });

  test('uses only configured brand color classes', () => {
    DEFAULT_AVATAR_COLOR_CLASSES.forEach((cls) => {
      expect(cls.startsWith('bg-')).toBe(true);
    });
  });

  test('handles invalid ids without throwing', () => {
    expect(DEFAULT_AVATAR_EMOJIS).toContain(getDefaultAvatarEmoji(null));
    expect(DEFAULT_AVATAR_COLOR_CLASSES).toContain(getDefaultAvatarColorClass(undefined));
  });
});
