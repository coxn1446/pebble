export const EMPTY_FIELD_NOTES = [{ type: 'paragraph', children: [{ text: '' }] }];

export const FIELD_NOTES_WORD_CAP = 250;

const collectText = (nodes) => {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return '';
      if (typeof node.text === 'string') return node.text;
      return collectText(node.children);
    })
    .join(' ');
};

export const countFieldNoteWords = (value) => {
  const text = collectText(value).trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

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
