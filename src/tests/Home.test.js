import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Home from '../routes/Home';
import authReducer from '../store/auth.reducer';
import { NativeProvider } from '../utils/NativeContext';

jest.mock('../helpers/pebbleHelpers', () => ({
  fetchPebble: jest.fn(),
  fetchFeed: jest.fn(),
  searchPebbles: jest.fn(),
}));

jest.mock('../helpers/userHelpers', () => ({
  fetchMapUsers: jest.fn(),
}));

jest.mock('../helpers/searchHelpers', () => ({
  fetchSearchSuggestions: jest.fn(async () => []),
}));

jest.mock('../components/Map/PebbleMap', () => {
  const MockPebbleMap = () => <div data-testid="pebble-map" />;
  return MockPebbleMap;
});

import { fetchFeed } from '../helpers/pebbleHelpers';
import { fetchMapUsers } from '../helpers/userHelpers';

const renderHome = (authState = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        ...authState,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <NativeProvider>
          <Home />
        </NativeProvider>
      </MemoryRouter>
    </Provider>
  );
};

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMapUsers.mockResolvedValue([]);
    fetchFeed.mockResolvedValue([]);
  });

  test('presents the welcome marketing page for guests', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'pebble' })).toBeInTheDocument();
    expect(
      screen.getByText(/a global ecosystem where educators and researchers pin real-world phenomena/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who is pebble for?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /building the nest/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How it Works' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore Pebbles' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('heading', { name: 'About Us' })).toBeInTheDocument();
    expect(screen.getByTestId('welcome-scroll')).toHaveClass('snap-y');
  });

  test('shows auth CTAs for guests', () => {
    renderHome();

    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/login');
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/register');
  });

  test('shows map for authenticated users', async () => {
    fetchFeed.mockResolvedValue([
      { pebble_id: 1, title: 'Portland', place_lat: 43.65, place_lng: -70.25 },
    ]);

    renderHome({
      isAuthenticated: true,
      user: { email: 'friend@example.com', user_id: 1, username: 'friend' },
    });

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
  });
});
