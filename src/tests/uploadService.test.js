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
  copyFileSync: jest.fn(),
  unlinkSync: jest.fn(),
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

  test('treats a quicktime movie as video even when the browser omits a type', () => {
    expect(uploadService.inferMediaType('application/octet-stream', 'field.mov')).toBe('video');
    expect(uploadService.resolveMediaType(
      { mimetype: 'application/octet-stream', originalname: 'field.mov' },
      'image'
    )).toBe('video');
  });

  test('rejects a file over 200 MB', async () => {
    const video = file({ name: 'field.mp4', type: 'video/mp4', size: 201 * MB });
    await expect(uploadService.uploadBuffer(video, 'video')).rejects.toMatchObject({ status: 413 });
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('stores a feature-request file with no size cap', async () => {
    const stored = await uploadService.storeUnboundedFile(
      file({ name: 'brief.pdf', type: 'application/pdf', size: 500 * MB })
    );
    expect(stored.file_name).toBe('brief.pdf');
    expect(stored.storage_key).toMatch(/^feature-requests\//);
    expect(stored.file_url).toMatch(/^\/uploads\//);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('starts a feature-request upload with no size cap when storage is not configured', async () => {
    await expect(
      uploadService.createFeatureUploadSession({
        filename: 'brief.pdf',
        contentType: 'application/pdf',
        size: 800 * MB,
      })
    ).resolves.toEqual({ direct: false });
  });

  test('skips direct upload when storage is not configured', async () => {
    await expect(
      uploadService.createUploadSession({
        filename: 'field.mp4',
        contentType: 'video/mp4',
        mediaType: 'video',
        size: 40 * MB,
      })
    ).resolves.toEqual({ direct: false });
  });
});
