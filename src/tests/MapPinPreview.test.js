import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MapPinPreview from '../components/Map/MapPinPreview';

describe('MapPinPreview', () => {
  test('shows phenomenon and other-tag chips', () => {
    render(
      <MemoryRouter>
        <MapPinPreview
          pebble={{
            pebble_id: 21,
            title: 'Scorpion',
            phenomena: [{ phenomenon_id: 40, name: 'photosynthesis' }],
            other_tags: [{ other_tag_id: 8, name: 'nocturnal hunter' }],
          }}
          onClose={jest.fn()}
        />
      </MemoryRouter>
    );

    const preview = screen.getByTestId('map-pin-preview');
    expect(preview).toHaveTextContent('Scorpion');
    const saved = screen.getByText('photosynthesis');
    const other = screen.getByText('nocturnal hunter');
    expect(saved).toHaveClass('rounded-xl', 'bg-background');
    expect(other).toHaveClass('rounded-xl', 'bg-background', 'text-xs', 'text-muted');
  });
});
