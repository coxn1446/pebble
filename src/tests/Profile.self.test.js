import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Profile from '../routes/Profile';
import authReducer from '../store/auth.reducer';
import { fetchMyProfile, fetchUserProfile } from '../helpers/userHelpers';

jest.mock('../helpers/userHelpers', () => ({
  fetchMyProfile: jest.fn(),
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

describe('own profile without a username', () => {
  test('loads the signed-in profile instead of staying on Loading', async () => {
    fetchMyProfile.mockResolvedValue({
      user: {
        user_id: 17,
        username: 'williamwildernash',
        display_name: 'William Nash',
        follower_count: 0,
        following_count: 0,
      },
      pebbles: [],
    });

    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: { user_id: 17, username: null, display_name: 'William Nash' },
          isAuthenticated: true,
          isLoading: false,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </Provider>
    );

    expect(await screen.findByRole('heading', { name: 'William Nash' })).toBeInTheDocument();
    expect(screen.getByText('@williamwildernash')).toBeInTheDocument();
    expect(fetchMyProfile).toHaveBeenCalled();
    expect(fetchUserProfile).not.toHaveBeenCalled();
  });
});