import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PebbleMap from '../components/Map/PebbleMap';
import { __resetGooglePlacesLoaderForTests } from '../helpers/placesHelpers';
import { GLOBE_CAMERA_RANGE } from '../helpers/mapHelpers';

jest.mock('../helpers/placesHelpers', () => {
  const actual = jest.requireActual('../helpers/placesHelpers');
  return {
    ...actual,
    fetchPlacesApiKey: jest.fn(),
    loadGoogleMaps3dApi: jest.fn(),
  };
});

import { fetchPlacesApiKey, loadGoogleMaps3dApi } from '../helpers/placesHelpers';

const portland = {
  pebble_id: 11,
  title: 'Casco Bay notes',
  place_name: 'Portland, ME',
  place_lat: 43.6591,
  place_lng: -70.2568,
};

const createGoogleMaps3dMock = () => {
  const markerClickHandlers = [];
  const mapInstances = [];

  class MarkerInteractiveElement {
    constructor(options) {
      this.options = options;
      this._handlers = {};
      this._children = [];
    }

    addEventListener(event, handler) {
      if (event === 'gmp-click') markerClickHandlers.push(handler);
      this._handlers[event] = handler;
    }

    removeEventListener(event, handler) {
      if (this._handlers[event] === handler) delete this._handlers[event];
    }

    append(child) {
      this._children.push(child);
    }

    remove() {}
  }

  class Map3DElement {
    constructor(options) {
      this.options = options;
      this.range = options.range;
      this.center = options.center;
      this.classList = { add: jest.fn() };
      this.flyCameraTo = jest.fn();
      this._children = [];
      mapInstances.push(this);
    }

    addEventListener() {}

    removeEventListener() {}

    append(child) {
      this._children.push(child);
    }
  }

  const google = {
    maps: {
      maps3d: {
        Map3DElement,
        MarkerInteractiveElement,
      },
    },
  };

  return { google, markerClickHandlers, mapInstances };
};

const renderMap = (props = {}) =>
  render(
    <MemoryRouter>
      <div className="aspect-square h-64 w-64">
        <PebbleMap pebbles={[portland]} onSelectGroup={jest.fn()} {...props} />
      </div>
    </MemoryRouter>
  );

describe('PebbleMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetGooglePlacesLoaderForTests();
    delete window.google;
  });

  test('shows missing-key state when Places key is not configured', async () => {
    fetchPlacesApiKey.mockResolvedValue({ key: null, mapId: null, configured: false });

    renderMap();

    expect(
      await screen.findByText(/Google Maps is not configured/i)
    ).toBeInTheDocument();
  });

  test('shows load error when Maps 3D API fails', async () => {
    fetchPlacesApiKey.mockResolvedValue({
      key: 'test-key',
      configured: true,
    });
    loadGoogleMaps3dApi.mockRejectedValue(new Error('Globe boom'));

    renderMap();

    expect(await screen.findByText('Globe boom')).toBeInTheDocument();
  });

  test('creates a satellite globe at Earth-scale range with HTML interactive markers', async () => {
    const { google, mapInstances } = createGoogleMaps3dMock();
    const markerOptions = [];
    const OriginalMarker = google.maps.maps3d.MarkerInteractiveElement;
    google.maps.maps3d.MarkerInteractiveElement = class extends OriginalMarker {
      constructor(options) {
        super(options);
        markerOptions.push(options);
      }
    };

    fetchPlacesApiKey.mockResolvedValue({
      key: 'test-key',
      configured: true,
    });
    loadGoogleMaps3dApi.mockResolvedValue(google);

    renderMap();

    await waitFor(() => {
      expect(mapInstances.length).toBe(1);
      expect(markerOptions.length).toBeGreaterThan(0);
    });
    expect(mapInstances[0].options).toEqual(
      expect.objectContaining({
        mode: 'SATELLITE',
        range: GLOBE_CAMERA_RANGE,
        tilt: 0,
        defaultUIHidden: true,
      })
    );
    expect(markerOptions[0]).toEqual(
      expect.objectContaining({
        position: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number),
        }),
      })
    );
    expect(await screen.findByTestId('pebble-map-canvas')).toBeInTheDocument();
  });

  test('keeps markers clickable after split layout closes', async () => {
    const onSelectGroup = jest.fn();
    const { google, markerClickHandlers, mapInstances } = createGoogleMaps3dMock();
    fetchPlacesApiKey.mockResolvedValue({
      key: 'test-key',
      configured: true,
    });
    loadGoogleMaps3dApi.mockResolvedValue(google);

    const { rerender } = render(
      <MemoryRouter>
        <PebbleMap
          pebbles={[portland]}
          onSelectGroup={onSelectGroup}
          splitLayout
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mapInstances.length).toBe(1);
      expect(markerClickHandlers.length).toBeGreaterThan(0);
    });

    rerender(
      <MemoryRouter>
        <PebbleMap
          pebbles={[portland]}
          onSelectGroup={onSelectGroup}
          splitLayout={false}
        />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(markerClickHandlers.length).toBeGreaterThan(0);
      },
      { timeout: 1000 }
    );

    markerClickHandlers[markerClickHandlers.length - 1]();
    expect(onSelectGroup).toHaveBeenCalledWith([
      expect.objectContaining({ pebble_id: 11 }),
    ]);
  });

  test('notifies parent with pin group and flies camera on click', async () => {
    const onSelectGroup = jest.fn();
    const { google, markerClickHandlers, mapInstances } = createGoogleMaps3dMock();
    fetchPlacesApiKey.mockResolvedValue({
      key: 'test-key',
      configured: true,
    });
    loadGoogleMaps3dApi.mockResolvedValue(google);

    renderMap({ onSelectGroup });

    await waitFor(() => {
      expect(markerClickHandlers.length).toBeGreaterThan(0);
      expect(mapInstances.length).toBe(1);
    });

    markerClickHandlers[0]();
    expect(onSelectGroup).toHaveBeenCalledWith([
      expect.objectContaining({ pebble_id: 11, title: 'Casco Bay notes' }),
    ]);
    expect(mapInstances[0].flyCameraTo).toHaveBeenCalled();
  });

  test('cluster click selects the group and flies camera', async () => {
    const onSelectGroup = jest.fn();
    const { google, markerClickHandlers, mapInstances } = createGoogleMaps3dMock();
    fetchPlacesApiKey.mockResolvedValue({
      key: 'test-key',
      configured: true,
    });
    loadGoogleMaps3dApi.mockResolvedValue(google);

    const nearby = [
      portland,
      {
        pebble_id: 12,
        title: 'Nearby',
        place_name: 'South Portland, ME',
        place_lat: 43.64,
        place_lng: -70.24,
      },
    ];

    renderMap({ pebbles: nearby, onSelectGroup });

    await waitFor(() => {
      expect(markerClickHandlers.length).toBeGreaterThan(0);
      expect(mapInstances.length).toBe(1);
    });

    markerClickHandlers[0]();

    expect(onSelectGroup).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ pebble_id: 11 }),
        expect.objectContaining({ pebble_id: 12 }),
      ])
    );
    expect(mapInstances[0].flyCameraTo).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMillis: 450,
        endCamera: expect.objectContaining({
          center: expect.objectContaining({
            lat: expect.any(Number),
            lng: expect.any(Number),
          }),
        }),
      })
    );
  });
});
