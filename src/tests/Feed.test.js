import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Feed from '../routes/Feed';
import { createMockPebble } from './__mocks__/fetchMocks';

jest.mock('../helpers/pebbleHelpers', () => ({
  fetchFeed: jest.fn(),
  searchPebbles: jest.fn(),
  likePebble: jest.fn(),
  unlikePebble: jest.fn(),
}));

jest.mock('../helpers/collectionHelpers', () => ({
  fetchCollections: jest.fn(),
  addPebbleToCollection: jest.fn(),
}));

import { fetchFeed } from '../helpers/pebbleHelpers';

describe('Feed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders pebbles from feed', async () => {
    fetchFeed.mockResolvedValue([createMockPebble()]);

    render(
      <MemoryRouter>
        <Feed />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Sample pebble')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /New pebble/i })).toBeInTheDocument();
  });

  test('shows empty state when feed is empty', async () => {
    fetchFeed.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Feed />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/No pebbles yet/i)).toBeInTheDocument()
    );
  });
});
