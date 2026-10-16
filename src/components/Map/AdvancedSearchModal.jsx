import React, { useEffect, useState } from 'react';
import Modal from '../Modal/Modal';
import { fieldIconForName } from '../Icons/Icons';
import UserAvatar from '../Profile/UserAvatar';
import { fetchFields, fetchPhenomena } from '../../helpers/taxonomyHelpers';
import { fetchSearchSuggestions } from '../../helpers/searchHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none focus:border-accent';

const Typeahead = ({ label, type, value, onChange, onSelect, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const term = String(value || '').trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      fetchSearchSuggestions(term)
        .then((rows) => {
          if (!cancelled) setSuggestions(rows.filter((row) => row.type === type));
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, type]);

  const inputId = `advanced-${type}`;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm text-muted">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={inputClass}
      />
      {open && (loading || suggestions.length > 0) ? (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-border bg-background p-1">
          {loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted">Searching…</li>
          ) : null}
          {suggestions.map((item) => {
            const Icon =
              type === 'user' ? null : fieldIconForName(item.field_name || item.label);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-background"
                  onClick={() => {
                    setOpen(false);
                    onSelect(item);
                  }}
                >
                  {type === 'user' ? (
                    <UserAvatar user={item} className="h-8 w-8 shrink-0" alt="" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
                    <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

const AdvancedSearchModal = ({ open, filters, onApply, onClose }) => {
  const [fields, setFields] = useState([]);
  const [phenomena, setPhenomena] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [draft, setDraft] = useState({
    q: '',
    fieldId: '',
    fieldQuery: '',
    phenomenonId: '',
    phenomenonQuery: '',
    author: '',
    region: '',
    notes: [],
    favorites: false,
    hasPhoto: false,
    hasVideo: false,
    hasData: false,
    ...filters,
  });

  useEffect(() => {
    if (!open) return;
    setNoteDraft('');
    const notes = []
      .concat(filters?.notes || [])
      .map((term) => String(term || '').trim())
      .filter(Boolean);
    setDraft({
      q: filters?.q || '',
      fieldId: filters?.fieldId || '',
      fieldQuery:
        fields.find((field) => String(field.field_id) === String(filters?.fieldId))?.name ||
        filters?.fieldQuery ||
        '',
      phenomenonId: filters?.phenomenonId || '',
      phenomenonQuery:
        phenomena.find((item) => String(item.phenomenon_id) === String(filters?.phenomenonId))
          ?.name ||
        filters?.phenomenonName ||
        '',
      author: filters?.author || '',
      region: filters?.region || '',
      notes,
      favorites: Boolean(filters?.favorites),
      hasPhoto: Boolean(filters?.hasPhoto),
      hasVideo: Boolean(filters?.hasVideo),
      hasData: Boolean(filters?.hasData),
    });
  }, [open, filters, fields, phenomena]);

  useEffect(() => {
    fetchFields()
      .then(setFields)
      .catch(() => setFields([]));
    fetchPhenomena()
      .then(setPhenomena)
      .catch(() => setPhenomena([]));
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
                q: filters?.q || '',
                fieldId: draft.fieldId || '',
                phenomenonId: draft.phenomenonId || '',
                phenomenonName: draft.phenomenonQuery || '',
                author: draft.author.trim(),
                region: draft.region.trim(),
                notes: []
                  .concat(draft.notes || [])
                  .map((term) => String(term || '').trim())
                  .filter(Boolean),
                favorites: Boolean(draft.favorites),
                hasPhoto: Boolean(draft.hasPhoto),
                hasVideo: Boolean(draft.hasVideo),
                hasData: Boolean(draft.hasData),
              })
            }
            className="rounded-2xl bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover"
          >
            Apply filters
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
      <Typeahead
        label="Field"
        type="field"
        value={draft.fieldQuery}
        onChange={(fieldQuery) => setDraft({ ...draft, fieldQuery, fieldId: '' })}
        onSelect={(item) =>
          setDraft({
            ...draft,
            fieldId: String(item.field_id),
            fieldQuery: item.label,
          })
        }
      />
      <Typeahead
        label="Topic"
        type="phenomenon"
        value={draft.phenomenonQuery}
        onChange={(phenomenonQuery) =>
          setDraft({ ...draft, phenomenonQuery, phenomenonId: '' })
        }
        onSelect={(item) =>
          setDraft({
            ...draft,
            phenomenonId: String(item.phenomenon_id),
            phenomenonQuery: item.label,
          })
        }
      />
      <div>
        <label className="mb-2 block text-sm text-muted" htmlFor="advanced-notes">
          Field notes
        </label>
        <input
          id="advanced-notes"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const term = noteDraft.trim();
            if (!term) return;
            const notes = []
              .concat(draft.notes || [])
              .map((item) => String(item || '').trim())
              .filter(Boolean);
            if (notes.some((item) => item.toLowerCase() === term.toLowerCase())) {
              setNoteDraft('');
              return;
            }
            setDraft({ ...draft, notes: [...notes, term] });
            setNoteDraft('');
          }}
          className={inputClass}
          placeholder="Words in field notes"
        />
        {[].concat(draft.notes || []).filter(Boolean).length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {[].concat(draft.notes || []).filter(Boolean).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    notes: draft.notes.filter((item) => item !== term),
                  })
                }
                className="rounded-xl bg-accent px-2 py-1 text-xs text-white"
              >
                {term} ×
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <Typeahead
        label="Author"
        type="user"
        value={draft.author}
        placeholder="Username or display name"
        onChange={(author) => setDraft({ ...draft, author })}
        onSelect={(item) =>
          setDraft({
            ...draft,
            author: item.username || item.value,
          })
        }
      />
      <label className="block" htmlFor="advanced-region">
        <span className="mb-2 block text-sm text-muted">Region</span>
        <input
          id="advanced-region"
          value={draft.region}
          onChange={(e) => setDraft({ ...draft, region: e.target.value })}
          className={inputClass}
          placeholder="City, state, or country"
        />
      </label>
      <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={Boolean(draft.favorites)}
          onChange={(e) => setDraft({ ...draft, favorites: e.target.checked })}
        />
        Community favorites
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={Boolean(draft.hasPhoto)}
          onChange={(e) => setDraft({ ...draft, hasPhoto: e.target.checked })}
        />
        Has photo
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={Boolean(draft.hasVideo)}
          onChange={(e) => setDraft({ ...draft, hasVideo: e.target.checked })}
        />
        Has video
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={Boolean(draft.hasData)}
          onChange={(e) => setDraft({ ...draft, hasData: e.target.checked })}
        />
        Has data
      </label>
      </div>
      </div>
    </Modal>
  );
};

export default AdvancedSearchModal;
