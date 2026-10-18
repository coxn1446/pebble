/**
 * Transactional email via Resend.
 * Skips when RESEND_API_KEY or RESEND_FROM_EMAIL is unset. Never throws.
 */
const fs = require('fs');
const { Resend } = require('resend');

const isEmailConfigured = () => {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  return Boolean(
    typeof key === 'string' &&
      key.trim() &&
      typeof from === 'string' &&
      from.trim()
  );
};

const readStream = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

/** Nodemailer-style attachments become Resend attachments. Local paths are read into buffers. */
const toResendAttachment = async (file) => {
  if (!file) return null;
  const filename = file.filename || 'file';
  const contentType = file.contentType || undefined;
  if (typeof file.path === 'string' && /^https?:\/\//i.test(file.path)) {
    return { filename, path: file.path, contentType };
  }
  if (typeof file.path === 'string') {
    const content = await fs.promises.readFile(file.path);
    return { filename, content, contentType };
  }
  if (Buffer.isBuffer(file.content) || typeof file.content === 'string') {
    return { filename, content: file.content, contentType };
  }
  if (file.content && typeof file.content[Symbol.asyncIterator] === 'function') {
    return { filename, content: await readStream(file.content), contentType };
  }
  return null;
};

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  if (!to || !subject) {
    return { skipped: true };
  }
  if (!isEmailConfigured()) {
    console.warn('Email not configured; skipping send.', { to, subject });
    return { skipped: true };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY.trim());
    const prepared = [];
    for (const file of Array.isArray(attachments) ? attachments : []) {
      const next = await toResendAttachment(file);
      if (next) prepared.push(next);
    }
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL.trim(),
      to: [to],
      subject,
      text: text || undefined,
      html: html || undefined,
      attachments: prepared.length ? prepared : undefined,
    });
    if (error) {
      console.error('Email send failed; continuing.', {
        to,
        subject,
        error: error.message || String(error),
      });
      return { skipped: true, error: true };
    }
    return { skipped: false, id: data?.id };
  } catch (err) {
    console.error('Email send failed; continuing.', {
      to,
      subject,
      error: err?.message || String(err),
    });
    return { skipped: true, error: true };
  }
};

module.exports = { isEmailConfigured, sendEmail };
