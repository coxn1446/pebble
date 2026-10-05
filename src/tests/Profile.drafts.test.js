import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Profile from '../routes/Profile';
import authReducer from '../store/auth.reducer';
import { fetchUserProfile } from '../helpers/userHelpers';
import { deletePebble } from '../helpers/pebbleHelpers';

jest.mock('../helpers/userHelpers', () => ({
  fetchUserProfile: jest.fn(),
}));

jest.mock('../helpers/collectionHelpers', () => ({
  fetchCollections: jest.fn(async () => []),
  addPebbleToCollection: jest.fn(),
}));

jest.mock('../helpers/pebbleHelpers', () => ({
  ...jest.requireActual('../helpers/pebbleHelpers'),
  deletePebble: jest.fn(),
}));

jest.mock('../helpers/socialHelpers', () => ({
  blockUser: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
}));

const me = { user_id: 1, username: 'ada' };

const renderProfile = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: me, isAuthenticated: true, isLoading: false },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </Provider>
  );
};

describe('Profile drafts', () => {
  test('lists drafts separately from published pebbles', async () => {
    fetchUserProfile.mockResolvedValue({
      user: { ...me, display_name: 'Ada', follower_count: 0, following_count: 0 },
      pebbles: [
        { pebble_id: 1, status: 'draft', title: 'Unfinished shelf', author_id: 1 },
        {
          pebble_id: 2,
          status: 'published',
          title: 'Published shelf',
          author_id: 1,
          author_username: 'ada',
          description: 'Done',
          phenomena: [],
          like_count: 0,
        },
      ],
    });

    renderProfile();

    expect(await screen.findByRole('heading', { name: 'Drafts' })).toBeInTheDocument();
    const draft = screen.getByRole('link', { name: 'Unfinished shelf' });
    expect(draft).toHaveAttribute('href', '/pebbles/1/edit');
    const gallery = screen.getByTestId('profile-gallery');
    expect(within(gallery).getByText('Published shelf')).toBeInTheDocument();
    expect(within(gallery).queryByText('Unfinished shelf')).not.toBeInTheDocument();
  });

  test('the owner confirms before a draft or a published pebble is deleted', async () => {
    const user = userEvent.setup();
    fetchUserProfile.mockResolvedValue({
      user: { ...me, display_name: 'Ada', follower_count: 0, following_count: 0 },
      pebbles: [
        { pebble_id: 1, status: 'draft', title: 'Unfinished shelf', author_id: 1 },
        {
          pebble_id: 2,
          status: 'published',
          title: 'Published shelf',
          author_id: 1,
          phenomena: [],
          like_count: 0,
        },
      ],
    });
    deletePebble.mockResolvedValue({ success: true });

    renderProfile();

    await user.click(await screen.findByRole('button', { name: 'Delete Unfinished shelf' }));
    expect(screen.getByTestId('delete-pebble-modal')).toHaveTextContent(
      'Are you sure? Deletion is permanent.'
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deletePebble).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete Published shelf' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deletePebble).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByText('Published shelf')).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Unfinished shelf' })).toBeInTheDocument();
  });
});
