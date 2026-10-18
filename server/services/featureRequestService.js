const path = require('path');
const fs = require('fs');
const { isDbHealthy, query, withTransaction } = require('../db');
const { getStorage, getBucketName } = require('../config/storage');
const { sendEmail } = require('../helpers/email');
const { featureRequestQueries } = require('../queries');

const NOTIFY_TO = 'williamwildernash@gmail.com';
const STATUSES = new Set(['not_started', 'wip', 'completed']);
const FILE_KEY = /^feature-requests\/[0-9a-f-]{36}(\.[a-z0-9]+)?$/i;
const PROD_SUBMITTERS = new Set([1, 2]);
const DEV_SUBMITTERS = new Set([18, 2]);

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const isProductionData = () => String(process.env.DB_SCHEMA || '').trim() === 'prod';

const canSubmitFeatureRequest = (userId) => {
  const id = Number(userId);
  const allowed = isProductionData() ? PROD_SUBMITTERS : DEV_SUBMITTERS;
  return Number.isInteger(id) && allowed.has(id);
};

const canManageFeatureLog = (userId) => {
  const id = Number(userId);
  return Number.isInteger(id) && id === (isProductionData() ? 1 : 18);
};

const accessFor = (userId) => ({
  canSubmit: canSubmitFeatureRequest(userId),
  canManageLog: canManageFeatureLog(userId),
});

const assertCanSubmit = (userId) => {
  if (!canSubmitFeatureRequest(userId)) throw httpError(403, 'Not allowed');
};

const requireDb = () => {
  if (!isDbHealthy()) throw httpError(503, 'Database is unavailable');
};

const inlineText = (nodes) => {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return '';
      if (typeof node.text === 'string') return node.text;
      return inlineText(node.children);
    })
    .join('');
};

const blocksToLines = (nodes, lines = []) => {
  if (!Array.isArray(nodes)) return lines;
  nodes.forEach((node) => {
    if (!node || typeof node !== 'object' || typeof node.text === 'string') return;
    if (node.type === 'bulleted-list' || node.type === 'numbered-list') {
      blocksToLines(node.children, lines);
      return;
    }
    const text = inlineText(node.children).trim();
    if (!text) return;
    lines.push(node.type === 'list-item' ? `- ${text}` : text);
  });
  return lines;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const inlineHtml = (nodes) => {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return '';
      if (typeof node.text === 'string') {
        let text = escapeHtml(node.text);
        if (node.bold) text = `<strong>${text}</strong>`;
        if (node.italic) text = `<em>${text}</em>`;
        return text;
      }
      return inlineHtml(node.children);
    })
    .join('');
};

const blocksToHtml = (nodes) => {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object' || typeof node.text === 'string') return '';
      if (node.type === 'heading') return `<h2>${inlineHtml(node.children)}</h2>`;
      if (node.type === 'bulleted-list') {
        const items = (node.children || [])
          .map((item) => `<li>${inlineHtml(item.children)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      if (node.type === 'numbered-list') {
        const items = (node.children || [])
          .map((item) => `<li>${inlineHtml(item.children)}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }
      return `<p>${inlineHtml(node.children)}</p>`;
    })
    .join('');
};

const absoluteUrl = (fileUrl) => {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const origin = (process.env.DEFAULT_CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${origin}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
};

const normalizeFiles = (files) => {
  if (files == null) return [];
  if (!Array.isArray(files)) throw httpError(400, 'Files are invalid');
  return files.map((file) => {
    const storageKey = String(file?.storage_key || '');
    const fileName = path.basename(String(file?.file_name || '')).slice(0, 512);
    const fileUrl = String(file?.file_url || '');
    if (!FILE_KEY.test(storageKey) || !fileName || !fileUrl) {
      throw httpError(400, 'Files are invalid');
    }
    if (fileUrl.startsWith('/uploads/')) {
      if (path.basename(fileUrl) !== path.basename(storageKey)) {
        throw httpError(400, 'Files are invalid');
      }
    } else if (!fileUrl.endsWith(storageKey)) {
      throw httpError(400, 'Files are invalid');
    }
    return {
      storage_key: storageKey,
      file_name: fileName,
      file_url: fileUrl,
      content_type: String(file.content_type || 'application/octet-stream').slice(0, 255),
    };
  });
};

const attachmentFor = (file) => {
  const base = {
    filename: file.file_name,
    contentType: file.content_type || undefined,
  };
  if (String(file.file_url).startsWith('/uploads/')) {
    const diskPath = path.join(process.cwd(), 'uploads', path.basename(file.storage_key));
    if (!fs.existsSync(diskPath)) return null;
    return { ...base, path: diskPath };
  }
  const bucketName = getBucketName();
  const storage = getStorage();
  if (!bucketName || !storage) return null;
  return {
    ...base,
    content: storage.bucket(bucketName).file(file.storage_key).createReadStream(),
  };
};

const releaseDateOrNull = (value) => {
  if (value == null || value === '') return null;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw httpError(400, 'Invalid release date');
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw httpError(400, 'Invalid release date');
  }
  return text;
};

const statusOrDefault = (value) => {
  if (value == null || value === '') return 'not_started';
  if (!STATUSES.has(String(value))) throw httpError(400, 'Invalid status');
  return String(value);
};

const listLog = async (userId) => {
  requireDb();
  assertCanSubmit(userId);
  const { rows } = await query(featureRequestQueries.listLog);
  return rows;
};

const addLogEntry = async (userId, data) => {
  requireDb();
  if (!canManageFeatureLog(userId)) throw httpError(403, 'Not allowed');
  const description = String(data.description || '').trim();
  if (!description) throw httpError(400, 'Description is required');
  const { rows } = await query(featureRequestQueries.insertLog, [
    description,
    releaseDateOrNull(data.releaseDate),
    statusOrDefault(data.status),
    userId,
  ]);
  return rows[0];
};

const submit = async (user, data) => {
  requireDb();
  assertCanSubmit(user?.user_id);
  if (!Array.isArray(data?.body)) throw httpError(400, 'Write a request or add a file');
  const files = normalizeFiles(data.files);
  const text = blocksToLines(data.body).join('\n').trim();
  if (!text && files.length === 0) throw httpError(400, 'Write a request or add a file');

  const request = await withTransaction(async (client) => {
    const inserted = await client.query(featureRequestQueries.insertRequest, [
      user.user_id,
      JSON.stringify(data.body),
    ]);
    const row = inserted.rows[0];
    for (const file of files) {
      await client.query(featureRequestQueries.insertFile, [
        row.feature_request_id,
        file.file_url,
        file.file_name,
        file.content_type,
        file.storage_key,
      ]);
    }
    return row;
  });

  const who = user.username || user.display_name || `user ${user.user_id}`;
  const fileLines = files.map((file) => `${file.file_name} ${absoluteUrl(file.file_url)}`);
  const textBody = [
    `From ${who} (${user.email || 'no email'}), user ${user.user_id}`,
    '',
    text || '(no text)',
    '',
    fileLines.length ? `Files:\n${fileLines.join('\n')}` : 'Files: none',
  ].join('\n');
  const htmlBody = [
    `<p>From ${escapeHtml(who)} (${escapeHtml(user.email || 'no email')}), user ${user.user_id}</p>`,
    blocksToHtml(data.body) || '<p>(no text)</p>',
    fileLines.length
      ? `<ul>${files
          .map(
            (file) =>
              `<li><a href="${escapeHtml(absoluteUrl(file.file_url))}">${escapeHtml(file.file_name)}</a></li>`
          )
          .join('')}</ul>`
      : '<p>Files: none</p>',
  ].join('');

  const attachments = files.map(attachmentFor).filter(Boolean);
  const message = {
    to: NOTIFY_TO,
    subject: `Feature request from ${who}`,
    text: textBody,
    html: htmlBody,
  };
  let mailed = await sendEmail({ ...message, attachments });
  if (mailed?.error && attachments.length) {
    mailed = await sendEmail(message);
  }

  return {
    request,
    emailed: Boolean(mailed && !mailed.skipped && !mailed.error),
  };
};

module.exports = {
  NOTIFY_TO,
  accessFor,
  assertCanSubmit,
  canSubmitFeatureRequest,
  canManageFeatureLog,
  listLog,
  addLogEntry,
  submit,
};
