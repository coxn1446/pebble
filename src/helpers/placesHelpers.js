const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-places';
const GOOGLE_MAPS_CALLBACK = '__pebbleGoogleMapsInit';

let scriptLoadPromise = null;

export const fetchPlacesApiKey = async () => {
  try {
    const res = await fetch('/api/places/key', { credentials: 'include' });
    if (!res.ok) return { key: null, configured: false };
    return res.json();
  } catch {
    return { key: null, configured: false };
  }
};

export const emptyPlace = (placeName = '') => ({
  placeId: null,
  placeName,
  placeLat: null,
  placeLng: null,
  placeLocality: null,
  placeAdminArea: null,
  placeCountry: null,
});

const readLatLng = (location, method) => {
  if (!location) return null;
  const value = location[method];
  if (typeof value === 'function') return value.call(location);
  if (typeof value === 'number') return value;
  return null;
};

const readTextField = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value.text === 'string') return value.text;
  return String(value);
};

const componentHasType = (component, type) => {
  const types = component?.types || [];
  return types.includes(type);
};

const componentText = (component) =>
  readTextField(component?.longText) ||
  readTextField(component?.long_name) ||
  readTextField(component?.shortText) ||
  readTextField(component?.short_name) ||
  '';

/** Extract locality / admin area / country from Places addressComponents. */
export const addressPartsFromComponents = (components) => {
  const list = Array.isArray(components) ? components : [];
  let placeLocality = null;
  let placeAdminArea = null;
  let placeCountry = null;

  for (const component of list) {
    if (!placeLocality && (componentHasType(component, 'locality') || componentHasType(component, 'postal_town'))) {
      placeLocality = componentText(component) || null;
    }
    if (!placeAdminArea && componentHasType(component, 'administrative_area_level_1')) {
      placeAdminArea = componentText(component) || null;
    }
    if (!placeCountry && componentHasType(component, 'country')) {
      placeCountry = componentText(component) || null;
    }
  }

  return { placeLocality, placeAdminArea, placeCountry };
};

/** Classic Geocoder result → place shape. Coordinates stay even when the name is empty. */
export const placeFromGeocoderResult = (result, lat, lng) => {
  if (!result) {
    return {
      placeId: null,
      placeName: '',
      placeLat: lat,
      placeLng: lng,
      placeLocality: null,
      placeAdminArea: null,
      placeCountry: null,
    };
  }
  const parts = addressPartsFromComponents(result.address_components);
  return {
    placeId: result.place_id || null,
    placeName: result.formatted_address || '',
    placeLat: lat,
    placeLng: lng,
    ...parts,
  };
};

/** Normalize a Places API (New) Place into Pebble's place shape. */
export const placeFromNewPlace = (place) => {
  if (!place) return emptyPlace();

  const placeName =
    readTextField(place.formattedAddress) || readTextField(place.displayName) || '';
  const parts = addressPartsFromComponents(place.addressComponents || place.address_components);

  return {
    placeId: place.id || null,
    placeName,
    placeLat: readLatLng(place.location, 'lat'),
    placeLng: readLatLng(place.location, 'lng'),
    ...parts,
  };
};

const ensurePlacesLibrary = async () => {
  if (typeof window.google?.maps?.importLibrary === 'function') {
    await window.google.maps.importLibrary('places');
  }

  if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
    throw new Error('Google Maps PlaceAutocompleteElement failed to initialize');
  }
  return window.google;
};

const ensureMapsLibrary = async () => {
  if (typeof window.google?.maps?.importLibrary === 'function') {
    await window.google.maps.importLibrary('maps');
    await window.google.maps.importLibrary('marker');
  }

  if (typeof window.google?.maps?.Map !== 'function') {
    throw new Error('Google Maps Map failed to initialize');
  }
  if (typeof window.google?.maps?.marker?.AdvancedMarkerElement !== 'function') {
    throw new Error('Google Maps AdvancedMarkerElement failed to initialize');
  }
  return window.google;
};

const ensureMaps3dLibrary = async () => {
  if (typeof window.google?.maps?.importLibrary === 'function') {
    await window.google.maps.importLibrary('maps3d');
  }

  if (typeof window.google?.maps?.maps3d?.Map3DElement !== 'function') {
    throw new Error('Google Maps Map3DElement failed to initialize');
  }
  if (typeof window.google?.maps?.maps3d?.Marker3DInteractiveElement !== 'function') {
    throw new Error('Google Maps Marker3DInteractiveElement failed to initialize');
  }
  return window.google;
};

/**
 * Load the Maps JavaScript API script once per page.
 * Resolves when window.google.maps is available (libraries loaded on demand).
 */
const loadGoogleMapsScript = (apiKey) => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps requires a browser environment'));
  }
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is missing'));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const fail = (message) => {
      scriptLoadPromise = null;
      delete window[GOOGLE_MAPS_CALLBACK];
      reject(new Error(message));
    };

    window[GOOGLE_MAPS_CALLBACK] = () => {
      delete window[GOOGLE_MAPS_CALLBACK];
      if (!window.google?.maps) {
        fail('Google Maps failed to initialize');
        return;
      }
      resolve(window.google);
    };

    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existing) {
      if (window.google?.maps) {
        window[GOOGLE_MAPS_CALLBACK]();
        return;
      }
      // Script tag exists but not ready yet — wait for its callback
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places,marker` +
      `&loading=async` +
      `&callback=${GOOGLE_MAPS_CALLBACK}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      script.remove();
      fail('Failed to load Google Maps script');
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

/**
 * Load the Maps JavaScript API (Places library) once per page.
 * Uses Google's callback so we only resolve after libraries are ready.
 */
export const loadGooglePlacesApi = async (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error('Google Places API key is missing'));
  }
  if (window.google?.maps?.places?.PlaceAutocompleteElement) {
    return window.google;
  }
  await loadGoogleMapsScript(apiKey);
  return ensurePlacesLibrary();
};

/**
 * Load the Maps JavaScript API (Map library) once per page.
 * Reuses the same script singleton as Places.
 */
export const loadGoogleMapsApi = async (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is missing'));
  }
  if (
    typeof window.google?.maps?.Map === 'function' &&
    typeof window.google?.maps?.marker?.AdvancedMarkerElement === 'function'
  ) {
    return window.google;
  }
  await loadGoogleMapsScript(apiKey);
  return ensureMapsLibrary();
};

/**
 * Load the Maps JavaScript API 3D library (Map3DElement) once per page.
 * Reuses the same script singleton as Places / 2D Maps.
 */
export const loadGoogleMaps3dApi = async (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is missing'));
  }
  if (
    typeof window.google?.maps?.maps3d?.Map3DElement === 'function' &&
    typeof window.google?.maps?.maps3d?.Marker3DInteractiveElement === 'function'
  ) {
    return window.google;
  }
  await loadGoogleMapsScript(apiKey);
  return ensureMaps3dLibrary();
};

/** Test helper — resets the singleton loader between Jest cases. */
export const __resetGooglePlacesLoaderForTests = () => {
  scriptLoadPromise = null;
  if (typeof window !== 'undefined') {
    delete window[GOOGLE_MAPS_CALLBACK];
  }
  if (typeof document !== 'undefined') {
    document.getElementById(GOOGLE_MAPS_SCRIPT_ID)?.remove();
  }
};
