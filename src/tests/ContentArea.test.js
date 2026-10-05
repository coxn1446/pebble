import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import ContentArea from '../components/Layout/ContentArea';
import authReducer from '../store/auth.reducer';
import { createMockUser } from './__mocks__/fetchMocks';

jest.mock('../helpers/notificationHelpers', () => ({
  fetchNotifications: jest.fn(async () => ({ notifications: [], unreadCount: 0 })),
}));

const renderContentArea = (authState, initialEntries = ['/collections']) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <ContentArea>
          <div>Page content</div>
        </ContentArea>
      </MemoryRouter>
    </Provider>
  );
};

describe('ContentArea', () => {
  test('hides sidebar for unauthenticated users', () => {
    renderContentArea({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Map/i })).not.toBeInTheDocument();
  });

  test('uses edge-to-edge main for guest welcome on /', () => {
    renderContentArea(
      {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      },
      ['/']
    );

    const main = screen.getByText('Page content').closest('main');
    expect(main).toHaveClass('h-full', 'w-full', 'min-w-0');
    expect(main).not.toHaveClass('px-4');
    expect(screen.getByTestId('content-pane')).toHaveAttribute('data-layout', 'full');
    expect(screen.getByTestId('content-pane')).toHaveClass('overflow-hidden');
  });

  test('uses edge-to-edge main for guest marketing routes', () => {
    ['/how-it-works', '/about-us', '/login', '/register'].forEach((path) => {
      const { unmount } = renderContentArea(
        {
          user: null,
          isAuthenticated: false,
          isLoading: false,
        },
        [path]
      );

      const main = screen.getByText('Page content').closest('main');
      expect(main).toHaveClass('h-full', 'w-full', 'min-w-0');
      expect(screen.getByTestId('content-pane')).toHaveAttribute('data-layout', 'full');
      unmount();
    });
  });

  test('hides sidebar on marketing routes for authenticated users', () => {
    renderContentArea(
      {
        user: createMockUser(),
        isAuthenticated: true,
        isLoading: false,
      },
      ['/about-us']
    );

    expect(screen.queryByRole('link', { name: 'Map' })).not.toBeInTheDocument();
    expect(screen.getByTestId('content-pane')).toHaveAttribute('data-layout', 'full');
  });

  test('shows sidebar without Feed link for authenticated users', () => {
    renderContentArea({
      user: createMockUser(),
      isAuthenticated: true,
      isLoading: false,
    });

    expect(screen.getByRole('link', { name: 'Map' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Feed' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tutorial' })).toHaveAttribute('href', '/how-it-works');
    expect(screen.getByTestId('user-avatar-default').querySelector('svg')).toHaveAttribute(
      'data-icon',
      'penguin'
    );
    expect(screen.getByTestId('content-pane')).toHaveAttribute('data-layout', 'readable');
    expect(screen.getByTestId('content-pane')).toHaveClass('overflow-x-hidden');
    expect(screen.getByTestId('content-pane').parentElement).toHaveClass('h-dvh', 'max-h-dvh', 'overflow-hidden');
  });

  test('uses full-bleed content pane on map, profile, and settings', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: createMockUser(),
          isAuthenticated: true,
          isLoading: false,
        },
      },
    });

    const paths = ['/', '/profile', '/settings'];
    paths.forEach((path) => {
      const { unmount } = render(
        <Provider store={store}>
          <MemoryRouter initialEntries={[path]}>
            <ContentArea>
              <div>Page</div>
            </ContentArea>
          </MemoryRouter>
        </Provider>
      );
      expect(screen.getByTestId('content-pane')).toHaveAttribute('data-layout', 'full');
      unmount();
    });
  });
});
