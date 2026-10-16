import React from 'react';
import { MapIcon } from '../Icons/Icons';
import PebbleCard from '../Pebbles/PebbleCard';
import MapSearchInput from './MapSearchInput';

export const MapFilterChips = ({ filterChips = [], onRemoveFilterChip }) => {
  if (!filterChips.length) return null;
  return (
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
  );
};

const ScopeToggle = ({ scope, onScopeChange }) => (
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
);

const FeedList = ({ feedPebbles, feedLoading, emptyMessage }) => (
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
);

/**
 * Desktop: left half of the map route (title, search, chips, viewport feed).
 * Phone: a sheet above the tab bar. Peek shows the caption; open shows the list.
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
  emptyMessage = 'No pebbles yet.',
  caption = 'Newest',
  scope = 'everyone',
  onScopeChange,
  variant = 'panel',
  sheetOpen = false,
  onToggleSheet,
}) => {
  if (variant === 'sheet') {
    return (
      <div
        data-testid="map-feed-panel"
        data-sheet={sheetOpen ? 'open' : 'peek'}
        className={`flex min-h-0 shrink-0 flex-col overflow-hidden rounded-t-2xl border border-border bg-surface ${
          sheetOpen ? 'flex-1' : ''
        }`}
      >
        <button
          type="button"
          aria-label={sheetOpen ? 'Collapse feed' : 'Expand feed'}
          onClick={onToggleSheet}
          className="flex w-full flex-col items-center gap-2 px-4 py-2"
        >
          <span className="h-1 w-10 rounded-full bg-pebble" aria-hidden="true" />
          {sheetOpen ? null : <span className="text-sm text-muted">{caption}</span>}
        </button>
        {sheetOpen ? (
          <>
            <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 pb-3">
              <p className="text-sm text-muted">{caption}</p>
              <div className="flex flex-wrap items-center gap-2">
                <ScopeToggle scope={scope} onScopeChange={onScopeChange} />
              </div>
            </div>
            <FeedList
              feedPebbles={feedPebbles}
              feedLoading={feedLoading}
              emptyMessage={emptyMessage}
            />
          </>
        ) : null}
      </div>
    );
  }

  return (
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
          <ScopeToggle scope={scope} onScopeChange={onScopeChange} />
        </div>
        <MapSearchInput
          value={queryDraft}
          onChange={onQueryChange}
          onSubmit={onSearchSubmit}
          onSelectSuggestion={onSelectSuggestion}
          onOpenAdvanced={onOpenAdvanced}
        />
        <MapFilterChips filterChips={filterChips} onRemoveFilterChip={onRemoveFilterChip} />
      </div>

      <FeedList feedPebbles={feedPebbles} feedLoading={feedLoading} emptyMessage={emptyMessage} />
    </div>
  );
};

export default MapFeedPanel;
