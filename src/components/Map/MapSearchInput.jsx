import React, { useEffect, useRef, useState } from 'react';
import { FilterIcon } from '../Icons/Icons';
import { fetchSearchSuggestions } from '../../helpers/searchHelpers';

const MapSearchInput = ({
  value,
  onChange,
  onSubmit,
  onSelectSuggestion,
  onOpenAdvanced,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const term = String(value || '').trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    timerRef.current = window.setTimeout(() => {
      fetchSearchSuggestions(term)
        .then((rows) => {
          setSuggestions(rows);
          setOpen(true);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(false);
          onSubmit?.(value);
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => {
            if (suggestions.length) setOpen(true);
          }}
          placeholder="Search people or places"
          aria-label="Search people or places"
          aria-autocomplete="list"
          aria-expanded={open}
          className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="button"
          aria-label="Advanced search"
          title="Advanced search"
          onClick={onOpenAdvanced}
          className="rounded-2xl border border-border p-2.5 text-ink hover:border-pebble"
        >
          <FilterIcon className="h-4 w-4" />
        </button>
      </form>
      {open && (suggestions.length > 0 || loading) ? (
        <ul
          data-testid="map-search-suggestions"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-sm"
        >
          {loading && suggestions.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted">Searching…</li>
          ) : null}
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-background"
                onClick={() => {
                  setOpen(false);
                  onSelectSuggestion?.(item);
                }}
              >
                <span className="text-sm font-medium text-ink">{item.label}</span>
                <span className="text-xs text-muted">{item.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default MapSearchInput;
