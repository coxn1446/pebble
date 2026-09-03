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
            <p className="text-sm text-muted">Explore pebbles near this view.</p>
          </div>
        </div>
        <Link
          to="/pebbles/new"
          className="rounded-2xl bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New pebble
        </Link>
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
        <p className="px-4 py-4 text-sm text-muted">
          No pebbles in this map view. Pan the globe or clear filters to see more.
        </p>
      ) : (
        feedPebbles.map((pebble) => (
          <PebbleCard key={pebble.pebble_id} pebble={pebble} />
        ))
      )}
    </div>
  </div>
);

export default MapFeedPanel;
