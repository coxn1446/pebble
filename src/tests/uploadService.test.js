jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(),
}));

jest.mock('../../server/config/storage', () => ({
  getStorage: jest.fn(() => null),
  getBucketName: jest.fn(() => null),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

const fs = require('fs');
const { query } = require('../../server/db');
const uploadService = require('../../server/services/uploadService');

const MB = 1024 * 1024;

const file = ({ name, type, size, hint }) => ({
  buffer: Buffer.from('media'),
  size,
  mimetype: type,
  originalname: name,
  hint,
});

describe('uploadService media limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.mockResolvedValue({
      rows: [
        {
          media_id: 9,
          media_url: '/uploads/field.mp4',
          media_type: 'video',
          filename: 'field.mp4',
        },
      ],
    });
  });

  test('stores a large video', async () => {
    const video = file({ name: 'field.mp4', type: 'video/mp4', size: 150 * MB });
    const media = await uploadService.uploadBuffer(video, 'video');
    expect(media.media_type).toBe('video');
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(query).toHaveBeenCalled();
  });
});
