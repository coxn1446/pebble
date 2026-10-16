import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MOBILE_WELCOME_QUERY } from '../components/Welcome/WelcomeShared';
import Map from '../routes/Map';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../helpers/pebbleHelpers', () => ({
  ...jest.requireActual('../helpers/pebbleHelpers'),
  fetchFeed: jest.fn(),
  searchPebbles: jest.fn(),
  fetchPebble: jest.fn(),
}));

jest.mock('../helpers/userHelpers', () => ({
  fetchMapUsers: jest.fn(),
}));

jest.mock('../helpers/taxonomyHelpers', () => ({
  fetchFields: jest.fn(async () => [{ field_id: 1, name: 'Biology' }]),
  fetchPhenomena: jest.fn(async () => []),
}));

jest.mock('../helpers/searchHelpers', () => ({
  fetchSearchSuggestions: jest.fn(async () => []),
}));

jest.mock('../components/Map/PebbleMap', () => {
  const MockPebbleMap = ({ pebbles, onSelectGroup, onViewportChange, focusTarget, resetSignal }) => (
    <div data-testid="pebble-map">
      <span>{`pins:${pebbles.length}`}</span>
      <span data-testid="map-reset">{resetSignal || 0}</span>
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

import { fetchFeed, fetchPebble, searchPebbles } from '../helpers/pebbleHelpers';
import { fetchMapUsers } from '../helpers/userHelpers';

const renderMapRoute = (entry = '/') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Map />
    </MemoryRouter>
  );

const mockMatchMedia = (matches) => {
  window.matchMedia.mockImplementation((query) => ({
    matches: typeof matches === 'function' ? matches(query) : Boolean(matches),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

describe('Map route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchMedia(false);
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

  test('keeps the newest feed when the viewport changes', async () => {
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

    expect(screen.getByText('In view')).toBeInTheDocument();
    expect(screen.getByText('Far away')).toBeInTheDocument();
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

    await user.type(screen.getByLabelText(/search for pebbles/i), 'kait');
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

    await user.type(screen.getByLabelText(/search for pebbles/i), 'rom');
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

  test('expand hides the feed and restore brings it back', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    renderMapRoute();
    expect(await screen.findByTestId('map-layout')).toHaveAttribute('data-layout', 'split');
    await user.click(screen.getByRole('button', { name: 'Expand map' }));
    expect(screen.getByTestId('map-layout')).toHaveAttribute('data-layout', 'expanded');
    expect(screen.queryByTestId('map-feed-panel')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore split' }));
    expect(screen.getByTestId('map-layout')).toHaveAttribute('data-layout', 'split');
    expect(screen.getByTestId('map-feed-panel')).toBeInTheDocument();
  });

  test('recenter bumps the map reset signal', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    renderMapRoute();
    await screen.findByTestId('pebble-map');
    expect(screen.getByTestId('map-reset')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: 'Recenter map' }));
    expect(screen.getByTestId('map-reset')).toHaveTextContent('1');
  });

  test('expanded pin opens a preview and does not navigate', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([
      {
        pebble_id: 1,
        title: 'Portland',
        description: 'Harbor notes',
        hero_image_url: 'https://example.com/harbor.jpg',
        place_lat: 43.65,
        place_lng: -70.25,
        phenomena: [{ phenomenon_id: 4, name: 'tides' }],
        like_count: 2,
      },
    ]);
    renderMapRoute();
    await screen.findByText('Portland');
    await user.click(screen.getByRole('button', { name: 'Expand map' }));
    await user.click(screen.getByRole('button', { name: 'Select single' }));
    expect(mockNavigate).not.toHaveBeenCalled();
    const preview = await screen.findByTestId('map-pin-preview');
    expect(preview).toHaveTextContent('Portland');
    expect(preview).toHaveTextContent('Harbor notes');
    expect(preview).toHaveTextContent('tides');
    expect(screen.getByTestId('map-pin-preview-photo')).toHaveAttribute(
      'src',
      'https://example.com/harbor.jpg'
    );
  });

  test('Mine requests only the signed-in user’s pebbles', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
    renderMapRoute();
    await screen.findByRole('button', { name: 'Mine' });
    await user.click(screen.getByRole('button', { name: 'Mine' }));
    await waitFor(() => {
      expect(searchPebbles).toHaveBeenCalledWith(expect.objectContaining({ mine: true }));
    });
    expect(fetchMapUsers).not.toHaveBeenCalledTimes(2);
  });

  test('Community favorites is sent with search', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
    renderMapRoute();
    await user.click(await screen.findByRole('button', { name: /Advanced search/i }));
    expect(screen.getByText('Topic')).toBeInTheDocument();
    const field = screen.getByText('Field');
    const topic = screen.getByText('Topic');
    const notes = screen.getByText('Field notes');
    expect(field.compareDocumentPosition(topic) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(topic.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByPlaceholderText('Keywords')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Community favorites' }));
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => {
      expect(searchPebbles).toHaveBeenCalledWith(expect.objectContaining({ favorites: true }));
    });
  });

  test('field note terms are added with return and sent together', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
    renderMapRoute();
    await user.click(await screen.findByRole('button', { name: /Advanced search/i }));
    const notes = screen.getByLabelText('Field notes');
    await user.type(notes, 'earth{Enter}ice{Enter}');
    expect(screen.getByRole('button', { name: 'earth ×' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ice ×' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => {
      expect(searchPebbles).toHaveBeenCalledWith(
        expect.objectContaining({ notes: ['earth', 'ice'] })
      );
    });
  });

  test('author search lists matching people', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
    const { fetchSearchSuggestions } = require('../helpers/searchHelpers');
    fetchSearchSuggestions.mockResolvedValue([
      {
        type: 'user',
        id: 'user-2',
        label: 'will',
        subtitle: '@will',
        username: 'will',
        value: 'will',
      },
      {
        type: 'user',
        id: 'user-18',
        label: 'William Nash',
        subtitle: '@wwn',
        username: 'wwn',
        value: 'wwn',
      },
    ]);
    renderMapRoute();
    await user.click(await screen.findByRole('button', { name: /Advanced search/i }));
    await user.type(screen.getByLabelText('Author'), 'will');
    expect(await screen.findByRole('button', { name: /@will/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /@wwn/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /@wwn/i }));
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => {
      expect(searchPebbles).toHaveBeenCalledWith(expect.objectContaining({ author: 'wwn' }));
    });
  });

  test('lists a match that is not pinned on the map', async () => {
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([
      { pebble_id: 9, title: 'Fish Islands', place_name: 'Fish Islands', like_count: 0 },
    ]);
    renderMapRoute();
    await screen.findByTestId('map-feed-panel');
    const { fetchSearchSuggestions } = require('../helpers/searchHelpers');
    fetchSearchSuggestions.mockResolvedValue([
      { type: 'place', id: 'p', label: 'Fish Islands', value: 'Fish Islands' },
    ]);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/search for pebbles/i), 'fish');
    await user.click(await screen.findByText('Fish Islands'));
    expect(await screen.findByRole('heading', { name: 'Fish Islands' })).toBeInTheDocument();
    expect(screen.getByTestId('pebble-map')).toHaveTextContent('pins:0');
  });

  test('media checkboxes are sent with search', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
    renderMapRoute();
    await user.click(await screen.findByRole('button', { name: /Advanced search/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Has photo' }));
    await user.click(screen.getByRole('checkbox', { name: 'Has video' }));
    await user.click(screen.getByRole('checkbox', { name: 'Has data' }));
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => {
      expect(searchPebbles).toHaveBeenCalledWith(
        expect.objectContaining({ hasPhoto: true, hasVideo: true, hasData: true })
      );
    });
  });

  test('Biology plus Has photo lists a match outside the camera and flies to it', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([
      {
        pebble_id: 1,
        title: 'In view',
        place_lat: 43.65,
        place_lng: -70.25,
        like_count: 0,
      },
    ]);
    searchPebbles.mockResolvedValue([
      {
        pebble_id: 8,
        title: 'Antarctic biology',
        place_lat: -75.2,
        place_lng: -0.1,
        fields: [{ field_id: 1, name: 'Biology' }],
        like_count: 0,
      },
    ]);
    renderMapRoute();
    expect(await screen.findByText('In view')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Set viewport' }));
    await user.click(screen.getByRole('button', { name: /Advanced search/i }));
    const { fetchSearchSuggestions } = require('../helpers/searchHelpers');
    fetchSearchSuggestions.mockResolvedValue([
      { type: 'field', id: 'field-1', label: 'Biology', field_id: 1, field_name: 'Biology', value: 'Biology' },
    ]);
    await user.type(screen.getByLabelText('Field'), 'Bio');
    await user.click(await screen.findByRole('button', { name: /Biology/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Has photo' }));
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(await screen.findByText('Antarctic biology')).toBeInTheDocument();
    expect(screen.queryByText('No pebbles yet.')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-focus')).toHaveTextContent('-75.2,-0.1');
    expect(searchPebbles).toHaveBeenCalledWith(
      expect.objectContaining({ fieldId: '1', hasPhoto: true })
    );
  });

  test('a search with no matches says nothing matched', async () => {
    const user = userEvent.setup();
    fetchFeed.mockResolvedValue([
      {
        pebble_id: 1,
        title: 'In view',
        place_lat: 43.65,
        place_lng: -70.25,
        like_count: 0,
      },
    ]);
    searchPebbles.mockResolvedValue([]);
    renderMapRoute();
    expect(await screen.findByText('In view')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Set viewport' }));
    await user.click(screen.getByRole('button', { name: /Advanced search/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Has photo' }));
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(await screen.findByText('Nothing matched.')).toBeInTheDocument();
    expect(screen.queryByText('No pebbles yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('In view')).not.toBeInTheDocument();
  });

  test('a published pebble opens the expanded map preview', async () => {
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
    fetchPebble.mockResolvedValue({
      pebble_id: 8,
      title: 'Shelf ice',
      description: 'At a glance',
      hero_image_url: 'https://example.com/ice.jpg',
      place_lat: 12,
      place_lng: 34,
      phenomena: [{ phenomenon_id: 1, name: 'ice' }],
    });
    renderMapRoute('/?mine=1&pebble=8');
    expect(await screen.findByTestId('map-pin-preview')).toHaveTextContent('Shelf ice');
    expect(screen.getByTestId('map-layout')).toHaveAttribute('data-layout', 'expanded');
    expect(screen.getByTestId('map-focus')).toHaveTextContent('12,34');
    await waitFor(() => {
      expect(searchPebbles).toHaveBeenCalledWith(expect.objectContaining({ mine: true }));
    });
  });

  test('phone keeps search over the map and a collapsed feed sheet', async () => {
    const user = userEvent.setup();
    mockMatchMedia((query) => query === MOBILE_WELCOME_QUERY);
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

    expect(await screen.findByTestId('map-layout')).toHaveAttribute('data-layout', 'sheet');
    expect(screen.getByTestId('map-feed-panel')).toHaveAttribute('data-sheet', 'peek');
    expect(screen.getByLabelText(/search for pebbles/i)).toHaveClass('text-base');
    expect(screen.queryByRole('button', { name: 'Expand map' })).not.toBeInTheDocument();
    expect(screen.queryByText('Portland')).not.toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand feed' }));
    expect(screen.getByTestId('map-feed-panel')).toHaveAttribute('data-sheet', 'open');
    expect(screen.getByText('Portland')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mine' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'New pebble' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse feed' }));
    expect(screen.getByTestId('map-feed-panel')).toHaveAttribute('data-sheet', 'peek');
    expect(screen.queryByText('Portland')).not.toBeInTheDocument();
  });

  test('phone still opens a focused pebble preview', async () => {
    mockMatchMedia((query) => query === MOBILE_WELCOME_QUERY);
    fetchFeed.mockResolvedValue([]);
    searchPebbles.mockResolvedValue([]);
    fetchPebble.mockResolvedValue({
      pebble_id: 8,
      title: 'Shelf ice',
      description: 'At a glance',
      place_lat: 12,
      place_lng: 34,
      phenomena: [],
    });
    renderMapRoute('/?pebble=8');
    expect(await screen.findByTestId('map-pin-preview')).toHaveTextContent('Shelf ice');
    expect(screen.getByTestId('map-layout')).toHaveAttribute('data-layout', 'sheet');
    expect(screen.getByTestId('map-focus')).toHaveTextContent('12,34');
  });
});
