export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
export const VISUAL_MEDIA_LIMIT = 10;

const clamp = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

export const readPreview = (item) => ({
  x: clamp(item?.preview_x, 0, 100, 50),
  y: clamp(item?.preview_y, 0, 100, 50),
  scale: clamp(item?.preview_scale, 1, 3, 1),
});

export const applyMediaPreview = (node, item) => {
  if (!node) return;
  const { x, y, scale } = readPreview(item);
  node.style.setProperty('--media-x', `${x}%`);
  node.style.setProperty('--media-y', `${y}%`);
  node.style.setProperty('--media-scale', String(scale));
};

export const mediaKindForFile = (file) => {
  const type = String(file?.type || '');
  const name = String(file?.name || '');
  if (type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(name)) return 'video';
  if (type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(name)) return 'image';
  return null;
};

export const isVisualMedia = (item) =>
  item?.media_type === 'image' || item?.media_type === 'video';

export const featuredMedia = (pebble) => {
  const url = pebble?.hero_image_url;
  if (!url) return null;
  const match = (pebble?.media || []).find((item) => item.media_url === url);
  if (match) return match;
  return {
    media_url: url,
    media_type: 'image',
    preview_x: 50,
    preview_y: 50,
    preview_scale: 1,
  };
};
