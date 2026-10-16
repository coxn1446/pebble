import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../routes/Login';
import authReducer from '../store/auth.reducer';

const renderLogin = (initialEntry = '/login') => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, isAuthenticated: false, isLoading: false },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Login />
      </MemoryRouter>
    </Provider>
  );
};

describe('Login', () => {
  test('renders sign-in form without a public register link', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Sign in to pebble' })).toBeInTheDocument();
    document.querySelectorAll('[aria-label="Collect • Connect • Create"] [aria-hidden="true"]').forEach(
      (dot) => {
        expect(dot).toHaveClass('text-ink');
      }
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('researcher@institute.org')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /create one/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/no account/i)).not.toBeInTheDocument();

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/register');
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getByText('Email address').closest('label')).toHaveClass('text-left');

    const card = screen.getByRole('heading', { name: 'Sign in to pebble' }).closest('.border');
    expect(card).toHaveClass('border-border', 'bg-ocean/10');
    expect(card.closest('.bg-surface')).toBeTruthy();
    expect(card.closest('.overflow-y-auto')).toHaveClass('pt-safe-top', 'pb-safe-bottom');
    expect(card).toContainElement(screen.getByRole('img', { name: 'Pebble' }));
    expect(card).toContainElement(screen.getByRole('link', { name: 'Continue with Apple' }));
    expect(screen.getByRole('button', { name: 'Sign in' }).querySelector('img')).toHaveClass(
      'h-8',
      'w-8',
      'group-hover:brightness-0',
      'group-hover:invert'
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveClass('group', 'px-6', 'py-1.5');
  });

  test('explains a failed Google sign-in', async () => {
    renderLogin('/login?error=google');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sign in did not complete'));
  });
});
