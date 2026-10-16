import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
  deleteCollection: jest.fn(),
}));

jest.mock('../helpers/socialHelpers', () => ({
  blockUser: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
}));

const renderPublicProfile = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { user_id: 2, username: 'bob' },
        isAuthenticated: true,
        isLoading: false,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/u/ada']}>
        <Routes>
          <Route path="/u/:username" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('Profile blurb', () => {
  test('shows a blurb under the follower counts on a public profile', async () => {
    fetchUserProfile.mockResolvedValue({
      user: {
        user_id: 1,
        username: 'ada',
        display_name: 'Ada',
        follower_count: 3,
        following_count: 1,
        blurb: 'I watch ice shelves. The coast tells the story. Notes stay short.',
      },
      pebbles: [],
    });

    renderPublicProfile();

    const blurb = await screen.findByTestId('profile-blurb');
    const followers = screen.getByRole('button', { name: /Followers/i });
    const name = screen.getByRole('heading', { name: 'Ada' });
    expect(blurb).toHaveTextContent('I watch ice shelves. The coast tells the story. Notes stay short.');
    expect(name.compareDocumentPosition(blurb) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(followers.compareDocumentPosition(blurb) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tutorial' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
  });

  test('renders nothing when the blurb is empty', async () => {
    fetchUserProfile.mockResolvedValue({
      user: {
        user_id: 1,
        username: 'ada',
        display_name: 'Ada',
        follower_count: 0,
        following_count: 0,
        blurb: '   ',
      },
      pebbles: [],
    });

    renderPublicProfile();

    expect(await screen.findByRole('heading', { name: 'Ada' })).toBeInTheDocument();
    expect(screen.queryByTestId('profile-blurb')).not.toBeInTheDocument();
  });
});
