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
  addPebbleToCollection,
  createCollection,
  deleteCollection,
  fetchCollections,
  inviteToCollection,
} from '../helpers/collectionHelpers';
import { fetchSearchSuggestions } from '../helpers/searchHelpers';
import { uploadFile } from '../helpers/uploadHelpers';

jest.mock('../helpers/userHelpers', () => ({
  fetchUserProfile: jest.fn(),
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
  });

  test('rows view lists the same order', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByTestId('profile-gallery');
    await user.click(screen.getByRole('button', { name: 'Rows' }));
    const rows = screen.getByTestId('profile-rows');
    expect(rows).toHaveTextContent('Antarctica');
    expect(rows).toHaveTextContent('Newer ice');
    expect(rows.textContent.indexOf('Antarctica')).toBeLessThan(rows.textContent.indexOf('Newer ice'));
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
    await user.type(screen.getByRole('textbox'), 'Field team');
    await user.click(screen.getByRole('checkbox', { name: 'Collaborate' }));
    expect(screen.getByTestId('invite-popover')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Name or username'), 'be');
    await user.click(await screen.findByRole('button', { name: /Bea/ }));
    await user.click(screen.getByRole('button', { name: 'Create collection' }));
    expect(createCollection).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Field team', isCollaborative: true })
    );
    expect(inviteToCollection).toHaveBeenCalledWith(9, 4);
  });

  test('add selects pebbles by click', async () => {
    const user = userEvent.setup();
    addPebbleToCollection.mockResolvedValue({});
    renderProfile();
    await user.click(await screen.findByRole('button', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: 'Newer ice' }));
    await user.click(screen.getByRole('button', { name: 'Older ice' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(addPebbleToCollection).toHaveBeenCalledWith(7, 3);
    expect(addPebbleToCollection).toHaveBeenCalledWith(7, 2);
  });

  test('the owner deletes a collection after confirming, and a shared collection has no delete', async () => {
    const user = userEvent.setup();
    fetchCollections
      .mockResolvedValueOnce([
        {
          collection_id: 7,
          owner_id: 1,
          name: 'Climate Science',
          pebble_ids: [],
        },
        {
          collection_id: 8,
          owner_id: 9,
          name: 'Shared shelf',
          pebble_ids: [],
        },
      ])
      .mockResolvedValueOnce([]);
    deleteCollection.mockResolvedValue({ success: true });
    renderProfile();
    expect(await screen.findByRole('button', { name: 'Delete Climate Science' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Shared shelf' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Climate Science' }));
    expect(screen.getByTestId('delete-collection-modal')).toHaveTextContent('Climate Science');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteCollection).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete Climate Science' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deleteCollection).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.queryByText('Climate Science')).not.toBeInTheDocument());
  });
});
