import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentArea from '../components/Layout/ContentArea';
import { MOBILE_WELCOME_QUERY } from '../components/Welcome/WelcomeShared';
import authReducer from '../store/auth.reducer';
import { createMockUser } from './__mocks__/fetchMocks';

jest.mock('../helpers/notificationHelpers', () => ({
  fetchNotifications: jest.fn(async () => ({ notifications: [], unreadCount: 0 })),
}));

jest.mock('../helpers/userHelpers', () => ({
  fetchUserProfile: jest.fn(async () => ({ user: { username: 'ada' }, pebbles: [] })),
}));

jest.mock('../helpers/collectionHelpers', () => ({
  fetchCollections: jest.fn(async () => []),
  createCollection: jest.fn(),
  inviteToCollection: jest.fn(),
  addPebbleToCollection: jest.fn(),
}));

jest.mock('../helpers/searchHelpers', () => ({
  fetchSearchSuggestions: jest.fn(async () => []),
}));

const mockMatchMedia = (matches) => {
  window.matchMedia.mockImplementation((query) => ({
    matches: typeof matches === 'function' ? matches(query) : Boolean(matches),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

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
  beforeEach(() => {
    mockMatchMedia(false);
  });

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

  test('shows the sidebar with Tutorial and Sign out for authenticated users', () => {
    renderContentArea({
      user: createMockUser(),
      isAuthenticated: true,
      isLoading: false,
    });

    expect(screen.getByRole('link', { name: 'Map' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Feed' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tutorial' })).toHaveAttribute('href', '/how-it-works');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-tab-bar')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-avatar-default').querySelector('svg')).toHaveAttribute(
      'data-icon',
      'penguin'
    );
    expect(screen.getByTestId('content-pane')).toHaveAttribute('data-layout', 'readable');
    expect(screen.getByTestId('content-pane')).toHaveClass('overflow-x-hidden');
    expect(screen.getByTestId('content-pane').parentElement).toHaveClass('h-dvh', 'max-h-dvh', 'overflow-hidden');
    expect(screen.getByTestId('content-pane').parentElement).not.toHaveClass('flex-col');
  });

  test('uses a bottom tab bar on a phone', () => {
    mockMatchMedia((query) => query === MOBILE_WELCOME_QUERY);
    const { unmount } = renderContentArea(
      {
        user: createMockUser(),
        isAuthenticated: true,
        isLoading: false,
      },
      ['/notifications']
    );

    const bar = screen.getByTestId('mobile-tab-bar');
    expect(bar).toHaveClass('pb-safe-bottom');
    expect(bar.querySelector('.grid')).toHaveClass('grid-cols-4');
    expect(screen.getByRole('link', { name: 'Map' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Notifications/i })).toHaveAttribute('href', '/notifications');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toHaveAttribute('href', '/profile');
    expect(screen.queryByRole('link', { name: 'Tutorial' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.getByTestId('content-pane').parentElement).toHaveClass('flex-col');
    expect(screen.getByText('Page content').closest('main')).toHaveClass('px-4');
    unmount();

    renderContentArea(
      {
        user: createMockUser(),
        isAuthenticated: true,
        isLoading: false,
      },
      ['/']
    );
    expect(screen.getByText('Page content').closest('main')).not.toHaveClass('px-4');
    expect(screen.getByTestId('mobile-tab-bar')).toBeInTheDocument();
  });

  test('the phone create tab opens pebble or collection', async () => {
    const user = userEvent.setup();
    mockMatchMedia((query) => query === MOBILE_WELCOME_QUERY);
    renderContentArea(
      {
        user: createMockUser(),
        isAuthenticated: true,
        isLoading: false,
      },
      ['/profile']
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('link', { name: 'Pebble' })).toHaveAttribute('href', '/pebbles/new');
    await user.click(screen.getByRole('button', { name: 'Collection' }));
    expect(screen.getByTestId('create-collection-form')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Private' })).toBeInTheDocument();
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
