import React from 'react';
import { render, screen } from '@testing-library/react';
import UserAvatar from '../components/Profile/UserAvatar';
import { getDefaultAvatarColorClass } from '../helpers/avatarHelpers';

describe('UserAvatar', () => {
  test('renders a penguin on that person’s color when no photo is set', () => {
    render(<UserAvatar user={{ user_id: 7, username: 'fox' }} />);
    const mark = screen.getByTestId('user-avatar-default');
    expect(mark).toHaveClass(getDefaultAvatarColorClass(7));
    expect(mark.querySelector('svg')).toHaveAttribute('data-icon', 'penguin');
    expect(screen.getByLabelText('fox')).toBeInTheDocument();
    expect(mark.textContent).not.toMatch(/🦊|🦁|🐯/);
  });

  test('gives two people different color backgrounds', () => {
    const firstId = 1;
    const secondId = [2, 3, 4, 5, 6, 7, 8, 9, 10].find(
      (id) => getDefaultAvatarColorClass(id) !== getDefaultAvatarColorClass(firstId)
    );
    const { rerender } = render(<UserAvatar user={{ user_id: firstId, username: 'ada' }} />);
    expect(screen.getByTestId('user-avatar-default')).toHaveClass(getDefaultAvatarColorClass(firstId));
    rerender(<UserAvatar user={{ user_id: secondId, username: 'bea' }} />);
    const mark = screen.getByTestId('user-avatar-default');
    expect(mark).toHaveClass(getDefaultAvatarColorClass(secondId));
    expect(mark).not.toHaveClass(getDefaultAvatarColorClass(firstId));
    expect(mark.querySelector('svg')).toHaveAttribute('data-icon', 'penguin');
  });

  test('renders image when profile_pic_url is present', () => {
    render(
      <UserAvatar
        user={{ user_id: 7, username: 'fox', profile_pic_url: '/uploads/a.png' }}
      />
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', '/uploads/a.png');
    expect(screen.queryByTestId('user-avatar-default')).not.toBeInTheDocument();
  });
});
