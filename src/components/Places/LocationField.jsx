import React, { useEffect, useRef, useState } from 'react';
import { CollapseIcon, ExpandIcon, RecenterIcon } from '../Icons/Icons';
import PlaceAutocomplete from './PlaceAutocomplete';
import {
  fetchPlacesApiKey,
  loadGoogleMapsApi,
  placeFromGeocoderResult,
} from '../../helpers/placesHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-pebble focus:border-accent';

const parseCoord = (value) => {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const LocationField = ({ value, onChange, pinName = '', onPinNameChange }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [mapReady, setMapReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const homeRef = useRef(null);

  onChangeRef.current = onChange;
  valueRef.current = value;

  const lat = value?.placeLat ?? '';
  const lng = value?.placeLng ?? '';

  useEffect(() => {
    let cancelled = false;
    fetchPlacesApiKey().then(async (result) => {
      if (cancelled || !result.configured || !result.key || !mapRef.current) return;
      try {
        const google = await loadGoogleMapsApi(result.key);
        if (cancelled || !mapRef.current || mapInstance.current) return;
        const start = {
          lat: Number.isFinite(Number(valueRef.current?.placeLat))
            ? Number(valueRef.current.placeLat)
            : 20,
          lng: Number.isFinite(Number(valueRef.current?.placeLng))
            ? Number(valueRef.current.placeLng)
            : 0,
        };
        homeRef.current = start;
        const map = new google.maps.Map(mapRef.current, {
          center: start,
          zoom: Number.isFinite(Number(valueRef.current?.placeLat)) ? 6 : 2,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          mapId: result.mapId || undefined,
        });
        map.addListener('click', (event) => {
          const nextLat = event.latLng.lat();
          const nextLng = event.latLng.lng();
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat: nextLat, lng: nextLng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              onChangeRef.current(placeFromGeocoderResult(results[0], nextLat, nextLng));
              return;
            }
            onChangeRef.current(placeFromGeocoderResult(null, nextLat, nextLng));
          });
        });
        mapInstance.current = map;
        setMapReady(true);
      } catch (err) {
        console.error('[Maps] Pin map failed', err);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const google = window.google;
    const map = mapInstance.current;
    if (!mapReady || !map || !google?.maps) return;
    const nextLat = Number(value?.placeLat);
    const nextLng = Number(value?.placeLng);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }
    const position = { lat: nextLat, lng: nextLng };
    map.panTo(position);
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({ map, position });
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setMap(map);
    }
  }, [mapReady, value?.placeLat, value?.placeLng]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map || !window.google?.maps?.event) return;
    window.google.maps.event.trigger(map, 'resize');
  }, [expanded, mapReady]);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  const recenter = () => {
    const map = mapInstance.current;
    if (!map) return;
    const nextLat = Number(valueRef.current?.placeLat);
    const nextLng = Number(valueRef.current?.placeLng);
    if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
      map.panTo({ lat: nextLat, lng: nextLng });
      map.setZoom(6);
      return;
    }
    if (homeRef.current) {
      map.panTo(homeRef.current);
      map.setZoom(2);
    }
  };

  const setCoord = (key, raw) => {
    onChange({
      ...value,
      [key]: parseCoord(raw),
    });
  };

  const pinField = (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">Pin name</span>
      <input
        value={pinName}
        onChange={(event) => onPinNameChange?.(event.target.value)}
        className={inputClass}
      />
    </label>
  );

  const coords = (
    <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Latitude</span>
          <input
            inputMode="decimal"
            value={lat}
            onChange={(event) => setCoord('placeLat', event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Longitude</span>
          <input
            inputMode="decimal"
            value={lng}
            onChange={(event) => setCoord('placeLng', event.target.value)}
            className={inputClass}
          />
        </label>
      </div>
  );

  return (
    <div
      className={
        expanded
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4'
          : 'space-y-3'
      }
      onClick={(event) => {
        if (expanded && event.target === event.currentTarget) setExpanded(false);
      }}
    >
      <div
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? 'true' : undefined}
        aria-label={expanded ? 'Location' : undefined}
        className={
          expanded
            ? 'w-full max-w-3xl space-y-3 rounded-2xl border border-border bg-surface p-5'
            : 'space-y-3'
        }
        onClick={(event) => event.stopPropagation()}
      >
        {expanded ? null : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PlaceAutocomplete value={value} onChange={onChange} label="Location" />
            {pinField}
          </div>
        )}
        <div className="relative">
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              type="button"
              aria-label={expanded ? 'Minimize map' : 'Expand map'}
              onClick={() => setExpanded((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-ink"
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
            <button
              type="button"
              aria-label="Recenter map"
              onClick={recenter}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-ink"
            >
              <RecenterIcon />
            </button>
          </div>
          <div
            ref={mapRef}
            className={
              expanded
                ? 'h-96 w-full overflow-hidden rounded-2xl border border-border bg-surface'
                : 'h-48 w-full overflow-hidden rounded-2xl border border-border bg-surface'
            }
            aria-label="Drop a pin"
          />
        </div>
        <div className={expanded ? 'space-y-3' : ''}>
          {expanded ? pinField : null}
          {coords}
        </div>
      </div>
    </div>
  );
};

export default LocationField;
