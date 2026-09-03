export const EMPTY_FIELD_NOTES = [{ type: 'paragraph', children: [{ text: '' }] }];

/** Void node types in Slate field notes. `graph` kept for older documents. */
export const MEDIA_VOID_TYPES = ['image', 'video', 'audio', 'data', 'attachment', 'graph'];

export const normalizeFieldNotes = (value) => {
  if (!Array.isArray(value) || value.length === 0) return EMPTY_FIELD_NOTES;
  return value;
};

export const createMediaNode = ({ mediaType, url, mediaId, caption, meta }) => ({
  type: mediaType,
  media_type: mediaType,
  url,
  media_id: mediaId || null,
  caption: caption || '',
  meta: meta || null,
  children: [{ text: '' }],
});
