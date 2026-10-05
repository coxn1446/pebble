import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import authReducer from '../store/auth.reducer';
import Settings from '../routes/Settings';
import { createMockUser } from './__mocks__/fetchMocks';

jest.mock('../helpers/userHelpers', () => ({
  fetchMe: jest.fn(),
  updateMe: jest.fn(),
}));

jest.mock('../helpers/organizationHelpers', () => ({
  searchOrganizations: jest.fn(),
}));

jest.mock('../helpers/placesHelpers', () => ({
  fetchPlacesApiKey: jest.fn(async () => ({ key: null, configured: false })),
}));

jest.mock('../helpers/notificationHelpers', () => ({
  fetchNotificationPreferences: jest.fn(async () => ({
    notify_on_follow: true,
    notify_on_like: true,
  })),
  updateNotificationPreferences: jest.fn(async () => ({
    notify_on_follow: true,
    notify_on_like: true,
  })),
}));

import { fetchMe, updateMe } from '../helpers/userHelpers';
import { updateNotificationPreferences } from '../helpers/notificationHelpers';

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMe.mockResolvedValue(
      createMockUser({
        profession: 'Biologist',
        field_of_study: 'Evolution',
        content_searchable: true,
      })
    );
    updateMe.mockResolvedValue(createMockUser({ content_searchable: false }));
  });

  test('loads profile and saves privacy toggle', async () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: { user: createMockUser(), isAuthenticated: true, isLoading: false },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Biologist')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Allow my content to appear in search/i));
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() =>
      expect(updateMe).toHaveBeenCalledWith(
        expect.objectContaining({ contentSearchable: false })
      )
    );
    expect(updateNotificationPreferences).toHaveBeenCalled();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  test('saves a profile blurb', async () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: { user: createMockUser(), isAuthenticated: true, isLoading: false },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </Provider>
    );

    const blurb = await screen.findByLabelText('Blurb');
    fireEvent.change(blurb, {
      target: { value: 'I watch ice shelves. The coast tells the story. Notes stay short.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() =>
      expect(updateMe).toHaveBeenCalledWith(
        expect.objectContaining({
          blurb: 'I watch ice shelves. The coast tells the story. Notes stay short.',
        })
      )
    );
  });
});
