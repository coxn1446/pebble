import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HowItWorksPage from '../components/Welcome/HowItWorksPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <HowItWorksPage />
    </MemoryRouter>
  );

describe('HowItWorks', () => {
  test('renders how it works columns, copy, and illustration', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'How it Works' })).toBeInTheDocument();
    expect(
      screen.getByText(/professionals create a pebble account to document real-world phenomena/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pebbles are pinned to a map, and users are connected/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/educators turn pebbles into meaningful, standards-aligned learning/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /collect field observations, connect them on a global map/i })
        .parentElement
    ).toHaveClass('max-w-4xl');
    expect(screen.getByRole('heading', { name: 'How it Works' }).closest('.items-center')).not.toBeNull();
  });

  test('renders explore pebbles comparison and CTA', () => {
    renderPage();

    expect(screen.getAllByText('How it was').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pebble').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('How it can be').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('LS4.B Natural Selection')).toBeInTheDocument();
    expect(screen.getByText('ETSA.B Designing Solutions')).toBeInTheDocument();
    expect(screen.getByText('LS2.C Ecosystem Dynamics')).toBeInTheDocument();
    expect(screen.getByText('PS1.B Chemical Reactions')).toBeInTheDocument();
    expect(
      screen.getByText(/students read an article about evolution and look at pictures of galapagos finches/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rocky coastline on Madeira' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore Pebbles' })).toHaveAttribute('href', '/login');

    const columnHeaders = ['How it was', 'Pebble', 'How it can be']
      .map((label) => screen.getAllByText(label).find((el) => el.classList.contains('w-full')))
      .filter(Boolean);
    expect(columnHeaders).toHaveLength(3);
    columnHeaders.forEach((header) => {
      expect(header).toHaveClass('w-full', 'rounded-full', 'text-center');
    });

    expect(screen.getByRole('img', { name: 'Rocky coastline on Madeira' })).toHaveClass(
      'h-20',
      'md:h-24',
      'rounded-full'
    );

    const explore = document.getElementById('explore-pebbles');
    expect(explore.querySelector('.border-t-2')).toBeNull();
    expect(explore.querySelectorAll('.border-t.border-border').length).toBe(3);
  });

  test('uses snap scrolling and routes header links', () => {
    renderPage();

    expect(screen.getByTestId('how-it-works-scroll')).toHaveClass('snap-y', 'snap-mandatory');
    expect(document.getElementById('how-it-works')).toHaveClass('h-dvh', 'snap-start');
    expect(document.getElementById('explore-pebbles')).toHaveClass('min-h-dvh', 'snap-start');
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about-us');
    expect(screen.getByRole('link', { name: 'How it Works' })).toHaveAttribute(
      'href',
      '/how-it-works'
    );
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
