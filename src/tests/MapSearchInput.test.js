import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MapSearchInput from '../components/Map/MapSearchInput';

jest.mock('../helpers/searchHelpers', () => ({
  fetchSearchSuggestions: jest.fn(),
}));

import { fetchSearchSuggestions } from '../helpers/searchHelpers';

describe('MapSearchInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows suggestions and selects a user result', async () => {
    fetchSearchSuggestions.mockResolvedValue([
      {
        type: 'user',
        id: 'user-1',
        label: 'Kaitlin',
        subtitle: '@kaitlin',
        value: 'kaitlin',
        username: 'kaitlin',
      },
    ]);
    const onSelectSuggestion = jest.fn();
    const onChange = jest.fn();

    const { rerender } = render(
      <MapSearchInput
        value=""
        onChange={onChange}
        onSelectSuggestion={onSelectSuggestion}
        onOpenAdvanced={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Search people or places/i), {
      target: { value: 'Kait' },
    });
    expect(onChange).toHaveBeenCalledWith('Kait');

    rerender(
      <MapSearchInput
        value="Kait"
        onChange={onChange}
        onSelectSuggestion={onSelectSuggestion}
        onOpenAdvanced={jest.fn()}
      />
    );

    jest.advanceTimersByTime(250);

    expect(await screen.findByTestId('map-search-suggestions')).toBeInTheDocument();
    expect(screen.getByText('Kaitlin')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kaitlin'));
    expect(onSelectSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'user', username: 'kaitlin' })
    );
  });

  test('does not request suggestions for short input', async () => {
    render(
      <MapSearchInput
        value="K"
        onChange={jest.fn()}
        onSelectSuggestion={jest.fn()}
        onOpenAdvanced={jest.fn()}
      />
    );
    jest.advanceTimersByTime(250);
    await waitFor(() => expect(fetchSearchSuggestions).not.toHaveBeenCalled());
  });
});
