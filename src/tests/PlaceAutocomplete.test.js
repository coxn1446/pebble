import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlaceAutocomplete from '../components/Places/PlaceAutocomplete';
import {
  __resetGooglePlacesLoaderForTests,
  fetchPlacesApiKey,
  loadGooglePlacesApi,
} from '../helpers/placesHelpers';

jest.mock('../helpers/placesHelpers', () => {
  const actual = jest.requireActual('../helpers/placesHelpers');
  return {
    ...actual,
    fetchPlacesApiKey: jest.fn(),
    loadGooglePlacesApi: jest.fn(),
  };
});

describe('PlaceAutocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetGooglePlacesLoaderForTests();
  });

  test('manual mode when Places key is not configured', async () => {
    fetchPlacesApiKey.mockResolvedValue({ key: null, configured: false });
    const onChange = jest.fn();

    render(<PlaceAutocomplete value={{ placeName: '' }} onChange={onChange} />);

    expect(
      await screen.findByText(/manual — Places key not configured/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/City, lab, or field site/i), {
      target: { value: 'River lab' },
    });

    expect(onChange).toHaveBeenCalledWith({
      placeId: null,
      placeName: 'River lab',
      placeLat: null,
      placeLng: null,
      placeLocality: null,
      placeAdminArea: null,
      placeCountry: null,
    });
    expect(loadGooglePlacesApi).not.toHaveBeenCalled();
  });

  test('wires PlaceAutocompleteElement when key is configured', async () => {
    fetchPlacesApiKey.mockResolvedValue({ key: 'test-key', configured: true });

    const listeners = {};
    const element = document.createElement('div');
    element.value = '';
    const originalAdd = element.addEventListener.bind(element);
    element.addEventListener = jest.fn((event, cb, options) => {
      listeners[event] = cb;
      return originalAdd(event, cb, options);
    });

    const PlaceAutocompleteElement = jest.fn(() => element);
    const place = {
      fetchFields: jest.fn(async () => {}),
      id: 'place-1',
      displayName: 'Boston',
      formattedAddress: 'Boston, MA, USA',
      location: { lat: () => 42.36, lng: () => -71.06 },
      addressComponents: [
        { types: ['locality'], longText: 'Boston' },
        { types: ['administrative_area_level_1'], longText: 'Massachusetts' },
        { types: ['country'], longText: 'United States' },
      ],
    };
    const placePrediction = {
      toPlace: jest.fn(() => place),
    };

    loadGooglePlacesApi.mockResolvedValue({
      maps: {
        importLibrary: jest.fn(async () => ({ PlaceAutocompleteElement })),
        places: { PlaceAutocompleteElement },
      },
    });

    const onChange = jest.fn();
    render(
      <PlaceAutocomplete
        value={{ placeName: '', placeId: null, placeLat: null, placeLng: null }}
        onChange={onChange}
      />
    );

    await waitFor(() => expect(loadGooglePlacesApi).toHaveBeenCalledWith('test-key'));
    await waitFor(() =>
      expect(element.addEventListener).toHaveBeenCalledWith('gmp-select', expect.any(Function))
    );

    await listeners['gmp-select']({ placePrediction });

    expect(place.fetchFields).toHaveBeenCalledWith({
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'],
    });
    expect(onChange).toHaveBeenCalledWith({
      placeId: 'place-1',
      placeName: 'Boston, MA, USA',
      placeLat: 42.36,
      placeLng: -71.06,
      placeLocality: 'Boston',
      placeAdminArea: 'Massachusetts',
      placeCountry: 'United States',
    });
  });
});
