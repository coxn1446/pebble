const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Upload failed');
    err.status = res.status;
    throw err;
  }
  return data;
};

export const uploadFile = async (file, mediaType) => {
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
