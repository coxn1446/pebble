import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdvancedSearchModal from '../components/Map/AdvancedSearchModal';
import MapFeedPanel from '../components/Map/MapFeedPanel';
import MapPinPreview from '../components/Map/MapPinPreview';
import { CollapseIcon, ExpandIcon, RecenterIcon } from '../components/Icons/Icons';
import PebbleMap from '../components/Map/PebbleMap';
import { filterPinsByViewport } from '../helpers/mapHelpers';
import { fetchFeed, fetchPebble, searchPebbles } from '../helpers/pebbleHelpers';
import { fetchMapUsers } from '../helpers/userHelpers';
import { fetchFields } from '../helpers/taxonomyHelpers';

const emptyFilters = {
  q: '',
  fieldId: '',
  author: '',
  region: '',
  favorites: false,
  hasPhoto: false,
  hasVideo: false,
  hasData: false,
};

const isMappable = (p) => p?.place_lat != null && p?.place_lng != null;

const isWorldSearch = (nextFilters) =>
  Boolean(
    String(nextFilters?.q || '').trim() ||
      nextFilters?.fieldId ||
      String(nextFilters?.author || '').trim() ||
      String(nextFilters?.region || '').trim() ||
      nextFilters?.favorites ||
      nextFilters?.hasPhoto ||
      nextFilters?.hasVideo ||
      nextFilters?.hasData
  );

const focusFromPins = (pins) => {
  const lat = pins.reduce((sum, pin) => sum + Number(pin.place_lat), 0) / pins.length;
  const lng = pins.reduce((sum, pin) => sum + Number(pin.place_lng), 0) / pins.length;
  return { lat, lng, pins, nonce: Date.now() };
};

const Map = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusPebbleId = searchParams.get('pebble');
  const openedOnMine = searchParams.get('mine') === '1';
  const [feedPebbles, setFeedPebbles] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [queryDraft, setQueryDraft] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewportBounds, setViewportBounds] = useState(null);
  const [fields, setFields] = useState([]);
  const [mapFocus, setMapFocus] = useState(null);
  const [scope, setScope] = useState(openedOnMine ? 'mine' : 'everyone');
  const [expanded, setExpanded] = useState(Boolean(focusPebbleId));
  const [resetSignal, setResetSignal] = useState(0);
  const [preview, setPreview] = useState(null);
  const [unpinnedCount, setUnpinnedCount] = useState(0);
  const [worldSearch, setWorldSearch] = useState(false);

  useEffect(() => {
    fetchFields()
      .then(setFields)
      .catch(() => setFields([]));
  }, []);

  const loadData = async (nextFilters = filters, nextScope = scope) => {
    setLoading(true);
    setError(null);
    try {
      const requestFilters = {
        ...nextFilters,
        mine: nextScope === 'mine',
      };
      const hasFilters = Boolean(
        requestFilters.q ||
          requestFilters.fieldId ||
          requestFilters.author ||
          requestFilters.region ||
          requestFilters.favorites ||
          requestFilters.mine ||
          requestFilters.hasPhoto ||
          requestFilters.hasVideo ||
          requestFilters.hasData
      );
      const [enriched, userRows] = await Promise.all([
        hasFilters ? searchPebbles(requestFilters) : fetchFeed(),
        nextScope === 'mine' ? Promise.resolve([]) : fetchMapUsers(nextFilters),
      ]);

      const pinned = enriched.filter(isMappable);
      const searching = isWorldSearch(requestFilters);
      setWorldSearch(searching);
      setUnpinnedCount(enriched.length - pinned.length);
      setFeedPebbles(pinned);
      setUsers(
        userRows.map((user) => ({
          ...user,
          pin_type: 'user',
          title: user.display_name || user.username,
        }))
      );
      if (searching && pinned.length) {
        setMapFocus(focusFromPins(pinned));
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message || 'Failed to load map pins');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(emptyFilters, openedOnMine ? 'mine' : 'everyone');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!focusPebbleId) return undefined;
    let active = true;
    fetchPebble(focusPebbleId)
      .then((pebble) => {
        if (!active || !pebble) return;
        setPreview(pebble);
        setExpanded(true);
        const lat = Number(pebble.place_lat);
        const lng = Number(pebble.place_lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setMapFocus({ lat, lng, nonce: Date.now() });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [focusPebbleId]);

  const applyFilters = async (next) => {
    setFilters(next);
    setQueryDraft('');
    setShowAdvanced(false);
    await loadData(next);
  };

  const handleSelectSuggestion = async (suggestion) => {
    if (!suggestion) return;
    if (suggestion.type === 'user') {
      await applyFilters({ ...emptyFilters, author: suggestion.username || suggestion.value });
      return;
    }
    if (suggestion.type === 'place') {
      const framed = await applyFilters({ ...emptyFilters, region: suggestion.value });
      const lat = Number(suggestion.place_lat);
      const lng = Number(suggestion.place_lng);
      if (!framed && Number.isFinite(lat) && Number.isFinite(lng)) {
        setMapFocus({ lat, lng, nonce: Date.now() });
      }
    }
  };

  const handleRemoveFilterChip = async (key) => {
    const next = { ...filters };
    if (key === 'author') next.author = '';
    if (key === 'region') next.region = '';
    if (key === 'q') next.q = '';
    if (key === 'fieldId') next.fieldId = '';
    if (key === 'favorites') next.favorites = false;
    if (key === 'hasPhoto') next.hasPhoto = false;
    if (key === 'hasVideo') next.hasVideo = false;
    if (key === 'hasData') next.hasData = false;
    await applyFilters(next);
  };

  const handleScopeChange = async (nextScope) => {
    setScope(nextScope);
    setPreview(null);
    await loadData(filters, nextScope);
  };

  const filterChips = useMemo(() => {
    const chips = [];
    if (filters.author) {
      chips.push({ key: 'author', label: `@${filters.author}` });
    }
    if (filters.region) {
      chips.push({ key: 'region', label: filters.region });
    }
    if (filters.q) {
      chips.push({ key: 'q', label: `“${filters.q}”` });
    }
    if (filters.fieldId) {
      const field = fields.find((f) => String(f.field_id) === String(filters.fieldId));
      chips.push({ key: 'fieldId', label: field?.name || `Field ${filters.fieldId}` });
    }
    if (filters.favorites) {
      chips.push({ key: 'favorites', label: 'Community favorites' });
    }
    if (filters.hasPhoto) chips.push({ key: 'hasPhoto', label: 'Has photo' });
    if (filters.hasVideo) chips.push({ key: 'hasVideo', label: 'Has video' });
    if (filters.hasData) chips.push({ key: 'hasData', label: 'Has data' });
    return chips;
  }, [filters, fields]);

  const handleSelectGroup = (pins) => {
    const next = Array.isArray(pins) ? pins : [];
    if (next.length === 1 && next[0].pin_type === 'user') {
      navigate(`/u/${next[0].username}`);
      return;
    }
    if (next.length === 1 && next[0].pebble_id) {
      if (expanded) {
        setPreview(next[0]);
        return;
      }
      navigate(`/pebbles/${next[0].pebble_id}`);
    }
  };

  const mapItems = useMemo(
    () => [...feedPebbles.map((p) => ({ ...p, pin_type: 'pebble' })), ...users],
    [feedPebbles, users]
  );

  const visibleFeed = useMemo(() => {
    if (worldSearch) return feedPebbles;
    return viewportBounds ? filterPinsByViewport(feedPebbles, viewportBounds) : feedPebbles;
  }, [feedPebbles, viewportBounds, worldSearch]);

  const emptyMessage =
    worldSearch && feedPebbles.length === 0 && unpinnedCount === 0
      ? 'Nothing matched.'
      : feedPebbles.length === 0 && unpinnedCount > 0
        ? 'Nothing in this view is pinned to the map.'
        : 'No pebbles in this view.';

  // Map pins stay unfiltered by viewport — filtering the globe on every pan
  // force-resyncs markers and makes merge/unmerge flicker.

  return (
    <section className="flex min-h-0 flex-1 flex-col animate-fade-up">
      {error ? (
        <div className="mb-3 rounded-2xl border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted">
          {error}
        </div>
      ) : null}

      <div
        data-testid="map-layout"
        data-layout={expanded ? 'expanded' : 'split'}
        className={`grid min-h-0 flex-1 grid-cols-1 gap-4 ${expanded ? '' : 'md:grid-cols-2'}`}
      >
        {expanded ? null : (
          <div className="min-h-0 min-w-0">
            <MapFeedPanel
              queryDraft={queryDraft}
              onQueryChange={setQueryDraft}
              onSearchSubmit={(q) =>
                applyFilters({ ...filters, q: String(q || '').trim() })
              }
              onSelectSuggestion={handleSelectSuggestion}
              onOpenAdvanced={() => setShowAdvanced(true)}
              filterChips={filterChips}
              onRemoveFilterChip={handleRemoveFilterChip}
              feedPebbles={visibleFeed}
              feedLoading={loading}
              emptyMessage={emptyMessage}
              caption={worldSearch ? 'Matches' : 'In this view, newest first'}
              scope={scope}
              onScopeChange={handleScopeChange}
            />
          </div>
        )}

        <div className="relative min-h-0 min-w-0">
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              type="button"
              aria-label={expanded ? 'Restore split' : 'Expand map'}
              onClick={() => {
                setExpanded((open) => !open);
                setPreview(null);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-ink"
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
            <button
              type="button"
              aria-label="Recenter map"
              onClick={() => setResetSignal((n) => n + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-ink"
            >
              <RecenterIcon />
            </button>
          </div>
          {loading && mapItems.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-sm text-muted">
              Loading map…
            </div>
          ) : (
            <PebbleMap
              pebbles={mapItems}
              onSelectGroup={handleSelectGroup}
              onViewportChange={setViewportBounds}
              focusTarget={mapFocus}
              splitLayout={!expanded}
              resetSignal={resetSignal}
            />
          )}
          {expanded && preview ? (
            <MapPinPreview pebble={preview} onClose={() => setPreview(null)} />
          ) : null}
        </div>
      </div>

      <AdvancedSearchModal
        open={showAdvanced}
        filters={filters}
        onClose={() => setShowAdvanced(false)}
        onApply={applyFilters}
      />
    </section>
  );
};

export default Map;
