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

  test('shows an other tag on the feed card the same way as a phenomenon', () => {
    render(
      <MemoryRouter>
        <PebbleCard
          pebble={createMockPebble({
            title: 'Scorpion',
            phenomena: [{ phenomenon_id: 3, name: 'photosynthesis', field_name: 'Biology' }],
            other_tags: [{ other_tag_id: 8, name: 'nocturnal hunter' }],
          })}
        />
      </MemoryRouter>
    );
    const saved = screen.getByText('photosynthesis');
    const other = screen.getByText('nocturnal hunter');
    expect(saved).toHaveClass('rounded-xl', 'bg-background');
    expect(other).toHaveClass('rounded-xl', 'bg-background', 'text-xs', 'text-muted');
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

  test('shows the date alone or with a 24-hour time', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PebbleCard
          pebble={createMockPebble({
            pin_name: 'Antarctica',
            place_name: '',
            observed_on: '2021-07-27',
            observed_time: null,
            observed_at: null,
          })}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Antarctica · 2021-07-27')).toBeInTheDocument();
    expect(screen.queryByText(/00:00/)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PebbleCard
          pebble={createMockPebble({
            pin_name: 'Antarctica',
            observed_on: '2021-07-27',
            observed_time: '15:00:00',
          })}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Antarctica · 2021-07-27 15:00')).toBeInTheDocument();
  });
});
