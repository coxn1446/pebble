const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { getStorage, getBucketName } = require('../config/storage');
const { isDbHealthy, query } = require('../db');
const { pebbleQueries } = require('../queries');

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif']);

const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'data', 'attachment', 'graph']);

const inferMediaType = (mimetype = '', filename = '') => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  const ext = path.extname(filename).toLowerCase();
  if (VIDEO_EXT.has(ext)) return 'video';
  if (IMAGE_EXT.has(ext)) return 'image';
  if (['.json', '.csv', '.tsv', '.xlsx'].includes(ext)) return 'data';
  return 'attachment';
};

const resolveMediaType = (file, mediaTypeHint) => {
  const inferred = inferMediaType(file?.mimetype || file?.contentType, file?.originalname || file?.filename);
  if (inferred === 'video' || inferred === 'image') return inferred;
  if (MEDIA_TYPES.has(mediaTypeHint)) return mediaTypeHint;
  return inferred;
};

const contentTypeFor = (file, mediaType) => {
  const given = file?.mimetype || file?.contentType;
  if (given && given !== 'application/octet-stream') return given;
  const ext = path.extname(file?.originalname || file?.filename || '').toLowerCase();
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.mp4' || ext === '.m4v') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (mediaType === 'video') return 'video/mp4';
  return given || 'application/octet-stream';
};

const ensureLocalDir = () => {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
};

const assertSize = (file) => {
  if (file?.size > MAX_UPLOAD_BYTES) {
    const err = new Error('That file is too large. Keep photos and videos under 200 MB.');
    err.status = 413;
    throw err;
  }
};

const publicUrl = (bucketName, objectName) =>
  `https://storage.googleapis.com/${bucketName}/${objectName}`;

const storeFile = async (file, objectName, contentType) => {
  const bucketName = getBucketName();
  const storage = getStorage();
  if (bucketName && storage) {
    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(objectName);
    if (file.path) {
      await bucket.upload(file.path, {
        destination: objectName,
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000',
        },
      });
    } else {
      await gcsFile.save(file.buffer, {
        contentType,
        resumable: false,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
    }
    return publicUrl(bucketName, objectName);
  }

  ensureLocalDir();
  const localName = path.basename(objectName);
  const destination = path.join(LOCAL_UPLOAD_DIR, localName);
  if (file.path) fs.copyFileSync(file.path, destination);
  else fs.writeFileSync(destination, file.buffer);
  return `/uploads/${localName}`;
};

const cleanupTemp = (file) => {
  if (file?.path) {
    try {
      fs.unlinkSync(file.path);
    } catch {
      // The temp file is already gone.
    }
  }
};

const insertMediaRow = async (mediaUrl, mediaType, filename) => {
  if (!isDbHealthy()) {
    return {
      media_id: null,
      media_url: mediaUrl,
      media_type: mediaType,
      filename: filename || null,
      title: null,
      caption: null,
      preview_x: 50,
      preview_y: 50,
      preview_scale: 1,
    };
  }
  const { rows } = await query(pebbleQueries.insertMedia, [
    null,
    mediaUrl,
    mediaType,
    filename || null,
  ]);
  return rows[0];
};

const uploadBuffer = async (file, mediaTypeHint) => {
  if (!file?.buffer && !file?.path) {
    const err = new Error('File is required');
    err.status = 400;
    throw err;
  }
  assertSize(file);
  const mediaType = resolveMediaType(file, mediaTypeHint);
  const ext = path.extname(file.originalname || '') || '';
  const objectName = `pebbles/${randomUUID()}${ext}`;
  const contentType = contentTypeFor(file, mediaType);
  try {
    const mediaUrl = await storeFile(file, objectName, contentType);
    return insertMediaRow(mediaUrl, mediaType, file.originalname);
  } finally {
    cleanupTemp(file);
  }
};

let corsReady = false;

const ensureUploadCors = async (bucket) => {
  if (corsReady) return;
  corsReady = true;
  const origins = [
    process.env.DEFAULT_CLIENT_URL,
    'http://localhost:3000',
    'https://pebble-qa-399201808588.us-central1.run.app',
    'https://pebble-prod-399201808588.us-central1.run.app',
    'capacitor://localhost',
  ].filter(Boolean);
  try {
    const [metadata] = await bucket.getMetadata();
    const existing = Array.isArray(metadata.cors) ? metadata.cors : [];
    const covered = existing.some(
      (rule) =>
        (rule.method || []).includes('PUT') &&
        origins.every((origin) => (rule.origin || []).includes(origin))
    );
    if (covered) return;
    await bucket.setCorsConfiguration([
      ...existing,
      {
        origin: origins,
        method: ['PUT', 'GET', 'HEAD', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Content-Length'],
        maxAgeSeconds: 3600,
      },
    ]);
  } catch (err) {
    console.warn('GCS CORS was not updated:', err.message);
  }
};

const objectNameFrom = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return `pebbles/${randomUUID()}${ext}`;
};

const createUploadSession = async ({ filename, contentType, mediaType, size }) => {
  assertSize({ size });
  const bucketName = getBucketName();
  const storage = getStorage();
  if (!bucketName || !storage) return { direct: false };

  const resolvedType = resolveMediaType(
    { mimetype: contentType, originalname: filename },
    mediaType
  );
  const bucket = storage.bucket(bucketName);
  await ensureUploadCors(bucket);
  const objectName = objectNameFrom(filename);
  const type = contentTypeFor({ mimetype: contentType, originalname: filename }, resolvedType);
  try {
    const [uploadUrl] = await storage.bucket(bucketName).file(objectName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: type,
    });
    return {
      direct: true,
      uploadUrl,
      objectName,
      contentType: type,
      mediaType: resolvedType,
    };
  } catch (err) {
    console.warn('Signed upload unavailable:', err.message);
    return { direct: false };
  }
};

const completeUpload = async ({ objectName, mediaType, filename, contentType }) => {
  const safeName = String(objectName || '');
  if (!/^pebbles\/[0-9a-f-]{36}(\.[a-z0-9]+)?$/i.test(safeName)) {
    const err = new Error('Upload could not be finished');
    err.status = 400;
    throw err;
  }
  const bucketName = getBucketName();
  if (!bucketName) {
    const err = new Error('Storage is not configured');
    err.status = 503;
    throw err;
  }
  const resolvedType = resolveMediaType(
    { mimetype: contentType, originalname: filename },
    mediaType
  );
  return insertMediaRow(publicUrl(bucketName, safeName), resolvedType, filename);
};

const featureObjectName = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return `feature-requests/${randomUUID()}${ext}`;
};

const storedFeatureFile = (objectName, filename, contentType, fileUrl) => ({
  file_url: fileUrl,
  file_name: path.basename(filename || objectName).slice(0, 512) || 'file',
  content_type: String(contentType || 'application/octet-stream').slice(0, 255),
  storage_key: objectName,
});

/** Feature-request files have no size cap. Pebble media still uses MAX_UPLOAD_BYTES. */
const storeUnboundedFile = async (file) => {
  if (!file?.buffer && !file?.path) {
    const err = new Error('File is required');
    err.status = 400;
    throw err;
  }
  const objectName = featureObjectName(file.originalname);
  const contentType = file.mimetype || 'application/octet-stream';
  try {
    const fileUrl = await storeFile(file, objectName, contentType);
    return storedFeatureFile(objectName, file.originalname, contentType, fileUrl);
  } finally {
    cleanupTemp(file);
  }
};

const createFeatureUploadSession = async ({ filename, contentType }) => {
  const bucketName = getBucketName();
  const storage = getStorage();
  if (!bucketName || !storage) return { direct: false };

  const bucket = storage.bucket(bucketName);
  await ensureUploadCors(bucket);
  const objectName = featureObjectName(filename);
  const type = contentType || 'application/octet-stream';
  try {
    const [uploadUrl] = await bucket.file(objectName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: type,
    });
    return {
      direct: true,
      uploadUrl,
      objectName,
      contentType: type,
    };
  } catch (err) {
    console.warn('Signed upload unavailable:', err.message);
    return { direct: false };
  }
};

const completeFeatureUpload = async ({ objectName, filename, contentType }) => {
  const safeName = String(objectName || '');
  if (!/^feature-requests\/[0-9a-f-]{36}(\.[a-z0-9]+)?$/i.test(safeName)) {
    const err = new Error('Upload could not be finished');
    err.status = 400;
    throw err;
  }
  const bucketName = getBucketName();
  if (!bucketName) {
    const err = new Error('Storage is not configured');
    err.status = 503;
    throw err;
  }
  return storedFeatureFile(safeName, filename, contentType, publicUrl(bucketName, safeName));
};

module.exports = {
  uploadBuffer,
  createUploadSession,
  completeUpload,
  storeUnboundedFile,
  createFeatureUploadSession,
  completeFeatureUpload,
  inferMediaType,
  resolveMediaType,
  MEDIA_TYPES,
  MAX_UPLOAD_BYTES,
};
