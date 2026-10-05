/**
 * Default avatar: one penguin on a brand-color background chosen from the user id.
 * Colors are Tailwind tokens from tailwind.config.js.
 */

export const DEFAULT_AVATAR_COLORS = [
  { className: 'bg-ocean', pinClass: 'avatar-bg-ocean' },
  { className: 'bg-moss', pinClass: 'avatar-bg-moss' },
  { className: 'bg-sandstone', pinClass: 'avatar-bg-sandstone' },
  { className: 'bg-pebble', pinClass: 'avatar-bg-pebble' },
  { className: 'bg-ocean-hover', pinClass: 'avatar-bg-ocean-hover' },
];

export const DEFAULT_AVATAR_COLOR_CLASSES = DEFAULT_AVATAR_COLORS.map((color) => color.className);

function hashUserId(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n) || n === 0) return 0;
  return Math.floor(Math.abs(Math.sin(n + 1) * 10000)) || 0;
}

const colorForUser = (userId) =>
  DEFAULT_AVATAR_COLORS[hashUserId(userId) % DEFAULT_AVATAR_COLORS.length];

export function getDefaultAvatarColorClass(userId) {
  return colorForUser(userId).className;
}

export function getDefaultAvatarPinClass(userId) {
  return colorForUser(userId).pinClass;
}
