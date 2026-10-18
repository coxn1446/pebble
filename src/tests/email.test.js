jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

const fs = require('fs');
const { Resend } = require('resend');
const { isEmailConfigured, sendEmail } = require('../../server/helpers/email');

describe('email helper', () => {
  const previous = {};

  beforeEach(() => {
    jest.clearAllMocks();
    previous.RESEND_API_KEY = process.env.RESEND_API_KEY;
    previous.RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (previous.RESEND_API_KEY === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previous.RESEND_API_KEY;
    if (previous.RESEND_FROM_EMAIL === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = previous.RESEND_FROM_EMAIL;
    console.warn.mockRestore?.();
    console.error.mockRestore?.();
    jest.restoreAllMocks();
  });

  test('skips when RESEND_API_KEY or RESEND_FROM_EMAIL is missing', async () => {
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = 're_test';
    expect(isEmailConfigured()).toBe(false);
    await expect(
      sendEmail({ to: 'williamwildernash@gmail.com', subject: 'Hello', text: 'Hi' })
    ).resolves.toEqual({ skipped: true });
    expect(Resend).not.toHaveBeenCalled();
  });

  test('sends through Resend and attaches a local file as a buffer', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM_EMAIL = 'Pebble <notes@example.com>';
    const send = jest.fn().mockResolvedValue({ data: { id: 'email_1' }, error: null });
    Resend.mockImplementation(() => ({ emails: { send } }));
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('pdf-bytes'));

    await expect(
      sendEmail({
        to: 'williamwildernash@gmail.com',
        subject: 'Feature request',
        text: 'Hi',
        html: '<p>Hi</p>',
        attachments: [{ filename: 'notes.pdf', path: '/tmp/notes.pdf', contentType: 'application/pdf' }],
      })
    ).resolves.toEqual({ skipped: false, id: 'email_1' });

    expect(Resend).toHaveBeenCalledWith('re_test');
    expect(send).toHaveBeenCalledWith({
      from: 'Pebble <notes@example.com>',
      to: ['williamwildernash@gmail.com'],
      subject: 'Feature request',
      text: 'Hi',
      html: '<p>Hi</p>',
      attachments: [
        {
          filename: 'notes.pdf',
          content: Buffer.from('pdf-bytes'),
          contentType: 'application/pdf',
        },
      ],
    });
  });

  test('does not throw when Resend returns an error', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM_EMAIL = 'Pebble <notes@example.com>';
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ data: null, error: { message: 'domain not verified' } }),
      },
    }));
    await expect(
      sendEmail({ to: 'williamwildernash@gmail.com', subject: 'Hello', text: 'Hi' })
    ).resolves.toEqual({ skipped: true, error: true });
  });

  test('does not throw when the client throws', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM_EMAIL = 'Pebble <notes@example.com>';
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockRejectedValue(new Error('network')),
      },
    }));
    await expect(
      sendEmail({ to: 'williamwildernash@gmail.com', subject: 'Hello', text: 'Hi' })
    ).resolves.toEqual({ skipped: true, error: true });
  });
});
