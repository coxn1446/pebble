import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Profile from '../routes/Profile';
import authReducer from '../store/auth.reducer';
import { fetchUserProfile } from '../helpers/userHelpers';
import {
  createCollection,
  fetchCollections,
  inviteToCollection,
} from '../helpers/collectionHelpers';
import { fetchSearchSuggestions } from '../helpers/searchHelpers';
import { uploadFile } from '../helpers/uploadHelpers';
import { logout } from '../helpers/authHelpers';
import { MOBILE_WELCOME_QUERY } from '../components/Welcome/WelcomeShared';

jest.mock('../helpers/userHelpers', () => ({
  fetchUserProfile: jest.fn(),
  fetchMe: jest.fn(async () => ({
    user_id: 1,
    username: 'ada',
    display_name: 'Ada',
    content_searchable: true,
  })),
  updateMe: jest.fn(),
}));

jest.mock('../helpers/socialHelpers', () => ({
  blockUser: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
}));

jest.mock('../helpers/collectionHelpers', () => ({
  fetchCollections: jest.fn(),
  createCollection: jest.fn(),
  inviteToCollection: jest.fn(),
  addPebbleToCollection: jest.fn(),
  deleteCollection: jest.fn(),
}));

jest.mock('../helpers/searchHelpers', () => ({
  fetchSearchSuggestions: jest.fn(),
}));

jest.mock('../helpers/uploadHelpers', () => ({
  uploadFile: jest.fn(),
}));

jest.mock('../helpers/authHelpers', () => ({
  logout: jest.fn(async () => {}),
}));

jest.mock('../helpers/notificationHelpers', () => ({
  fetchNotificationPreferences: jest.fn(async () => ({})),
  updateNotificationPreferences: jest.fn(),
}));

jest.mock('../helpers/organizationHelpers', () => ({
  searchOrganizations: jest.fn(async () => []),
}));

const me = { user_id: 1, username: 'ada' };

const renderProfile = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: me, isAuthenticated: true, isLoading: false } },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </Provider>
  );
};

const profilePayload = {
  user: { ...me, display_name: 'Ada', follower_count: 0, following_count: 0 },
  pebbles: [
    {
      pebble_id: 2,
      status: 'published',
      title: 'Older ice',
      observed_at: '2020-01-01T00:00:00.000Z',
      hero_image_url: 'https://example.com/old.jpg',
      author_id: 1,
      phenomena: [],
    },
    {
      pebble_id: 3,
      status: 'published',
      title: 'Newer ice',
      observed_at: '2024-06-01T00:00:00.000Z',
      author_id: 1,
      phenomena: [],
      fields: [{ name: 'Climate Science' }],
    },
  ],
};

describe('Profile collections', () => {
  beforeEach(() => {
    fetchUserProfile.mockResolvedValue(profilePayload);
    fetchCollections.mockResolvedValue([
      {
        collection_id: 7,
        name: 'Antarctica',
        cover_image_url: 'https://example.com/cover.jpg',
        pebble_ids: [2],
      },
    ]);
  });

  test('puts the collection tile before unsorted pebbles, newest observation first', async () => {
    renderProfile();
    const gallery = await screen.findByTestId('profile-gallery');
    const labels = [...gallery.querySelectorAll('a')].map((node) => node.getAttribute('aria-label'));
    expect(labels).toEqual(['Antarctica', 'Newer ice']);
    expect(screen.queryByText('Older ice')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Map' })).toHaveAttribute('href', '/?mine=1');
    expect(screen.getByTestId('profile-collections')).toHaveClass('grid-cols-3');
    expect(screen.getByTestId('profile-pebble-grid')).toHaveClass('grid-cols-3');
    expect(screen.getByText('Pebbles').closest('p')).toHaveTextContent('2');
  });

  test('your profile links edit profile, and sign out stays off the page', async () => {
    renderProfile();
    expect(await screen.findByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/settings');
    expect(screen.queryByRole('link', { name: 'Tutorial' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gallery' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rows' })).not.toBeInTheDocument();
  });

  test('collaborate opens an invite popover and sends the invite', async () => {
    const user = userEvent.setup();
    fetchCollections.mockResolvedValue([]);
    createCollection.mockResolvedValue({ collection_id: 9, name: 'Field team' });
    fetchSearchSuggestions.mockResolvedValue([
      { type: 'user', user_id: 4, username: 'bea', label: 'Bea', subtitle: '@bea' },
    ]);
    uploadFile.mockResolvedValue({ media_url: 'https://example.com/cover.jpg' });
    renderProfile();
    await user.click(await screen.findByRole('button', { name: 'New collection' }));
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Field team');
    await user.type(screen.getByRole('textbox', { name: 'Add collaborators' }), 'be');
    await user.click(await screen.findByRole('button', { name: /Bea/ }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(createCollection).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Field team', isCollaborative: true })
    );
    expect(inviteToCollection).toHaveBeenCalledWith(9, 4);
  });

  test('the gallery has no add or delete controls', async () => {
    renderProfile();
    expect(await screen.findByRole('link', { name: 'Antarctica' })).toHaveAttribute('href', '/collections/7');
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });

  test('a phone profile keeps edit, drafts, and sign out in the menu', async () => {
    const user = userEvent.setup();
    window.matchMedia.mockImplementation((query) => ({
      matches: query === MOBILE_WELCOME_QUERY,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    renderProfile();
    expect(await screen.findByRole('button', { name: 'Profile menu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'New pebble' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit profile' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Profile menu' }));
    await user.click(screen.getByRole('button', { name: 'Drafts' }));
    const drafts = screen.getByTestId('drafts-modal');
    expect(drafts).toHaveClass('fixed', 'pt-safe-top', 'pb-safe-bottom');
    expect(drafts.querySelector('[role="dialog"]')).toHaveClass('rounded-2xl', 'h-full');
    expect(drafts.querySelector('[role="dialog"]')).not.toHaveClass('h-dvh');
    expect(drafts).toHaveTextContent('No drafts.');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('drafts-modal')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Profile menu' }));
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    expect(await screen.findByTestId('edit-profile-modal')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Profile menu' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(logout).toHaveBeenCalled();

    window.matchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });
});
