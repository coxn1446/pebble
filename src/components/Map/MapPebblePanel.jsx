import React from 'react';
import { Link } from 'react-router-dom';
import FieldNotesViewer from '../FieldNotes/FieldNotesViewer';

const groupHeading = (pins) => {
  if (!pins?.length) return 'Pebbles';
  if (pins.length === 1) return pins[0].title || 'Pebble';
  const placeNames = [...new Set(pins.map((p) => p.place_name).filter(Boolean))];
  if (placeNames.length === 1) {
    return `${pins.length} pebbles at ${placeNames[0]}`;
  }
  return `${pins.length} pebbles in this area`;
};

const MapPebblePanel = ({
  groupPins = [],
  pebble,
  loading,
  error,
  onClose,
  onSelectPebble,
  onBackToGroup,
}) => {
  const showList = groupPins.length > 1 && !pebble && !loading && !error;
  const showDetail = Boolean(pebble) && !loading;

  if (loading) {
    return (
      <aside
        data-testid="map-pebble-panel"
        className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface p-4"
      >
        <p className="text-sm text-muted">Loading pebble…</p>
      </aside>
    );
  }

  if (error) {
    return (
      <aside
        data-testid="map-pebble-panel"
        className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface p-4"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Close
          </button>
        </div>
        {groupPins.length > 1 ? (
          <button
            type="button"
            onClick={onBackToGroup}
            className="self-start text-sm font-medium text-accent hover:text-accent-hover"
          >
            Back to list
          </button>
        ) : null}
      </aside>
    );
  }

  if (showList) {
    return (
      <aside
        data-testid="map-pebble-panel"
        className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-4 animate-fade-up"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              {groupHeading(groupPins)}
            </h2>
            <p className="mt-1 text-sm text-muted">Select a pebble to learn more.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Close
          </button>
        </div>

        <ul className="space-y-2" data-testid="map-pebble-group-list">
          {groupPins.map((pin) => (
            <li key={pin.pebble_id}>
              <button
                type="button"
                onClick={() => onSelectPebble?.(pin)}
                className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-left transition hover:border-accent"
              >
                <p className="font-display text-sm font-semibold text-ink">{pin.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {pin.author_display_name || pin.author_username || 'Unknown'}
                  {pin.place_name ? ` · ${pin.place_name}` : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  if (!showDetail) {
    return (
      <aside
        data-testid="map-pebble-panel"
        className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface p-4"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-sm text-muted">Pebble not found.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
          >
            Close
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-testid="map-pebble-panel"
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-surface p-4 animate-fade-up"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {groupPins.length > 1 ? (
            <button
              type="button"
              onClick={onBackToGroup}
              className="mb-2 text-sm font-medium text-accent hover:text-accent-hover"
            >
              Back to list
            </button>
          ) : null}
          <h2 className="font-display text-xl font-semibold text-ink">{pebble.title}</h2>
          <p className="mt-1 text-sm text-muted">
            by{' '}
            <Link to={`/u/${pebble.author_username}`} className="text-accent hover:underline">
              {pebble.author_display_name || pebble.author_username}
            </Link>
            {pebble.place_name ? ` · ${pebble.place_name}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-2xl border border-border px-3 py-1.5 text-sm text-ink"
        >
          Close
        </button>
      </div>

      {pebble.description ? <p className="text-sm text-ink">{pebble.description}</p> : null}

      {pebble.phenomena?.length ? (
        <div className="flex flex-wrap gap-2">
          {pebble.phenomena.map((ph) => (
            <span
              key={ph.phenomenon_id}
              className="rounded-xl bg-background px-2 py-0.5 text-xs text-muted"
            >
              {ph.field_name ? `${ph.field_name}: ` : ''}
              {ph.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-background p-3">
        <h3 className="mb-2 text-sm font-medium text-muted">Field notes</h3>
        <FieldNotesViewer value={pebble.field_notes} />
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        <Link
          to={`/pebbles/${pebble.pebble_id}`}
          className="rounded-2xl bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Open pebble
        </Link>
        <p className="self-center text-xs text-muted">
          {pebble.like_count || 0} like{(pebble.like_count || 0) === 1 ? '' : 's'}
        </p>
      </div>
    </aside>
  );
};

export default MapPebblePanel;
