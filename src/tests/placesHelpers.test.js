import {
  __resetGooglePlacesLoaderForTests,
  emptyPlace,
  loadGoogleMaps3dApi,
  loadGoogleMapsApi,
  loadGooglePlacesApi,
  placeFromGeocoderResult,
  placeFromNewPlace,
} from '../helpers/placesHelpers';

describe('placesHelpers', () => {
  beforeEach(() => {
    __resetGooglePlacesLoaderForTests();
    delete window.google;
  });

  test('emptyPlace clears structured fields', () => {
    expect(emptyPlace('Lab')).toEqual({
      placeId: null,
      placeName: 'Lab',
      placeLat: null,
      placeLng: null,
      placeLocality: null,
      placeAdminArea: null,
      placeCountry: null,
    });
  });

  test('placeFromGeocoderResult keeps coordinates when the name is unknown', () => {
    expect(placeFromGeocoderResult(null, -51.2, -60.1)).toMatchObject({
      placeName: '',
      placeLat: -51.2,
      placeLng: -60.1,
    });
    expect(
      placeFromGeocoderResult(
        {
          place_id: 'fish',
          formatted_address: 'Fish Islands',
          address_components: [],
        },
        -51.2,
        -60.1
      ).placeName
    ).toBe('Fish Islands');
  });

  test('placeFromNewPlace maps Place fields and address components', () => {
    const place = placeFromNewPlace({
      id: 'abc',
      displayName: 'MIT',
      formattedAddress: 'Cambridge, MA, USA',
      location: {
        lat: () => 42.36,
        lng: () => -71.09,
      },
      addressComponents: [
        { types: ['locality'], longText: 'Cambridge' },
        { types: ['administrative_area_level_1'], longText: 'Massachusetts' },
        { types: ['country'], longText: 'United States' },
      ],
    });

    expect(place).toEqual({
      placeId: 'abc',
      placeName: 'Cambridge, MA, USA',
      placeLat: 42.36,
      placeLng: -71.09,
      placeLocality: 'Cambridge',
      placeAdminArea: 'Massachusetts',
      placeCountry: 'United States',
    });
  });

  test('placeFromNewPlace falls back to displayName when address missing', () => {
    expect(
      placeFromNewPlace({
        id: 'xyz',
        displayName: { text: 'Field Site' },
      })
    ).toEqual({
      placeId: 'xyz',
      placeName: 'Field Site',
      placeLat: null,
      placeLng: null,
      placeLocality: null,
      placeAdminArea: null,
      placeCountry: null,
    });
  });

  test('loadGooglePlacesApi resolves when PlaceAutocompleteElement is ready', async () => {
    window.google = {
      maps: {
        places: { PlaceAutocompleteElement: jest.fn() },
        importLibrary: jest.fn(),
      },
    };
    await expect(loadGooglePlacesApi('test-key')).resolves.toBe(window.google);
  });

  test('loadGooglePlacesApi rejects without a key', async () => {
    await expect(loadGooglePlacesApi('')).rejects.toThrow(/missing/i);
  });

  test('loadGoogleMapsApi resolves when Map and AdvancedMarkerElement are ready', async () => {
    window.google = {
      maps: {
        Map: jest.fn(),
        marker: { AdvancedMarkerElement: jest.fn() },
        importLibrary: jest.fn(),
      },
    };
    await expect(loadGoogleMapsApi('test-key')).resolves.toBe(window.google);
  });

  test('loadGoogleMapsApi rejects without a key', async () => {
    await expect(loadGoogleMapsApi('')).rejects.toThrow(/missing/i);
  });

  test('loadGoogleMapsApi loads maps and marker libraries when missing', async () => {
    const importLibrary = jest.fn(async (name) => {
      if (name === 'maps') {
        window.google.maps.Map = jest.fn();
      }
      if (name === 'marker') {
        window.google.maps.marker = { AdvancedMarkerElement: jest.fn() };
      }
    });
    window.google = {
      maps: {
        importLibrary,
      },
    };

    await expect(loadGoogleMapsApi('test-key')).resolves.toBe(window.google);
    expect(importLibrary).toHaveBeenCalledWith('maps');
    expect(importLibrary).toHaveBeenCalledWith('marker');
  });

  test('loadGoogleMaps3dApi resolves when Map3DElement is ready', async () => {
    window.google = {
      maps: {
        maps3d: {
          Map3DElement: jest.fn(),
          Marker3DInteractiveElement: jest.fn(),
        },
        importLibrary: jest.fn(),
      },
    };
    await expect(loadGoogleMaps3dApi('test-key')).resolves.toBe(window.google);
  });

  test('loadGoogleMaps3dApi loads maps3d library when missing', async () => {
    const importLibrary = jest.fn(async (name) => {
      if (name === 'maps3d') {
        window.google.maps.maps3d = {
          Map3DElement: jest.fn(),
          Marker3DInteractiveElement: jest.fn(),
        };
      }
    });
    window.google = {
      maps: {
        importLibrary,
      },
    };

    await expect(loadGoogleMaps3dApi('test-key')).resolves.toBe(window.google);
    expect(importLibrary).toHaveBeenCalledWith('maps3d');
  });
});
