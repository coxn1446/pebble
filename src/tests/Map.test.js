import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Map from '../routes/Map';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../helpers/pebbleHelpers', () => ({
  fetchFeed: jest.fn(),
  searchPebbles: jest.fn(),
}));

jest.mock('../helpers/userHelpers', () => ({
  fetchMapUsers: jest.fn(),
}));

jest.mock('../helpers/taxonomyHelpers', () => ({
  fetchFields: jest.fn(async () => [{ field_id: 1, name: 'Biology' }]),
}));

jest.mock('../helpers/searchHelpers', () => ({
  fetchSearchSuggestions: jest.fn(async () => []),
}));

jest.mock('../components/Map/PebbleMap', () => {
  const MockPebbleMap = ({ pebbles, onSelectGroup, onViewportChange, focusTarget }) => (
    <div data-testid="pebble-map">
      <span>{`pins:${pebbles.length}`}</span>
      <span data-testid="map-focus">
        {focusTarget ? `${focusTarget.lat},${focusTarget.lng}` : 'none'}
      </span>
      <button
        type="button"
        onClick={() =>
          onViewportChange?.({
            north: 44,
            south: 43,
            east: -70,
            west: -71,
          })
        }
      >
        Set viewport
      </button>
      <button type="button" onClick={() => onSelectGroup([pebbles[0]])}>
        Select single
      </button>
      <button
        type="button"
        onClick={() =>
          onSelectGroup([
            pebbles[0],
            { ...pebbles[0], pebble_id: 99, title: 'Second' },
          ])
        }
      >
        Select group
      </button>
    </div>
  );
  return MockPebbleMap;
});

import { fetchFeed, searchPebbles } from '../helpers/pebbleHelpers';
import { fetchMapUsers } from '../helpers/userHelpers';

const renderMapRoute = () =>
  render(
    <MemoryRouter>
      <Map />
    </MemoryRouter>
  );

describe('Map route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMapUsers.mockResolvedValue([]);
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
  });

  test('always renders split feed + map layout', async () => {
    fetchFeed.mockResolvedValue([
      {
        pebble_id: 1,
        title: 'Portland',
        place_lat: 43.65,
        place_lng: -70.25,
        place_name: 'Portland, ME',
        author_username: 'ada',
        author_display_name: 'Ada',
        like_count: 0,
      },
    ]);

    renderMapRoute();

    expect(await screen.findByTestId('map-layout')).toHaveAttribute('data-layout', 'split');
    expect(screen.getByTestId('map-feed-panel')).toBeInTheDocument();
    expect(screen.getByTestId('pebble-map')).toHaveTextContent('pins:1');
    expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument();
  });

  test('filters feed list when viewport changes', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([
      {
        pebble_id: 1,
        title: 'In view',
        place_lat: 43.65,
        place_lng: -70.25,
        author_username: 'ada',
        like_count: 0,
      },
      {
        pebble_id: 2,
        title: 'Far away',
        place_lat: 10,
        place_lng: 10,
        author_username: 'bob',
        like_count: 0,
      },
    ]);

    renderMapRoute();
    expect(await screen.findByText('In view')).toBeInTheDocument();
    expect(screen.getByText('Far away')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set viewport' }));

    await waitFor(() => {
      expect(screen.getByText('In view')).toBeInTheDocument();
      expect(screen.queryByText('Far away')).not.toBeInTheDocument();
    });
    // Feed is viewport-filtered; map keeps all search/feed pins to avoid sync flicker.
    expect(screen.getByTestId('pebble-map')).toHaveTextContent('pins:2');
  });

  test('shows filter chip for author and clears it', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([
      {
        pebble_id: 3,
        title: 'Kaitlin pebble',
        place_lat: 43.65,
        place_lng: -70.25,
        author_username: 'kbb',
        like_count: 0,
      },
    ]);

    renderMapRoute();
    await screen.findByTestId('map-feed-panel');

    // Simulate selecting a user suggestion via advanced apply path through search submit chip flow
    searchPebbles.mockResolvedValue([
      {
        pebble_id: 3,
        title: 'Kaitlin pebble',
        place_lat: 43.65,
        place_lng: -70.25,
        author_username: 'kbb',
        like_count: 0,
      },
    ]);

    // Open advanced and we can't easily; call by applying via suggestion mock on MapSearchInput
    // Instead trigger author filter through the public apply by using the search suggestions path:
    const { fetchSearchSuggestions } = require('../helpers/searchHelpers');
    fetchSearchSuggestions.mockResolvedValue([
      {
        type: 'user',
        id: 'user-1',
        label: 'Kaitlin',
        subtitle: '@kbb',
        value: 'kbb',
        username: 'kbb',
      },
    ]);

    await user.type(screen.getByLabelText(/Search people or places/i), 'kait');
    expect(await screen.findByText('Kaitlin')).toBeInTheDocument();
    await user.click(screen.getByText('Kaitlin'));

    expect(await screen.findByRole('button', { name: /Remove filter @kbb/i })).toBeInTheDocument();
    expect(searchPebbles).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Remove filter @kbb/i }));
    await waitFor(() => expect(screen.queryByTestId('map-filter-chips')).not.toBeInTheDocument());
    expect(fetchFeed).toHaveBeenCalled();
  });

  test('selecting a place suggestion focuses the map on its coordinates', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([
      {
        pebble_id: 4,
        title: 'Rome pebble',
        place_lat: 41.9,
        place_lng: 12.5,
        author_username: 'will',
        like_count: 0,
      },
    ]);
    const { fetchSearchSuggestions } = require('../helpers/searchHelpers');
    fetchSearchSuggestions.mockResolvedValue([
      {
        type: 'place',
        id: 'place-Rome',
        label: 'Rome',
        subtitle: 'Place',
        value: 'Rome',
        place_lat: 41.9,
        place_lng: 12.5,
      },
    ]);

    renderMapRoute();
    await screen.findByTestId('map-feed-panel');
    expect(screen.getByTestId('map-focus')).toHaveTextContent('none');

    await user.type(screen.getByLabelText(/Search people or places/i), 'rom');
    expect(await screen.findByText('Rome')).toBeInTheDocument();
    await user.click(screen.getByText('Rome'));

    expect(await screen.findByTestId('map-focus')).toHaveTextContent('41.9,12.5');
    expect(screen.getByRole('button', { name: /Remove filter Rome/i })).toBeInTheDocument();
  });

  test('single pin navigates to pebble; group does not open panel', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([
      {
        pebble_id: 1,
        title: 'Portland',
        place_lat: 43.65,
        place_lng: -70.25,
        author_username: 'ada',
        like_count: 0,
      },
    ]);

    renderMapRoute();
    await screen.findByTestId('pebble-map');

    await user.click(screen.getByRole('button', { name: 'Select single' }));
    expect(mockNavigate).toHaveBeenCalledWith('/pebbles/1');
    expect(screen.queryByTestId('map-pebble-panel')).not.toBeInTheDocument();

    mockNavigate.mockClear();
    await user.click(screen.getByRole('button', { name: 'Select group' }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText(/pebbles in this area/i)).not.toBeInTheDocument();
  });
});
