import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import PebbleCard from '../components/Pebbles/PebbleCard';
import { createMockPebble } from './__mocks__/fetchMocks';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('PebbleCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders field icon, title, location, description, and tags', () => {
    render(
      <MemoryRouter>
        <PebbleCard
          pebble={createMockPebble({
            place_name: 'Lab',
            description: 'A discovery',
            phenomena: [
              { phenomenon_id: 1, name: 'evolution', field_name: 'Biology' },
              { phenomenon_id: 2, name: 'ecology', field_name: 'Biology' },
            ],
          })}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Sample pebble')).toBeInTheDocument();
    expect(screen.getByLabelText('Biology')).toBeInTheDocument();
    expect(screen.getByText('Lab')).toBeInTheDocument();
    expect(screen.getByText('A discovery')).toBeInTheDocument();
    expect(screen.getByText('evolution')).toBeInTheDocument();
    expect(screen.getByText('ecology')).toBeInTheDocument();
    expect(screen.queryByText('Scientist')).not.toBeInTheDocument();
    expect(screen.queryByText('@scientist')).not.toBeInTheDocument();
  });

  test('renders hero as a full-height square thumbnail when present', () => {
    const { container } = render(
      <MemoryRouter>
        <PebbleCard
          pebble={createMockPebble({ hero_image_url: 'https://example.com/hero.jpg' })}
        />
      </MemoryRouter>
    );
    const thumb = screen.getByTestId('pebble-hero-thumb');
    expect(thumb).toHaveClass('h-full');
    expect(thumb).toHaveClass('aspect-square');
    expect(thumb).toHaveClass('rounded-2xl');
    const img = container.querySelector('img[src="https://example.com/hero.jpg"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('object-cover');
  });

  test('does not render feed action buttons', () => {
    render(
      <MemoryRouter>
        <PebbleCard pebble={createMockPebble()} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: /Like/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Save$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share/i })).not.toBeInTheDocument();
  });

  test('navigates to pebble detail when card is clicked', () => {
    render(
      <MemoryRouter>
        <PebbleCard pebble={createMockPebble()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Sample pebble'));
    expect(mockNavigate).toHaveBeenCalledWith('/pebbles/10');
  });
});
