import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PebbleNew from '../routes/PebbleNew';
import { createPebble } from '../helpers/pebbleHelpers';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/Pebbles/PebbleForm', () => ({ onSubmit }) => (
  <button type="button" onClick={() => onSubmit({ title: 'Shelf ice', pebbleId: null })}>
    Publish now
  </button>
));

jest.mock('../helpers/pebbleHelpers', () => ({
  createPebble: jest.fn(),
  updatePebble: jest.fn(),
  publishedMapPath: (pebble) => `/?mine=1&pebble=${pebble.pebble_id}`,
}));

describe('PebbleNew publish', () => {
  test('publish opens the map on that pebble', async () => {
    createPebble.mockResolvedValue({ pebble_id: 15, title: 'Shelf ice' });
    render(
      <MemoryRouter>
        <PebbleNew />
      </MemoryRouter>
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Publish now' }));
    expect(mockNavigate).toHaveBeenCalledWith('/?mine=1&pebble=15');
  });
});
