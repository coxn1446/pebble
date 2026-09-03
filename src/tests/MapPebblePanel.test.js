import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MapPebblePanel from '../components/Map/MapPebblePanel';
import { createMockPebble } from './__mocks__/fetchMocks';

jest.mock('../components/FieldNotes/FieldNotesViewer', () => {
  const MockViewer = () => <div data-testid="field-notes-viewer" />;
  return MockViewer;
});

describe('MapPebblePanel', () => {
  test('shows loading state', () => {
    render(
      <MemoryRouter>
        <MapPebblePanel groupPins={[]} loading onClose={jest.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Loading pebble…')).toBeInTheDocument();
  });

  test('shows group list for multiple pins', async () => {
    const user = userEvent.setup();
    const onSelectPebble = jest.fn();
    const groupPins = [
      {
        pebble_id: 1,
        title: 'Portland A',
        place_name: 'Portland, ME',
        author_username: 'a',
      },
      {
        pebble_id: 2,
        title: 'Portland B',
        place_name: 'Portland, ME',
        author_username: 'b',
      },
    ];

    render(
      <MemoryRouter>
        <MapPebblePanel
          groupPins={groupPins}
          onClose={jest.fn()}
          onSelectPebble={onSelectPebble}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('2 pebbles at Portland, ME')).toBeInTheDocument();
    expect(screen.getByTestId('map-pebble-group-list')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Portland A/i }));
    expect(onSelectPebble).toHaveBeenCalledWith(groupPins[0]);
  });

  test('renders pebble details with back to list for groups', async () => {
    const user = userEvent.setup();
    const onBackToGroup = jest.fn();
    const pebble = createMockPebble({
      title: 'Casco Bay notes',
      description: 'A discovery',
      place_name: 'Portland, ME',
      phenomena: [{ phenomenon_id: 1, name: 'tides', field_name: 'Oceanography' }],
    });

    render(
      <MemoryRouter>
        <MapPebblePanel
          groupPins={[{ pebble_id: 10 }, { pebble_id: 11 }]}
          pebble={pebble}
          onClose={jest.fn()}
          onBackToGroup={onBackToGroup}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Casco Bay notes' })).toBeInTheDocument();
    expect(screen.getByText('A discovery')).toBeInTheDocument();
    expect(screen.getByText('Oceanography: tides')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open pebble' })).toHaveAttribute(
      'href',
      '/pebbles/10'
    );

    await user.click(screen.getByRole('button', { name: 'Back to list' }));
    expect(onBackToGroup).toHaveBeenCalled();
  });
});
