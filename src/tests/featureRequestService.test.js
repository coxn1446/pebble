jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

jest.mock('../../server/helpers/email', () => ({
  sendEmail: jest.fn(async () => ({ skipped: false })),
}));

jest.mock('../../server/config/storage', () => ({
  getStorage: jest.fn(() => null),
  getBucketName: jest.fn(() => null),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
}));

const { isDbHealthy, query, withTransaction } = require('../../server/db');
const { sendEmail } = require('../../server/helpers/email');
const featureRequestService = require('../../server/services/featureRequestService');

const body = [{ type: 'paragraph', children: [{ text: 'Add dark mode', bold: true }] }];
const storedFile = {
  file_url: '/uploads/11111111-1111-4111-8111-111111111111.pdf',
  file_name: 'notes.pdf',
  content_type: 'application/pdf',
  storage_key: 'feature-requests/11111111-1111-4111-8111-111111111111.pdf',
};

describe('featureRequestService', () => {
  const previousSchema = process.env.DB_SCHEMA;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DB_SCHEMA;
    isDbHealthy.mockReturnValue(true);
    withTransaction.mockImplementation(async (fn) => fn({ query }));
    query.mockImplementation(async (sql) => {
      const text = String(sql);
      if (text.includes('INSERT INTO feature_requests')) {
        return { rows: [{ feature_request_id: 4, author_id: 18 }] };
      }
      if (text.includes('INSERT INTO feature_request_log')) {
        return {
          rows: [
            {
              feature_request_log_id: 2,
              description: 'Offline maps',
              release_date: '2026-12-01',
              status: 'wip',
              created_by: 18,
            },
          ],
        };
      }
      if (text.includes('FROM feature_request_log')) {
        return {
          rows: [
            {
              feature_request_log_id: 1,
              description: 'Search',
              release_date: null,
              status: 'not_started',
            },
          ],
        };
      }
      return { rows: [] };
    });
    sendEmail.mockResolvedValue({ skipped: false });
  });

  afterEach(() => {
    if (previousSchema === undefined) delete process.env.DB_SCHEMA;
    else process.env.DB_SCHEMA = previousSchema;
  });

  test('lets development users 18 and 2 submit, and only 18 add log rows', () => {
    expect(featureRequestService.accessFor(18)).toEqual({ canSubmit: true, canManageLog: true });
    expect(featureRequestService.accessFor(2)).toEqual({ canSubmit: true, canManageLog: false });
    expect(featureRequestService.accessFor(1)).toEqual({ canSubmit: false, canManageLog: false });
  });

  test('lets production users 1 and 2 submit, and only 1 add log rows', () => {
    process.env.DB_SCHEMA = 'prod';
    expect(featureRequestService.accessFor(1)).toEqual({ canSubmit: true, canManageLog: true });
    expect(featureRequestService.accessFor(2)).toEqual({ canSubmit: true, canManageLog: false });
    expect(featureRequestService.accessFor(18)).toEqual({ canSubmit: false, canManageLog: false });
  });

  test('stores the request and emails the text with the file', async () => {
    const result = await featureRequestService.submit(
      { user_id: 18, username: 'will', email: 'will@example.com' },
      { body, files: [storedFile] }
    );
    expect(result.emailed).toBe(true);
    expect(result.request.feature_request_id).toBe(4);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO feature_requests'),
      [18, JSON.stringify(body)]
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO feature_request_files'),
      [
        4,
        storedFile.file_url,
        storedFile.file_name,
        storedFile.content_type,
        storedFile.storage_key,
      ]
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'williamwildernash@gmail.com',
        subject: 'Feature request from will',
        text: expect.stringContaining('Add dark mode'),
        html: expect.stringContaining('<strong>Add dark mode</strong>'),
        attachments: [
          expect.objectContaining({
            filename: 'notes.pdf',
            path: expect.stringContaining('11111111-1111-4111-8111-111111111111.pdf'),
          }),
        ],
      })
    );
  });

  test('retries the email without attachments when the files cannot be mailed', async () => {
    sendEmail
      .mockResolvedValueOnce({ skipped: true, error: true })
      .mockResolvedValueOnce({ skipped: false });
    const result = await featureRequestService.submit(
      { user_id: 2, username: 'ada', email: 'ada@example.com' },
      { body, files: [storedFile] }
    );
    expect(result.emailed).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[1][0].attachments).toBeUndefined();
    expect(sendEmail.mock.calls[1][0].text).toContain('notes.pdf');
  });

  test('reports when email is not configured', async () => {
    sendEmail.mockResolvedValue({ skipped: true });
    const result = await featureRequestService.submit(
      { user_id: 18, username: 'will', email: 'will@example.com' },
      { body, files: [] }
    );
    expect(result.emailed).toBe(false);
  });

  test('rejects an empty request and a request from someone else', async () => {
    await expect(
      featureRequestService.submit(
        { user_id: 18, username: 'will' },
        { body: [{ type: 'paragraph', children: [{ text: '   ' }] }], files: [] }
      )
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      featureRequestService.submit({ user_id: 1, username: 'other' }, { body, files: [] })
    ).rejects.toMatchObject({ status: 403, message: 'Not allowed' });
  });

  test('rejects a file that was not stored for a feature request', async () => {
    await expect(
      featureRequestService.submit(
        { user_id: 18, username: 'will' },
        { body, files: [{ ...storedFile, storage_key: 'pebbles/nope.pdf' }] }
      )
    ).rejects.toMatchObject({ status: 400, message: 'Files are invalid' });
  });

  test('lists the log for a submitter and blocks everyone else', async () => {
    await expect(featureRequestService.listLog(2)).resolves.toEqual([
      expect.objectContaining({ description: 'Search', status: 'not_started' }),
    ]);
    await expect(featureRequestService.listLog(1)).rejects.toMatchObject({ status: 403 });
  });

  test('adds a log row only for the development manager', async () => {
    await expect(featureRequestService.addLogEntry(2, { description: 'Nope' })).rejects.toMatchObject({
      status: 403,
    });
    const entry = await featureRequestService.addLogEntry(18, {
      description: '  Offline maps  ',
      releaseDate: '2026-12-01',
      status: 'wip',
    });
    expect(entry.status).toBe('wip');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO feature_request_log'), [
      'Offline maps',
      '2026-12-01',
      'wip',
      18,
    ]);
  });

  test('rejects a bad status, a bad release date, and a missing description', async () => {
    await expect(
      featureRequestService.addLogEntry(18, { description: 'Maps', status: 'done' })
    ).rejects.toMatchObject({ status: 400, message: 'Invalid status' });
    await expect(
      featureRequestService.addLogEntry(18, { description: 'Maps', releaseDate: '2026-13-01' })
    ).rejects.toMatchObject({ status: 400, message: 'Invalid release date' });
    await expect(featureRequestService.addLogEntry(18, { description: '   ' })).rejects.toMatchObject({
      status: 400,
      message: 'Description is required',
    });
  });

  test('in production only user 1 can add a log row', async () => {
    process.env.DB_SCHEMA = 'prod';
    await expect(
      featureRequestService.addLogEntry(18, { description: 'Maps' })
    ).rejects.toMatchObject({ status: 403 });
    await expect(featureRequestService.addLogEntry(1, { description: 'Maps' })).resolves.toMatchObject({
      description: 'Offline maps',
    });
  });

  test('fails when the database is down', async () => {
    isDbHealthy.mockReturnValue(false);
    await expect(featureRequestService.listLog(18)).rejects.toMatchObject({ status: 503 });
  });
});
