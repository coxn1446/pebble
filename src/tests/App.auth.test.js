import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import authReducer from '../store/auth.reducer';
import App from '../components/App';
import { createAuthFetchMock, createMockUser } from './__mocks__/fetchMocks';

jest.mock('../utils/NativeContext', () => ({
  NativeProvider: ({ children }) => children,
  useNative: () => ({ isNative: false, platform: 'web' }),
}));

const renderApp = (initialEntries, authState) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </Provider>
  );
};

describe('App auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows welcome page for unauthenticated users on / without sidebar', async () => {
    global.fetch = jest.fn(createAuthFetchMock(false));

    renderApp(['/'], {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'pebble' })).toBeInTheDocument()
    );
    expect(screen.queryByRole('link', { name: /Map/i })).not.toBeInTheDocument();
  });

  test('unknown /feed path redirects home for authenticated users', async () => {
    global.fetch = jest.fn(createAuthFetchMock(true, createMockUser()));

    renderApp(['/feed'], {
      user: createMockUser(),
      isAuthenticated: true,
      isLoading: false,
    });

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument());
  });

  test('keeps unlisted /register available for account creation', async () => {
    global.fetch = jest.fn(createAuthFetchMock(false));

    renderApp(['/register'], {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Create account/i })).toBeInTheDocument()
    );
  });

  test('protects /profile for guests', async () => {
    global.fetch = jest.fn(createAuthFetchMock(false));

    renderApp(['/profile'], {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Sign in/i })).toBeInTheDocument()
    );
  });

  test('serves how it works and about us marketing routes for guests', async () => {
    global.fetch = jest.fn(createAuthFetchMock(false));

    const { unmount } = renderApp(['/how-it-works'], {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'How it Works' })).toBeInTheDocument()
    );
    expect(screen.getByRole('link', { name: 'Explore Pebbles' })).toHaveAttribute('href', '/login');
    unmount();

    renderApp(['/about-us'], {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'About Us' })).toBeInTheDocument()
    );
    expect(screen.getByRole('heading', { name: /how we're different/i })).toBeInTheDocument();
  });
});
