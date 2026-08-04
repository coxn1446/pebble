import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Home from '../routes/Home';
import authReducer from '../store/auth.reducer';
import { BRAND_TAGLINE } from '../components/Brand/BrandMark';
import { NativeProvider } from '../utils/NativeContext';

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
  test('presents the pebble brand concept and tagline', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'pebble' })).toBeInTheDocument();
    expect(screen.getByText(BRAND_TAGLINE)).toBeInTheDocument();
    expect(
      screen.getByText(/share meaningful discoveries and build a network of knowledge/i)
    ).toBeInTheDocument();
  });

  test('shows auth CTAs for guests', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  test('hides auth CTAs and shows signed-in email when authenticated', () => {
    renderHome({
      isAuthenticated: true,
      user: { email: 'friend@example.com' },
    });

    expect(screen.queryByRole('link', { name: 'Create account' })).not.toBeInTheDocument();
    expect(screen.getByText('friend@example.com')).toBeInTheDocument();
  });
});
