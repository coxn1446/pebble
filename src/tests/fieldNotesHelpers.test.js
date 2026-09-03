import {
  EMPTY_FIELD_NOTES,
  createMediaNode,
  normalizeFieldNotes,
} from '../helpers/fieldNotesHelpers';

describe('fieldNotesHelpers', () => {
  test('normalizeFieldNotes returns empty document for invalid input', () => {
    expect(normalizeFieldNotes(null)).toEqual(EMPTY_FIELD_NOTES);
    expect(normalizeFieldNotes([])).toEqual(EMPTY_FIELD_NOTES);
  });

  test('normalizeFieldNotes keeps valid slate value', () => {
    const value = [{ type: 'heading', children: [{ text: 'Hi' }] }];
    expect(normalizeFieldNotes(value)).toEqual(value);
  });

  test('createMediaNode builds void media nodes', () => {
    const node = createMediaNode({
      mediaType: 'image',
      url: '/uploads/a.png',
      mediaId: 3,
      caption: 'photo',
    });
    expect(node).toMatchObject({
      type: 'image',
      media_type: 'image',
      url: '/uploads/a.png',
      media_id: 3,
      caption: 'photo',
    });
    expect(node.children).toEqual([{ text: '' }]);
  });
});
