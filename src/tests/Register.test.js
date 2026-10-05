import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Register from '../routes/Register';
import authReducer from '../store/auth.reducer';

const renderRegister = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, isAuthenticated: false, isLoading: false },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </Provider>
  );
};

describe('Register', () => {
  test('keeps the unlisted create-account form available', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    const form = screen.getByRole('heading', { name: 'Create account' }).closest('.overflow-y-auto');
    expect(form).toHaveClass('pt-safe-top', 'pb-safe-bottom', 'overflow-y-auto');
  });
});
