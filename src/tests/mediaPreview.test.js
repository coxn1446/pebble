import { applyMediaPreview, featuredMedia, mediaKindForFile, readPreview } from '../helpers/mediaPreview';

describe('media preview', () => {
  test('reads a centered preview when crop values are missing', () => {
    expect(readPreview({})).toEqual({ x: 50, y: 50, scale: 1 });
  });

  test('clamps a preview into the frame', () => {
    expect(readPreview({ preview_x: 140, preview_y: -4, preview_scale: 9 })).toEqual({
      x: 100,
      y: 0,
      scale: 3,
    });
  });

  test('writes the crop onto the frame', () => {
    const node = document.createElement('img');
    applyMediaPreview(node, { preview_x: 20, preview_y: 80, preview_scale: 1.5 });
    expect(node.style.getPropertyValue('--media-x')).toBe('20%');
    expect(node.style.getPropertyValue('--media-y')).toBe('80%');
    expect(node.style.getPropertyValue('--media-scale')).toBe('1.5');
  });

  test('uses the featured image crop when that file is in the gallery', () => {
    expect(featuredMedia({})).toBeNull();
    expect(featuredMedia({ hero_image_url: 'https://example.com/a.jpg' })).toMatchObject({
      media_url: 'https://example.com/a.jpg',
      preview_x: 50,
      preview_scale: 1,
    });
    expect(
      featuredMedia({
        hero_image_url: 'https://example.com/a.jpg',
        media: [{ media_url: 'https://example.com/a.jpg', preview_x: 12, title: 'Face' }],
      })
    ).toMatchObject({ preview_x: 12, title: 'Face' });
  });

  test('recognizes a movie the browser labels as a generic file', () => {
    const clip = new File(['v'], 'field.mov', { type: '' });
    expect(mediaKindForFile(clip)).toBe('video');
    expect(mediaKindForFile(new File(['p'], 'field.jpg', { type: 'image/jpeg' }))).toBe('image');
  });
});
