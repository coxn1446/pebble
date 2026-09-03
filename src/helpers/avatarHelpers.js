/**
 * Deterministic default avatars: animal emoji + brand color token class.
 * Colors are limited to Tailwind tokens from tailwind.config.js.
 */

export const DEFAULT_AVATAR_EMOJIS = [
  '🦊',
  '🦁',
  '🐯',
  '🐨',
  '🐼',
  '🐸',
  '🦉',
  '🦄',
  '🐙',
  '🦋',
  '🐢',
  '🐝',
  '🐳',
  '🦜',
  '🐧',
  '🦩',
];

export const DEFAULT_AVATAR_COLOR_CLASSES = [
  'bg-ocean',
  'bg-moss',
  'bg-sandstone',
  'bg-accent',
  'bg-slate',
  'bg-pebble',
];

function hashUserId(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n) || n === 0) return 0;
  return Math.floor(Math.abs(Math.sin(n + 1) * 10000)) || 0;
}

export function getDefaultAvatarEmoji(userId) {
  const hash = hashUserId(userId);
  return DEFAULT_AVATAR_EMOJIS[hash % DEFAULT_AVATAR_EMOJIS.length];
}

export function getDefaultAvatarColorClass(userId) {
  const hash = hashUserId(userId);
  return DEFAULT_AVATAR_COLOR_CLASSES[
    Math.floor(hash / DEFAULT_AVATAR_EMOJIS.length) % DEFAULT_AVATAR_COLOR_CLASSES.length
  ];
}
