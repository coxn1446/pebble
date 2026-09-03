import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import UserListModal from '../components/Profile/UserListModal';

jest.mock('../helpers/userHelpers', () => ({
  fetchFollowers: jest.fn(),
  fetchFollowing: jest.fn(),
}));

import { fetchFollowers, fetchFollowing } from '../helpers/userHelpers';

describe('UserListModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads followers list', async () => {
    fetchFollowers.mockResolvedValue([
      { user_id: 2, username: 'ada', display_name: 'Ada' },
    ]);

    render(
      <MemoryRouter>
        <UserListModal username="testuser" mode="followers" onClose={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Followers' })).toBeInTheDocument();
    expect(fetchFollowers).toHaveBeenCalledWith('testuser');
  });

  test('loads following list and empty state', async () => {
    fetchFollowing.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <UserListModal username="testuser" mode="following" onClose={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/No users yet/i)).toBeInTheDocument());
    expect(fetchFollowing).toHaveBeenCalledWith('testuser');
  });
});
