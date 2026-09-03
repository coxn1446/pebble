import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdvancedSearchModal from '../components/Map/AdvancedSearchModal';
import MapFeedPanel from '../components/Map/MapFeedPanel';
import PebbleMap from '../components/Map/PebbleMap';
import { filterPinsByViewport } from '../helpers/mapHelpers';
import { fetchFeed, searchPebbles } from '../helpers/pebbleHelpers';
import { fetchMapUsers } from '../helpers/userHelpers';
import { fetchFields } from '../helpers/taxonomyHelpers';

const emptyFilters = { q: '', fieldId: '', author: '', region: '' };

const isMappable = (p) => p?.place_lat != null && p?.place_lng != null;

const Map = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchFields()
      .then(setFields)
      .catch(() => setFields([]));
  }, []);

  const loadData = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const hasFilters = Boolean(
        nextFilters.q || nextFilters.fieldId || nextFilters.author || nextFilters.region
      );
      const [enriched, userRows] = await Promise.all([
        hasFilters ? searchPebbles(nextFilters) : fetchFeed(),
        fetchMapUsers(nextFilters),
      ]);

      // One filtered pebble set drives both the feed list and map pins.
      setFeedPebbles(enriched.filter(isMappable));
      setUsers(
        userRows.map((user) => ({
          ...user,
          pin_type: 'user',
          title: user.display_name || user.username,
        }))
      );
    } catch (err) {
      setError(err.message || 'Failed to load map pins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(emptyFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      await applyFilters({ ...emptyFilters, region: suggestion.value });
      const lat = Number(suggestion.place_lat);
      const lng = Number(suggestion.place_lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
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
    await applyFilters(next);
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
    return chips;
  }, [filters, fields]);

  const handleSelectGroup = (pins) => {
    const next = Array.isArray(pins) ? pins : [];
    if (next.length === 1 && next[0].pin_type === 'user') {
      navigate(`/u/${next[0].username}`);
      return;
    }
    if (next.length === 1 && next[0].pebble_id) {
      navigate(`/pebbles/${next[0].pebble_id}`);
    }
    // Multi-pin clusters only fly/zoom in PebbleMap — no group panel.
  };

  const mapItems = useMemo(
    () => [...feedPebbles.map((p) => ({ ...p, pin_type: 'pebble' })), ...users],
    [feedPebbles, users]
  );

  const visibleFeed = useMemo(
    () => (viewportBounds ? filterPinsByViewport(feedPebbles, viewportBounds) : feedPebbles),
    [feedPebbles, viewportBounds]
  );

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
        data-layout="split"
        className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2"
      >
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
          />
        </div>

        <div className="min-h-0 min-w-0">
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
              splitLayout
            />
          )}
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
