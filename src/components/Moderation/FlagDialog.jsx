import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createFlag } from '../../helpers/moderationHelpers';
import Modal from '../Modal/Modal';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent';

const FlagDialog = ({ targetType, targetId, onClose }) => {
  const [reason, setReason] = useState('Offensive content');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createFlag({ targetType, targetId, reason, details });
      toast.success('Report submitted for review');
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      as="form"
      onSubmit={submit}
      onClose={onClose}
      title="Report"
      testId="flag-dialog"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Submit report'}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Reports are reviewed for content that may violate community guidelines.
      </p>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Reason</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
        >
          <option>Offensive content</option>
          <option>Harassment</option>
          <option>Spam</option>
          <option>Misinformation</option>
          <option>Other</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Details</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </label>
    </Modal>
  );
};

export default FlagDialog;
