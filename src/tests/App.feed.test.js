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

describe('App map home integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(createAuthFetchMock(true, createMockUser()));
  });

  test('shows map home without a Feed nav item', async () => {
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

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Map' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Feed' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument();
  });
});
