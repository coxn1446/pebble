const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Upload failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

const contentTypeFor = (file) => {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const name = String(file.name || '').toLowerCase();
  if (name.endsWith('.mov')) return 'video/quicktime';
  if (name.endsWith('.mp4') || name.endsWith('.m4v')) return 'video/mp4';
  if (name.endsWith('.webm')) return 'video/webm';
  return file.type || 'application/octet-stream';
};

const uploadMultipart = async (file, mediaType) => {
  const form = new FormData();
  form.append('file', file);
  if (mediaType) form.append('mediaType', mediaType);
  const res = await fetch('/api/uploads', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const data = await parseJson(res);
  return data.media;
};

const uploadDirect = async (file, mediaType) => {
  const contentType = contentTypeFor(file);
  const sessionRes = await fetch('/api/uploads/session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType,
      mediaType,
      size: file.size,
    }),
  });
  const session = await parseJson(sessionRes);
  if (!session.direct || !session.uploadUrl) return null;
  const put = await fetch(session.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': session.contentType || contentType },
    body: file,
  });
  if (!put.ok) {
    const err = new Error('Upload failed');
    err.status = put.status;
    throw err;
  }
  const done = await fetch('/api/uploads/complete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objectName: session.objectName,
      mediaType: session.mediaType || mediaType,
      filename: file.name,
      contentType: session.contentType || contentType,
    }),
  });
  const data = await parseJson(done);
  return data.media;
};

export const uploadFile = async (file, mediaType) => {
  try {
    const direct = await uploadDirect(file, mediaType);
    if (direct) return direct;
  } catch (err) {
    if (file.size > 32 * 1024 * 1024) throw err;
  }
  return uploadMultipart(file, mediaType);
};

export const uploadFiles = async (entries, limit = 3) => {
  const list = Array.from(entries || []);
  const results = new Array(list.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < list.length) {
      const index = cursor;
      cursor += 1;
      const entry = list[index];
      try {
        const media = await uploadFile(entry.file, entry.mediaType);
        results[index] = { ok: true, media, file: entry.file };
      } catch (error) {
        results[index] = { ok: false, error, file: entry.file };
      }
    }
  };
  const workers = Math.min(limit, list.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
};
