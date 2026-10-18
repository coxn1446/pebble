import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import FieldNotesEditor from '../FieldNotes/FieldNotesEditor';
import Modal from '../Modal/Modal';
import { EMPTY_FIELD_NOTES, countFieldNoteWords } from '../../helpers/fieldNotesHelpers';
import {
  addFeatureLogEntry,
  fetchFeatureLog,
  submitFeatureRequest,
  uploadFeatureFile,
} from '../../helpers/featureRequestHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'wip', label: 'WIP' },
  { value: 'completed', label: 'Completed' },
];

const statusLabel = (value) =>
  STATUS_OPTIONS.find((option) => option.value === value)?.label || value;

const FeatureRequestModal = ({ canManageLog = false, onClose }) => {
  const [tab, setTab] = useState('request');
  const [body, setBody] = useState(EMPTY_FIELD_NOTES);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState([]);
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [status, setStatus] = useState('not_started');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    fetchFeatureLog()
      .then((rows) => {
        if (active) setEntries(rows);
      })
      .catch((err) => {
        if (active) toast.error(err.message || 'Could not load requests');
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (countFieldNoteWords(body) === 0 && files.length === 0) {
      toast.error('Write a request or add a file');
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = [];
      for (const file of files) {
        uploaded.push(await uploadFeatureFile(file));
      }
      const result = await submitFeatureRequest({ body, files: uploaded });
      if (result.emailed) {
        toast.success('Request sent');
        onClose?.();
      } else {
        toast.error('Request saved, but the email could not be sent');
      }
    } catch (err) {
      toast.error(err.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const addEntry = async (event) => {
    event.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      toast.error('Description is required');
      return;
    }
    setAdding(true);
    try {
      const entry = await addFeatureLogEntry({
        description: trimmed,
        releaseDate: releaseDate || null,
        status,
      });
      setEntries((current) => [entry, ...current]);
      setDescription('');
      setReleaseDate('');
      setStatus('not_started');
    } catch (err) {
      toast.error(err.message || 'Could not add request');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      as="form"
      onSubmit={tab === 'request' ? submit : addEntry}
      onClose={onClose}
      title="Submit A Feature Request"
      testId="feature-request-modal"
      footer={
        tab === 'request' ? (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        ) : null
      }
    >
      <div role="tablist" aria-label="Feature request" className="mb-3 flex gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'request'}
          onClick={() => setTab('request')}
          className={`rounded-2xl px-3 py-1.5 text-sm ${
            tab === 'request' ? 'bg-accent text-white' : 'border border-border text-ink'
          }`}
        >
          Request
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'log'}
          onClick={() => setTab('log')}
          className={`rounded-2xl px-3 py-1.5 text-sm ${
            tab === 'log' ? 'bg-accent text-white' : 'border border-border text-ink'
          }`}
        >
          Log
        </button>
      </div>

      {tab === 'request' ? (
        <div className="flex flex-col gap-3">
          <FieldNotesEditor
            value={body}
            onChange={setBody}
            wordCap={null}
            placeholder="Describe the request"
          />
          <div className="flex flex-col gap-2">
            <label className="inline-flex w-fit cursor-pointer rounded-2xl border border-border px-3 py-1.5 text-sm text-ink">
              Add files
              <input
                type="file"
                multiple
                aria-label="Add files"
                className="sr-only"
                onChange={(event) => {
                  const picked = Array.from(event.target.files || []);
                  event.target.value = '';
                  if (picked.length) setFiles((current) => current.concat(picked));
                }}
              />
            </label>
            {files.length ? (
              <ul className="flex flex-col gap-1">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-border px-3 py-2 text-sm text-ink"
                  >
                    <span className="min-w-0 truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                      className="shrink-0 text-muted"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {canManageLog ? (
            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted">Release date</span>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(event) => setReleaseDate(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted">Status</span>
                <select
                  aria-label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={adding}
                className="w-fit rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {adding ? 'Adding…' : 'Add'}
              </button>
            </div>
          ) : null}
          {entries.length === 0 ? (
            <p className="text-sm text-ink">No requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 font-medium">Release date</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.feature_request_log_id} className="border-b border-border">
                      <td className="whitespace-pre-wrap break-words py-2 pr-3">{entry.description}</td>
                      <td className="py-2 pr-3">{entry.release_date || ''}</td>
                      <td className="py-2">{statusLabel(entry.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default FeatureRequestModal;
