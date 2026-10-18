const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const fetchFeatureAccess = async () => {
  const res = await fetch('/api/feature-requests/access', { credentials: 'include' });
  return parseJson(res);
};

export const fetchFeatureLog = async () => {
  const res = await fetch('/api/feature-requests', { credentials: 'include' });
  const data = await parseJson(res);
  return data.entries || [];
};

const uploadDirect = async (file) => {
  const contentType = file.type || 'application/octet-stream';
  const sessionRes = await fetch('/api/feature-requests/files/session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType,
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
  const done = await fetch('/api/feature-requests/files/complete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objectName: session.objectName,
      filename: file.name,
      contentType: session.contentType || contentType,
    }),
  });
  const data = await parseJson(done);
  return data.file;
};

const uploadMultipart = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/feature-requests/files', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const data = await parseJson(res);
  return data.file;
};

export const uploadFeatureFile = async (file) => {
  const direct = await uploadDirect(file);
  if (direct) return direct;
  return uploadMultipart(file);
};

export const submitFeatureRequest = async ({ body, files }) => {
  const res = await fetch('/api/feature-requests', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, files }),
  });
  return parseJson(res);
};

export const addFeatureLogEntry = async ({ description, releaseDate, status }) => {
  const res = await fetch('/api/feature-requests/log', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, releaseDate, status }),
  });
  const data = await parseJson(res);
  return data.entry;
};
