import React from 'react';
import { Link } from 'react-router-dom';
import { MapIcon } from '../Icons/Icons';
import PebbleCard from '../Pebbles/PebbleCard';
import MapSearchInput from './MapSearchInput';

/**
 * Left half of the desktop map route: title, search, filter chips, viewport feed.
 */
const MapFeedPanel = ({
  queryDraft,
  onQueryChange,
  onSearchSubmit,
  onSelectSuggestion,
  onOpenAdvanced,
  filterChips = [],
  onRemoveFilterChip,
  feedPebbles,
  feedLoading,
  emptyMessage = 'No pebbles in this view.',
  caption = 'In this view, newest first',
  scope = 'everyone',
  onScopeChange,
}) => (
  <div
    data-testid="map-feed-panel"
    className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface"
  >
    <div className="shrink-0 space-y-3 border-b border-border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-accent">
            <MapIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Map</h1>
            <p className="text-sm text-muted">{caption}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-2xl border border-border p-0.5" role="group" aria-label="Whose pebbles">
            <button
              type="button"
              aria-pressed={scope === 'everyone'}
              onClick={() => onScopeChange?.('everyone')}
              className={`rounded-2xl px-2.5 py-1.5 text-sm ${
                scope === 'everyone' ? 'bg-accent text-white' : 'text-ink'
              }`}
            >
              Everyone
            </button>
            <button
              type="button"
              aria-pressed={scope === 'mine'}
              onClick={() => onScopeChange?.('mine')}
              className={`rounded-2xl px-2.5 py-1.5 text-sm ${
                scope === 'mine' ? 'bg-accent text-white' : 'text-ink'
              }`}
            >
              Mine
            </button>
          </div>
          <Link
            to="/pebbles/new"
            className="rounded-2xl bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            New pebble
          </Link>
        </div>
      </div>
      <MapSearchInput
        value={queryDraft}
        onChange={onQueryChange}
        onSubmit={onSearchSubmit}
        onSelectSuggestion={onSelectSuggestion}
        onOpenAdvanced={onOpenAdvanced}
      />
      {filterChips.length ? (
        <div className="flex flex-wrap gap-2" data-testid="map-filter-chips">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onRemoveFilterChip?.(chip.key)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-2.5 py-1 text-xs text-ink hover:border-pebble"
              aria-label={`Remove filter ${chip.label}`}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true" className="text-muted">
                ×
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto" data-testid="map-feed-list">
      {feedLoading ? (
        <p className="px-4 py-4 text-sm text-muted">Loading…</p>
      ) : feedPebbles.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted">{emptyMessage}</p>
      ) : (
        feedPebbles.map((pebble) => (
          <PebbleCard key={pebble.pebble_id} pebble={pebble} />
        ))
      )}
    </div>
  </div>
);

export default MapFeedPanel;
