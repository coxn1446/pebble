import React, { useEffect, useRef, useState } from 'react';
import { createFieldGlyphElement, createPenguinAvatarElement } from '../Icons/Icons';
import { getDefaultAvatarPinClass } from '../../helpers/avatarHelpers';
import { fetchPlacesApiKey, loadGoogleMaps3dApi } from '../../helpers/placesHelpers';
import {
  clusterMapPins,
  CONTINENT_CAMERA_RANGE,
  GLOBE_CAMERA_RANGE,
  PLACE_CAMERA_RANGE,
  rangeForPins,
  viewportBoundsFromCamera,
} from '../../helpers/mapHelpers';

const GLOBE_CENTER = { lat: 20, lng: 0, altitude: 0 };
const FLY_DURATION_MS = 450;
const TRAVEL_MS = 280;
const SYNC_DEBOUNCE_MS = 180;
const POS_EPSILON = 1e-6;

const firstFieldName = (pin) => pin?.fields?.[0]?.name || pin?.phenomena?.[0]?.field_name || '';

const pinClassName = (item, animateIn = false) => {
  const isGroup = item.count > 1;
  const fieldName = firstFieldName(item.pins?.[0]);
  let kind = 'pebble-map-pin';
  if (isGroup) kind = 'pebble-map-pin pebble-map-pin--mixed';
  else if (item.pinKind === 'user') kind = 'pebble-map-pin pebble-map-pin--user pebble-map-pin--avatar';
  else if (fieldName) kind = 'pebble-map-pin pebble-map-pin--glyph';
  return `${kind}${animateIn ? ' pebble-map-pin--enter' : ''}`;
};

const paintPinElement = (button, item, animateIn = false) => {
  const isGroup = item.count > 1;
  const pin = item.pins?.[0];
  button.type = 'button';
  button.className = pinClassName(item, animateIn);
  button.replaceChildren();
  if (isGroup) {
    button.textContent = String(item.count);
    button.setAttribute('aria-label', String(item.count));
    return button;
  }
  if (item.pinKind === 'user') {
    const label = pin?.display_name || pin?.title || pin?.username || 'Person';
    button.setAttribute('aria-label', label);
    if (pin?.profile_pic_url) {
      const img = document.createElement('img');
      img.src = pin.profile_pic_url;
      img.alt = '';
      button.append(img);
      return button;
    }
    button.className = `${button.className} ${getDefaultAvatarPinClass(pin?.user_id)}`;
    button.append(createPenguinAvatarElement());
    return button;
  }
  const fieldName = firstFieldName(pin);
  if (fieldName) {
    button.setAttribute('aria-label', fieldName);
    const glyph = createFieldGlyphElement(fieldName);
    if (glyph) {
      button.append(glyph);
      return button;
    }
  }
  button.textContent = '•';
  button.setAttribute('aria-label', 'Pin');
  return button;
};

const createPinElement = (item, animateIn = false) => {
  const button = document.createElement('button');
  return paintPinElement(button, item, animateIn);
};

const readPosition = (marker) => {
  const pos = marker?.position;
  if (!pos) return null;
  const lat = typeof pos.lat === 'function' ? pos.lat() : Number(pos.lat);
  const lng = typeof pos.lng === 'function' ? pos.lng() : Number(pos.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const nearlySame = (a, b) =>
  a &&
  b &&
  Math.abs(a.lat - b.lat) < POS_EPSILON &&
  Math.abs(a.lng - b.lng) < POS_EPSILON;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const animateMarkerPosition = (marker, from, to, durationMs = TRAVEL_MS) =>
  new Promise((resolve) => {
    if (!marker || !from || !to) {
      resolve();
      return;
    }
    if (nearlySame(from, to)) {
      marker.position = { lat: to.lat, lng: to.lng, altitude: 0 };
      resolve();
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      marker.position = {
        lat: from.lat + (to.lat - from.lat) * eased,
        lng: from.lng + (to.lng - from.lng) * eased,
        altitude: 0,
      };
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

const pinIdsFromEntry = (entry) =>
  (entry?.pins || [])
    .map((pin) => (pin.pin_type === 'user' ? `user-${pin.user_id}` : `pebble-${pin.pebble_id}`))
    .filter(Boolean);

const singleClusterItem = (pin) => {
  const lat = Number(pin.place_lat);
  const lng = Number(pin.place_lng);
  const pinKind = pin.pin_type === 'user' ? 'user' : 'pebble';
  const id = pin.pin_type === 'user' ? `user-${pin.user_id}` : `pebble-${pin.pebble_id}`;
  return {
    type: 'pin',
    lat,
    lng,
    count: 1,
    pins: [pin],
    key: `pin-${id}`,
    pinKind,
  };
};

const pinSetSignature = (list) =>
  (Array.isArray(list) ? list : [])
    .map((p) => (p.pin_type === 'user' ? `u:${p.user_id}` : `p:${p.pebble_id}`))
    .filter((id) => !id.endsWith(':undefined') && !id.endsWith(':null'))
    .sort()
    .join('|');

const PebbleMap = ({
  pebbles = [],
  onSelectGroup,
  onViewportChange,
  focusTarget = null,
  splitLayout = false,
  resetSignal = 0,
}) => {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const userHomeRef = useRef(null);
  const markersByKeyRef = useRef(new Map());
  const maps3dRef = useRef(null);
  const pebblesRef = useRef(pebbles);
  const onSelectGroupRef = useRef(onSelectGroup);
  const onViewportChangeRef = useRef(onViewportChange);
  const syncTimerRef = useRef(null);
  const viewportTimerRef = useRef(null);
  const pendingWakeRef = useRef(null);
  const lastRangeBucketRef = useRef(null);
  const lastPinSignatureRef = useRef('');
  const syncMarkersRef = useRef(() => {});
  const syncGenRef = useRef(0);
  const animatingRef = useRef(false);
  const pendingSyncRef = useRef(false);
  const suppressSyncUntilRef = useRef(0);

  const [mapsReady, setMapsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [keyMissing, setKeyMissing] = useState(false);

  pebblesRef.current = pebbles;
  onSelectGroupRef.current = onSelectGroup;
  onViewportChangeRef.current = onViewportChange;

  const emitViewport = () => {
    const map = mapRef.current;
    if (!map || !onViewportChangeRef.current) return;
    const center = map.center || GLOBE_CENTER;
    const lat = typeof center.lat === 'function' ? center.lat() : Number(center.lat);
    const lng = typeof center.lng === 'function' ? center.lng() : Number(center.lng);
    const range = Number(map.range) || GLOBE_CAMERA_RANGE;
    onViewportChangeRef.current(
      viewportBoundsFromCamera({ lat, lng }, range)
    );
  };

  const removeMarker = (entry) => {
    if (!entry) return;
    const { marker, handler } = entry;
    if (handler && typeof marker.removeEventListener === 'function') {
      marker.removeEventListener('gmp-click', handler);
    }
    if (typeof marker.remove === 'function') {
      marker.remove();
    }
  };

  const clearMarkers = () => {
    markersByKeyRef.current.forEach((entry) => removeMarker(entry));
    markersByKeyRef.current = new Map();
  };

  const beginSuppress = (ms = FLY_DURATION_MS + TRAVEL_MS) => {
    suppressSyncUntilRef.current = Math.max(
      suppressSyncUntilRef.current,
      performance.now() + ms
    );
  };

  const flyCamera = (map, camera) => {
    if (!map) return;
    if (typeof map.flyCameraTo === 'function') {
      map.flyCameraTo({ endCamera: camera, durationMillis: FLY_DURATION_MS });
      return;
    }
    map.center = camera.center;
    map.range = camera.range;
    map.tilt = camera.tilt;
    map.heading = camera.heading;
  };

  useEffect(() => {
    if (!navigator.geolocation?.getCurrentPosition) return undefined;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const center = { lat, lng, altitude: 0 };
        userHomeRef.current = center;
        const map = mapRef.current;
        if (!map) return;
        beginSuppress(FLY_DURATION_MS + 80);
        flyCamera(map, { center, range: CONTINENT_CAMERA_RANGE, tilt: 0, heading: 0 });
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 }
    );
    return () => {
      cancelled = true;
    };
    // Ask once when the map mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schedulePendingWake = () => {
    if (pendingWakeRef.current) window.clearTimeout(pendingWakeRef.current);
    const delay = Math.max(0, suppressSyncUntilRef.current - performance.now()) + 16;
    pendingWakeRef.current = window.setTimeout(() => {
      pendingWakeRef.current = null;
      if (!pendingSyncRef.current) return;
      pendingSyncRef.current = false;
      lastRangeBucketRef.current = null;
      void syncMarkersRef.current(false);
    }, delay);
  };

  const flyToPins = (pins) => {
    const map = mapRef.current;
    if (!map || !pins?.length) return;

    const lat =
      pins.reduce((sum, pin) => sum + Number(pin.place_lat), 0) / pins.length;
    const lng =
      pins.reduce((sum, pin) => sum + Number(pin.place_lng), 0) / pins.length;
    const endCamera = {
      center: { lat, lng, altitude: 0 },
      range: rangeForPins(pins),
      tilt: pins.length > 1 ? 35 : 55,
      heading: 0,
    };

    if (typeof map.flyCameraTo === 'function') {
      map.flyCameraTo({
        endCamera,
        durationMillis: FLY_DURATION_MS,
      });
      return;
    }

    map.center = endCamera.center;
    map.range = endCamera.range;
    map.tilt = endCamera.tilt;
    map.heading = endCamera.heading;
  };

  const mountClusterMarker = (item, position, animateIn) => {
    const map = mapRef.current;
    const MarkerInteractiveElement = maps3dRef.current?.MarkerInteractiveElement;
    if (!map || typeof MarkerInteractiveElement !== 'function') return null;
    if (markersByKeyRef.current.has(item.key)) return markersByKeyRef.current.get(item.key).marker;

    const isGroup = item.count > 1;
    const marker = new MarkerInteractiveElement({
      position: { lat: position.lat, lng: position.lng, altitude: 0 },
    });
    marker.title = isGroup ? `${item.count} pins` : item.pins[0]?.title || 'Pin';
    const pinEl = createPinElement(item, animateIn);
    marker.append(pinEl);
    const onClick = (event) => {
      event?.stopPropagation?.();
      handleMarkerClick(item);
    };
    marker.addEventListener('gmp-click', onClick);
    map.append(marker);
    markersByKeyRef.current.set(item.key, {
      marker,
      handler: onClick,
      pinEl,
      pins: item.pins,
    });
    return marker;
  };

  const explodeCluster = async (item) => {
    const entry = markersByKeyRef.current.get(item.key);
    const from = readPosition(entry?.marker) || { lat: item.lat, lng: item.lng };

    // Drop the count badge immediately — don't wait for camera zoom / travel.
    if (entry) {
      removeMarker(entry);
      markersByKeyRef.current.delete(item.key);
    }

    // Suppress reclusters until the fly-in finishes, otherwise the old zoom
    // remounts the group on top of the traveling pins (classic flicker).
    beginSuppress(FLY_DURATION_MS + TRAVEL_MS + 80);
    animatingRef.current = true;
    syncGenRef.current += 1;
    const gen = syncGenRef.current;

    await Promise.all(
      item.pins.map(async (pin) => {
        const single = singleClusterItem(pin);
        if (markersByKeyRef.current.has(single.key)) return;
        const marker = mountClusterMarker(single, from, false);
        if (!marker) return;
        const target = { lat: single.lat, lng: single.lng };
        await animateMarkerPosition(marker, from, target);
      })
    );

    if (gen !== syncGenRef.current) return;
    animatingRef.current = false;
    lastRangeBucketRef.current = null;
    pendingSyncRef.current = true;
    schedulePendingWake();
  };

  const handleMarkerClick = (item) => {
    onSelectGroupRef.current?.(item.pins);
    if (item.count > 1) {
      void explodeCluster(item);
    }
    flyToPins(item.pins);
  };

  const pruneStaleMarkers = (nextKeys) => {
    for (const [key, entry] of [...markersByKeyRef.current.entries()]) {
      if (!nextKeys.has(key)) {
        removeMarker(entry);
        markersByKeyRef.current.delete(key);
      }
    }
  };

  const syncMarkers = async (force = false) => {
    const map = mapRef.current;
    const MarkerInteractiveElement = maps3dRef.current?.MarkerInteractiveElement;
    if (!map || typeof MarkerInteractiveElement !== 'function') return;

    if (animatingRef.current && !force) {
      pendingSyncRef.current = true;
      schedulePendingWake();
      return;
    }

    if (!force && performance.now() < suppressSyncUntilRef.current) {
      pendingSyncRef.current = true;
      schedulePendingWake();
      return;
    }

    const range = Number(map.range) || GLOBE_CAMERA_RANGE;
    const rangeBucket = Math.round(Math.log10(Math.max(range, 1)) * 20);

    if (
      !force &&
      lastRangeBucketRef.current === rangeBucket &&
      markersByKeyRef.current.size > 0
    ) {
      return;
    }

    const gen = ++syncGenRef.current;
    lastRangeBucketRef.current = rangeBucket;
    const clusters = clusterMapPins(pebblesRef.current, range);
    const nextKeys = new Set(clusters.map((item) => item.key));
    const previousEntries = [...markersByKeyRef.current.entries()];
    const priorPositionByPinId = new Map();
    previousEntries.forEach(([, entry]) => {
      const pos = readPosition(entry.marker);
      if (!pos) return;
      pinIdsFromEntry(entry).forEach((id) => priorPositionByPinId.set(id, pos));
    });

    const stable = clusters.filter((item) => markersByKeyRef.current.has(item.key));
    const incoming = clusters.filter((item) => !markersByKeyRef.current.has(item.key));
    const outgoing = previousEntries.filter(([key]) => !nextKeys.has(key));

    const mergeOutgoing = [];
    const mergeDestKeys = new Set();
    for (const [key, entry] of outgoing) {
      const entryIds = pinIdsFromEntry(entry);
      const destClusters = clusters.filter((item) =>
        entryIds.some((id) => pinIdsFromEntry({ pins: item.pins }).includes(id))
      );
      if (destClusters.length === 1) {
        mergeOutgoing.push([key, entry, destClusters[0]]);
        mergeDestKeys.add(destClusters[0].key);
      } else {
        // Split / disappear: remove the old marker immediately.
        removeMarker(entry);
        markersByKeyRef.current.delete(key);
      }
    }

    animatingRef.current = true;

    // Merges first: travel individuals into the absorb point, then drop them.
    // Mounting the group badge only afterward avoids double-markers / flicker.
    await Promise.all(
      mergeOutgoing.map(async ([key, entry, dest]) => {
        if (!markersByKeyRef.current.has(key)) return;
        const from = readPosition(entry.marker);
        if (dest && from) {
          await animateMarkerPosition(entry.marker, from, {
            lat: dest.lat,
            lng: dest.lng,
          });
        }
        if (gen !== syncGenRef.current) return;
        removeMarker(entry);
        markersByKeyRef.current.delete(key);
      })
    );

    if (gen !== syncGenRef.current) return;

    await Promise.all(
      incoming.map(async (item) => {
        const target = { lat: item.lat, lng: item.lng };
        if (mergeDestKeys.has(item.key)) {
          // Merge result: appear at the absorb point after travelers arrive.
          mountClusterMarker(item, target, true);
          return;
        }
        // Split / new pin: spawn at prior center and travel outward.
        const memberIds = pinIdsFromEntry({ pins: item.pins });
        const startPos =
          memberIds.map((id) => priorPositionByPinId.get(id)).find(Boolean) || null;
        const initial = startPos || target;
        const marker = mountClusterMarker(item, initial, !startPos);
        if (marker && startPos) {
          await animateMarkerPosition(marker, initial, target);
        }
      })
    );

    if (gen !== syncGenRef.current) return;

    await Promise.all(
      stable.map(async (item) => {
        const entry = markersByKeyRef.current.get(item.key);
        if (!entry) return;
        const target = { lat: item.lat, lng: item.lng };
        const from = readPosition(entry.marker) || target;
        if (!nearlySame(from, target)) {
          await animateMarkerPosition(entry.marker, from, target);
        }
        const isGroup = item.count > 1;
        entry.marker.title = isGroup
          ? `${item.count} pins`
          : item.pins[0]?.title || 'Pin';
        if (entry.pinEl) paintPinElement(entry.pinEl, item);
        entry.pins = item.pins;
      })
    );

    if (gen !== syncGenRef.current) return;

    pruneStaleMarkers(nextKeys);
    animatingRef.current = false;

    if (pendingSyncRef.current) {
      if (performance.now() < suppressSyncUntilRef.current) {
        schedulePendingWake();
      } else {
        pendingSyncRef.current = false;
        lastRangeBucketRef.current = null;
        void syncMarkersRef.current(false);
      }
    }
  };

  syncMarkersRef.current = syncMarkers;

  const scheduleSync = () => {
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      syncMarkersRef.current(false);
    }, SYNC_DEBOUNCE_MS);
    if (viewportTimerRef.current) window.clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = window.setTimeout(emitViewport, 100);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const keyResult = await fetchPlacesApiKey();
      if (cancelled) return;

      if (!keyResult.configured || !keyResult.key) {
        setKeyMissing(true);
        return;
      }

      try {
        const google = await loadGoogleMaps3dApi(keyResult.key);
        if (cancelled || !hostRef.current) return;

        maps3dRef.current = google.maps.maps3d;
        const { Map3DElement } = google.maps.maps3d;

        const map = new Map3DElement({
          center: GLOBE_CENTER,
          range: GLOBE_CAMERA_RANGE,
          tilt: 0,
          heading: 0,
          mode: 'SATELLITE',
          gestureHandling: 'GREEDY',
          defaultUIHidden: true,
        });
        map.classList.add('pebble-map-3d');
        hostRef.current.replaceChildren(map);
        mapRef.current = map;
        if (userHomeRef.current) {
          flyCamera(map, {
            center: userHomeRef.current,
            range: CONTINENT_CAMERA_RANGE,
            tilt: 0,
            heading: 0,
          });
        }

        map.addEventListener('gmp-rangechange', scheduleSync);
        map.addEventListener('gmp-centerchange', scheduleSync);

        setMapsReady(true);
        lastPinSignatureRef.current = pinSetSignature(pebblesRef.current);
        syncMarkersRef.current(true);
        emitViewport();
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || 'Failed to load globe');
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      syncGenRef.current += 1;
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      if (viewportTimerRef.current) window.clearTimeout(viewportTimerRef.current);
      if (pendingWakeRef.current) window.clearTimeout(pendingWakeRef.current);
      const map = mapRef.current;
      if (map) {
        map.removeEventListener('gmp-rangechange', scheduleSync);
        map.removeEventListener('gmp-centerchange', scheduleSync);
      }
      clearMarkers();
      lastRangeBucketRef.current = null;
      mapRef.current = null;
      if (hostRef.current) hostRef.current.replaceChildren();
    };
    // Mount-only: pebbles updates sync via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapsReady) return;
    const signature = pinSetSignature(pebbles);
    if (signature === lastPinSignatureRef.current) return;
    lastPinSignatureRef.current = signature;
    syncMarkersRef.current(true);
  }, [pebbles, mapsReady]);

  useEffect(() => {
    if (!mapsReady || !mapRef.current) return undefined;
    const timer = window.setTimeout(() => {
      const map = mapRef.current;
      if (!map) return;
      const range = map.range;
      map.range = range;
      emitViewport();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [splitLayout, mapsReady]);

  useEffect(() => {
    if (!mapsReady || !focusTarget) return;
    const fromPins = (Array.isArray(focusTarget.pins) ? focusTarget.pins : []).filter((pin) => {
      const lat = Number(pin.place_lat);
      const lng = Number(pin.place_lng);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
    const lat = Number(focusTarget.lat);
    const lng = Number(focusTarget.lng);
    const targetPins = fromPins.length
      ? fromPins
      : Number.isFinite(lat) && Number.isFinite(lng)
        ? [{ place_lat: lat, place_lng: lng }]
        : [];
    if (!targetPins.length) return;
    beginSuppress(FLY_DURATION_MS + 80);
    flyToPins(targetPins);
    const timer = window.setTimeout(emitViewport, FLY_DURATION_MS + 50);
    return () => window.clearTimeout(timer);
    // focusTarget.nonce lets the same place be re-selected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget, mapsReady]);

  useEffect(() => {
    if (!mapsReady || !resetSignal) return;
    const map = mapRef.current;
    if (!map) return;
    beginSuppress(FLY_DURATION_MS + 80);
    const userCenter = userHomeRef.current;
    const home = userCenter
      ? {
          center: userCenter,
          range: CONTINENT_CAMERA_RANGE,
          tilt: 0,
          heading: 0,
        }
      : {
          center: GLOBE_CENTER,
          range: GLOBE_CAMERA_RANGE,
          tilt: 0,
          heading: 0,
        };
    flyCamera(map, home);
    const timer = window.setTimeout(emitViewport, FLY_DURATION_MS + 50);
    return () => window.clearTimeout(timer);
    // resetSignal is the only trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, mapsReady]);

  if (keyMissing) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="max-w-sm text-sm text-muted">
          Google Maps is not configured. Set GOOGLE_PLACES_API_KEY to explore pebbles on the map.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="max-w-sm text-sm text-muted">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-w-0">
      <div
        ref={hostRef}
        data-testid="pebble-map-canvas"
        className="h-full w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-surface"
        role="application"
        aria-label="Pebble location globe"
      />
      {!mapsReady && (
        <p
          className="absolute inset-x-0 bottom-3 text-center text-sm text-muted"
          data-testid="pebble-map-loading"
        >
          Loading globe…
        </p>
      )}
    </div>
  );
};

export default PebbleMap;
