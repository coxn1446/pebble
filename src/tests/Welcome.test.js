import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Welcome, { WELCOME_TAGLINE } from '../components/Welcome/Welcome';

const renderWelcome = () =>
  render(
    <MemoryRouter>
      <Welcome />
    </MemoryRouter>
  );

describe('Welcome', () => {
  test('renders hero brand, tagline, pitch, and get-started CTA', () => {
    renderWelcome();

    expect(screen.getByRole('heading', { name: 'pebble' })).toBeInTheDocument();
    const tagline = screen.getByLabelText(WELCOME_TAGLINE);
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveClass('text-moss');
    expect(screen.getByAltText('Pebble')).toHaveClass('h-24');
    expect(
      screen.getByText(/a global ecosystem where educators and researchers pin real-world phenomena/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/login');
  });

  test('uses full-viewport snap scrolling across home sections', () => {
    renderWelcome();

    const scroller = screen.getByTestId('welcome-scroll');
    expect(scroller).toHaveClass('snap-y', 'snap-mandatory');

    const hero = document.getElementById('hero');
    const audience = document.getElementById('audience');
    const methodology = document.getElementById('methodology');

    expect(hero).toHaveClass('h-dvh', 'snap-start');
    expect(audience).toHaveClass('h-dvh', 'snap-start');
    expect(methodology).toHaveClass('h-dvh', 'snap-start');
    expect(document.getElementById('how-it-works')).toBeNull();
    expect(document.getElementById('explore-pebbles')).toBeNull();
    expect(document.getElementById('about-us')).toBeNull();
  });

  test('does not link guests to /register', () => {
    renderWelcome();

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/register');
  });

  test('renders header auth and section navigation links', () => {
    renderWelcome();

    const loginLinks = screen.getAllByRole('link', { name: /sign in/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    loginLinks.forEach((link) => expect(link).toHaveAttribute('href', '/login'));
    const pebbleNav = screen.getByRole('link', { name: 'pebble' });
    expect(pebbleNav).toHaveAttribute('href', '/');
    expect(pebbleNav).toHaveClass('hover:text-ocean');
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about-us');
    expect(screen.getByRole('link', { name: 'How it Works' })).toHaveAttribute(
      'href',
      '/how-it-works'
    );

    const signInIcon = screen
      .getAllByRole('link', { name: /sign in/i })
      .find((link) => link.querySelector('img'));
    expect(signInIcon).toBeTruthy();
    expect(signInIcon).not.toHaveClass('rounded-full');
    expect(signInIcon.querySelector('img')).not.toHaveClass('rounded-full');
  });

  test('places audience before methodology', () => {
    renderWelcome();

    const audience = screen.getByRole('heading', { name: 'Who is pebble for?' });
    const methodology = screen.getByRole('heading', { name: /building the nest/i });
    expect(audience.compareDocumentPosition(methodology) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  test('renders methodology steps, art, and learn more', () => {
    renderWelcome();

    expect(screen.getByRole('heading', { name: /building the nest/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Collect' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connect' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'A pebble observation card with a verified map location' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Flora')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn More' })).toHaveAttribute('href', '/about-us');
    expect(screen.getByRole('link', { name: 'Learn More' }).parentElement).toHaveClass(
      'flex',
      'justify-center'
    );
  });

  test('keeps audience and methodology section headers size-matched', () => {
    renderWelcome();

    const methodologyLabel = screen.getByText('Methodology');
    const audienceLabel = screen.getByText('Audience');
    const methodologyTitle = screen.getByRole('heading', { name: /building the nest/i });
    const audienceTitle = screen.getByRole('heading', { name: 'Who is pebble for?' });

    expect(methodologyLabel.parentElement).toHaveClass('text-left', 'mb-5');
    expect(audienceLabel.parentElement).toHaveClass('text-center', 'mb-12');
    expect(methodologyLabel).toHaveClass('text-sm', 'text-moss');
    expect(audienceLabel).toHaveClass('text-sm', 'text-moss');
    expect(methodologyTitle).toHaveClass('text-4xl', 'md:text-5xl');
    expect(audienceTitle).toHaveClass('text-4xl', 'md:text-5xl');
  });

  test('renders audience section for each audience type and science note', () => {
    renderWelcome();

    expect(screen.getByRole('heading', { name: 'Who is pebble for?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Educators' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Researchers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Academics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument();
    expect(
      screen.getByText(/note: pebble is organized for science-related disciplines/i)
    ).toHaveClass('text-moss');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
