import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SaveToCollectionsDialog from '../components/Collections/SaveToCollectionsDialog';

jest.mock('../helpers/collectionHelpers', () => ({
  fetchCollections: jest.fn(),
  addPebbleToCollection: jest.fn(),
}));

import { addPebbleToCollection, fetchCollections } from '../helpers/collectionHelpers';

describe('SaveToCollectionsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('multi-selects collections and saves to each', async () => {
    fetchCollections.mockResolvedValue([
      { collection_id: 1, name: 'A', is_private: false },
      { collection_id: 2, name: 'B', is_private: false },
    ]);
    addPebbleToCollection.mockResolvedValue({});
    const onClose = jest.fn();

    render(
      <MemoryRouter>
        <SaveToCollectionsDialog pebbleId={10} onClose={onClose} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('checkbox', { name: /^A/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('checkbox', { name: /^A/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^B/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(addPebbleToCollection).toHaveBeenCalledWith(1, 10);
      expect(addPebbleToCollection).toHaveBeenCalledWith(2, 10);
    });
    expect(onClose).toHaveBeenCalled();
  });

  test('shows empty state when user has no collections', async () => {
    fetchCollections.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <SaveToCollectionsDialog pebbleId={10} onClose={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/No collections yet/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Create one/i })).toHaveAttribute(
      'href',
      '/collections'
    );
  });
});
