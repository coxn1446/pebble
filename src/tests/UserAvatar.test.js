import React from 'react';
import { render, screen } from '@testing-library/react';
import UserAvatar from '../components/Profile/UserAvatar';

describe('UserAvatar', () => {
  test('renders default animal avatar when no photo', () => {
    render(<UserAvatar user={{ user_id: 7, username: 'fox' }} />);
    expect(screen.getByTestId('user-avatar-default')).toBeInTheDocument();
    expect(screen.getByLabelText('fox')).toBeInTheDocument();
  });

  test('renders image when profile_pic_url is present', () => {
    render(
      <UserAvatar
        user={{ user_id: 7, username: 'fox', profile_pic_url: '/uploads/a.png' }}
      />
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', '/uploads/a.png');
  });
});
