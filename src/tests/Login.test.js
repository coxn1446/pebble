import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../routes/Login';
import authReducer from '../store/auth.reducer';

const renderLogin = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, isAuthenticated: false, isLoading: false },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>
  );
};

describe('Login', () => {
  test('renders sign-in form without a public register link', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Sign in to Pebble' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('researcher@institute.org')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /create one/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/no account/i)).not.toBeInTheDocument();

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/register');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveClass('bg-ocean/10');
    expect(screen.getByRole('contentinfo').parentElement).toHaveClass('bg-surface');

    const card = screen.getByRole('heading', { name: 'Sign in to Pebble' }).closest('.border');
    expect(card).toHaveClass('border-border', 'bg-ocean/10');
    expect(card).toContainElement(screen.getByRole('img', { name: 'Pebble' }));
    expect(card).toContainElement(screen.getByRole('link', { name: 'Continue with Apple' }));
    expect(card).not.toContainElement(screen.getByRole('contentinfo'));
    expect(screen.getByRole('button', { name: 'Sign in' }).querySelector('img')).toHaveClass(
      'h-12',
      'w-12'
    );
  });
});
