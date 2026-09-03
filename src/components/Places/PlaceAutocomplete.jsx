import React, { useEffect, useRef, useState } from 'react';
import {
  emptyPlace,
  fetchPlacesApiKey,
  loadGooglePlacesApi,
  placeFromNewPlace,
} from '../../helpers/placesHelpers';

const inputClass =
  'w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-pebble focus:border-accent';

const PLACEHOLDER = 'City, lab, or field site';

const PlaceAutocomplete = ({ value, onChange, label = 'Location' }) => {
  const hostRef = useRef(null);
  const elementRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [apiKey, setApiKey] = useState(null);
  const [placesReady, setPlacesReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [placeName, setPlaceName] = useState(value?.placeName || '');

  onChangeRef.current = onChange;

  useEffect(() => {
    let active = true;
    fetchPlacesApiKey().then((result) => {
      if (!active) return;
      if (result.configured && result.key) {
        setApiKey(result.key);
      } else {
        setApiKey(null);
        setPlacesReady(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPlaceName(value?.placeName || '');
    const element = elementRef.current;
    if (element && value?.placeName != null && element.value !== value.placeName) {
      element.value = value.placeName;
    }
  }, [value?.placeName]);

  useEffect(() => {
    if (!apiKey) return undefined;

    let cancelled = false;
    let element = null;

    const handleSelect = async (event) => {
      try {
        const placePrediction = event.placePrediction;
        if (!placePrediction) return;
        const place = placePrediction.toPlace();
        await place.fetchFields({
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'],
        });
        const next = placeFromNewPlace(place);
        if (!next.placeId && !next.placeName) return;
        setPlaceName(next.placeName);
        if (element) element.value = next.placeName;
        onChangeRef.current?.(next);
      } catch (err) {
        console.error('[Places] Failed to resolve selected place', err);
        setLoadError(err?.message || 'Could not load place details');
      }
    };

    const handleInput = () => {
      const nextName = element?.value || '';
      setPlaceName(nextName);
      onChangeRef.current?.(emptyPlace(nextName));
    };

    const handleError = () => {
      setPlacesReady(false);
      setLoadError('Places request denied — check API key and Places API (New)');
    };

    loadGooglePlacesApi(apiKey)
      .then(async (google) => {
        if (cancelled || !hostRef.current) return;

        const placesLibrary = await google.maps.importLibrary('places');
        const PlaceAutocompleteElement =
          placesLibrary.PlaceAutocompleteElement || google.maps.places.PlaceAutocompleteElement;

        if (!PlaceAutocompleteElement) {
          throw new Error('PlaceAutocompleteElement is unavailable');
        }

        element = new PlaceAutocompleteElement({
          placeholder: PLACEHOLDER,
        });
        element.className = 'pebble-place-autocomplete';
        element.value = value?.placeName || placeName || '';
        element.addEventListener('gmp-select', handleSelect);
        element.addEventListener('input', handleInput);
        element.addEventListener('gmp-error', handleError);

        hostRef.current.replaceChildren(element);
        elementRef.current = element;
        setPlacesReady(true);
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          if (element) {
            element.removeEventListener('gmp-select', handleSelect);
            element.removeEventListener('input', handleInput);
            element.removeEventListener('gmp-error', handleError);
            element.remove();
            element = null;
          }
          elementRef.current = null;
          hostRef.current?.replaceChildren();
          setPlacesReady(false);
          setLoadError(err?.message || 'Places failed to load');
          console.error('[Places]', err);
        }
      });

    return () => {
      cancelled = true;
      if (element) {
        element.removeEventListener('gmp-select', handleSelect);
        element.removeEventListener('input', handleInput);
        element.removeEventListener('gmp-error', handleError);
        element.remove();
      }
      elementRef.current = null;
      hostRef.current?.replaceChildren();
    };
    // placeName / value are only used for initial element value on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const handleManualChange = (nextName) => {
    setPlaceName(nextName);
    onChangeRef.current?.(emptyPlace(nextName));
  };

  const showManual = !apiKey || Boolean(loadError);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">
        {label}
        {showManual
          ? loadError
            ? ' (manual — Places failed to load)'
            : ' (manual — Places key not configured)'
          : placesReady
            ? ''
            : ' (loading Places…)'}
      </span>
      {showManual ? (
        <input
          type="text"
          value={placeName}
          onChange={(e) => handleManualChange(e.target.value)}
          placeholder={PLACEHOLDER}
          autoComplete="off"
          className={inputClass}
        />
      ) : (
        <div ref={hostRef} className="w-full" />
      )}
      {loadError ? <p className="mt-1 text-xs text-muted">{loadError}</p> : null}
    </label>
  );
};

export default PlaceAutocomplete;
