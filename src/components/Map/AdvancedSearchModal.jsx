import React, { useEffect, useState } from 'react';
import Modal from '../Modal/Modal';
import { fieldIconForName } from '../Icons/Icons';
import { fetchFields } from '../../helpers/taxonomyHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent';

const AdvancedSearchModal = ({ open, filters, onApply, onClose }) => {
  const [fields, setFields] = useState([]);
  const [draft, setDraft] = useState({
    q: '',
    fieldId: '',
    author: '',
    region: '',
    ...filters,
  });

  useEffect(() => {
    if (!open) return;
    setDraft({
      q: filters?.q || '',
      fieldId: filters?.fieldId || '',
      author: filters?.author || '',
      region: filters?.region || '',
    });
  }, [open, filters]);

  useEffect(() => {
    fetchFields()
      .then(setFields)
      .catch(() => setFields([]));
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Advanced search"
      testId="advanced-search-modal"
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
            type="button"
            onClick={() =>
              onApply?.({
                q: draft.q.trim(),
                fieldId: draft.fieldId || '',
                author: draft.author.trim(),
                region: draft.region.trim(),
              })
            }
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover"
          >
            Apply filters
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">Narrow map results by text, field, author, or region.</p>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Query</span>
        <input
          value={draft.q}
          onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          className={inputClass}
          placeholder="Keywords"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Field</span>
        <select
          value={draft.fieldId}
          onChange={(e) => setDraft({ ...draft, fieldId: e.target.value })}
          className={inputClass}
        >
          <option value="">Any field</option>
          {fields.map((field) => {
            const Icon = fieldIconForName(field.name);
            return (
              <option key={field.field_id} value={field.field_id}>
                {field.name}
              </option>
            );
          })}
        </select>
        {draft.fieldId ? (
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
            {(() => {
              const selected = fields.find((f) => String(f.field_id) === String(draft.fieldId));
              const Icon = fieldIconForName(selected?.name);
              return (
                <>
                  <Icon className="h-3.5 w-3.5" />
                  {selected?.name}
                </>
              );
            })()}
          </span>
        ) : null}
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Author</span>
        <input
          value={draft.author}
          onChange={(e) => setDraft({ ...draft, author: e.target.value })}
          className={inputClass}
          placeholder="Username or display name"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Region</span>
        <input
          value={draft.region}
          onChange={(e) => setDraft({ ...draft, region: e.target.value })}
          className={inputClass}
          placeholder="City, state, or country"
        />
      </label>
    </Modal>
  );
};

export default AdvancedSearchModal;
