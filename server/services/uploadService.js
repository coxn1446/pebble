const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { getStorage, getBucketName } = require('../config/storage');
const { isDbHealthy, query } = require('../db');
const { pebbleQueries } = require('../queries');

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'data', 'attachment', 'graph']);

const inferMediaType = (mimetype = '', filename = '') => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  const ext = path.extname(filename).toLowerCase();
  if (['.json', '.csv', '.tsv', '.xlsx'].includes(ext)) return 'data';
  return 'attachment';
};

const ensureLocalDir = () => {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
};

const uploadBuffer = async (file, mediaTypeHint) => {
  if (!file?.buffer) {
    const err = new Error('File is required');
    err.status = 400;
    throw err;
  }

  const mediaType = MEDIA_TYPES.has(mediaTypeHint)
    ? mediaTypeHint
    : inferMediaType(file.mimetype, file.originalname);

  const ext = path.extname(file.originalname || '') || '';
  const objectName = `pebbles/${randomUUID()}${ext}`;
  const bucketName = getBucketName();
  const storage = getStorage();

  let mediaUrl;
  if (bucketName && storage) {
    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(objectName);
    await gcsFile.save(file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    mediaUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
  } else {
    ensureLocalDir();
    const localName = path.basename(objectName);
    fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, localName), file.buffer);
    mediaUrl = `/uploads/${localName}`;
  }

  if (!isDbHealthy()) {
    return {
      media_id: null,
      media_url: mediaUrl,
      media_type: mediaType,
      filename: file.originalname || null,
    };
  }

  const { rows } = await query(pebbleQueries.insertMedia, [
    null,
    mediaUrl,
    mediaType,
    file.originalname || null,
  ]);
  return rows[0];
};

module.exports = {
  uploadBuffer,
  inferMediaType,
  MEDIA_TYPES,
};
