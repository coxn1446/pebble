import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CollectionDetail from '../routes/CollectionDetail';
import authReducer from '../store/auth.reducer';
import { deleteCollection, fetchCollection } from '../helpers/collectionHelpers';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../helpers/collectionHelpers', () => ({
  fetchCollection: jest.fn(),
  deleteCollection: jest.fn(),
  acceptCollectionInvite: jest.fn(),
  inviteToCollection: jest.fn(),
  removePebbleFromCollection: jest.fn(),
}));

const renderDetail = (userId) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { user_id: userId, username: userId === 1 ? 'ada' : 'bob' },
        isAuthenticated: true,
        isLoading: false,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/collections/4']}>
        <Routes>
          <Route path="/collections/:id" element={<CollectionDetail />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('CollectionDetail delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchCollection.mockResolvedValue({
      collection_id: 4,
      owner_id: 1,
      name: 'Climate Science',
      is_private: false,
      is_collaborative: false,
      members: [],
      pebbles: [{ pebble_id: 9, title: 'Shelf ice' }],
    });
  });

  test('a visitor does not get delete', async () => {
    renderDetail(2);
    expect(await screen.findByRole('heading', { name: 'Climate Science' })).toBeInTheDocument();
    expect(screen.getByText('Shelf ice')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete collection' })).not.toBeInTheDocument();
  });

  test('the owner confirms before the collection is deleted', async () => {
    const user = userEvent.setup();
    deleteCollection.mockResolvedValue({ success: true });
    renderDetail(1);
    await user.click(await screen.findByRole('button', { name: 'Delete collection' }));
    expect(screen.getByTestId('delete-collection-modal')).toHaveTextContent('Climate Science');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deleteCollection).toHaveBeenCalledWith('4'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});
