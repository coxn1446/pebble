import {
  addFeatureLogEntry,
  fetchFeatureAccess,
  fetchFeatureLog,
  submitFeatureRequest,
  uploadFeatureFile,
} from '../helpers/featureRequestHelpers';

describe('featureRequestHelpers', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('reads who can submit and who can add log rows', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ canSubmit: true, canManageLog: false }),
    });
    await expect(fetchFeatureAccess()).resolves.toEqual({
      canSubmit: true,
      canManageLog: false,
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/feature-requests/access', {
      credentials: 'include',
    });
  });

  test('loads the log', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [{ feature_request_log_id: 1, description: 'Search' }] }),
    });
    await expect(fetchFeatureLog()).resolves.toEqual([
      { feature_request_log_id: 1, description: 'Search' },
    ]);
  });

  test('posts a request', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ emailed: true, request: { feature_request_id: 4 } }),
    });
    const body = [{ type: 'paragraph', children: [{ text: 'Dark mode' }] }];
    const files = [{ file_name: 'shot.png', storage_key: 'feature-requests/abc.png' }];
    await expect(submitFeatureRequest({ body, files })).resolves.toEqual({
      emailed: true,
      request: { feature_request_id: 4 },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/feature-requests',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ body, files }),
      })
    );
  });

  test('throws the server error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Not allowed' }),
    });
    await expect(fetchFeatureLog()).rejects.toMatchObject({ message: 'Not allowed', status: 403 });
  });

  test('uploads through the app when storage has no signed url', async () => {
    const file = new File(['a'], 'a.txt', { type: 'text/plain' });
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ direct: false }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ file: { file_name: 'a.txt' } }),
      });
    await expect(uploadFeatureFile(file)).resolves.toEqual({ file_name: 'a.txt' });
    expect(global.fetch.mock.calls[1][0]).toBe('/api/feature-requests/files');
    expect(global.fetch.mock.calls[1][1].body).toBeInstanceOf(FormData);
  });

  test('uploads a large file straight to storage', async () => {
    const file = new File(['a'], 'big.bin', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'size', { value: 900 * 1024 * 1024 });
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          direct: true,
          uploadUrl: 'https://storage.example/upload',
          objectName: 'feature-requests/11111111-1111-4111-8111-111111111111.bin',
          contentType: 'application/octet-stream',
        }),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ file: { file_name: 'big.bin' } }),
      });
    await expect(uploadFeatureFile(file)).resolves.toEqual({ file_name: 'big.bin' });
    const sessionBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(sessionBody.size).toBe(900 * 1024 * 1024);
    expect(global.fetch.mock.calls[1][0]).toBe('https://storage.example/upload');
    expect(global.fetch.mock.calls[1][1].method).toBe('PUT');
  });

  test('adds a log row', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        entry: { feature_request_log_id: 2, description: 'Offline maps', status: 'not_started' },
      }),
    });
    await expect(
      addFeatureLogEntry({
        description: 'Offline maps',
        releaseDate: '2026-12-01',
        status: 'not_started',
      })
    ).resolves.toMatchObject({ description: 'Offline maps' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/feature-requests/log',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
