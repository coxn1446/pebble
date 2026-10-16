import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Profile from '../routes/Profile';
import authReducer from '../store/auth.reducer';
import { fetchUserProfile } from '../helpers/userHelpers';

jest.mock('../helpers/userHelpers', () => ({
  fetchUserProfile: jest.fn(),
}));

jest.mock('../helpers/collectionHelpers', () => ({
  fetchCollections: jest.fn(async () => []),
  addPebbleToCollection: jest.fn(),
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

  test('drafts and published pebbles are opened, not deleted from the profile', async () => {
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

    renderProfile();

    expect(await screen.findByRole('link', { name: 'Unfinished shelf' })).toHaveAttribute(
      'href',
      '/pebbles/1/edit'
    );
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    const gallery = screen.getByTestId('profile-gallery');
    expect(within(gallery).getByText('Published shelf')).toBeInTheDocument();
  });
});
