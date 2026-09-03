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
    const tagline = screen.getByText(WELCOME_TAGLINE);
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveClass('text-moss');
    expect(screen.getByAltText('Pebble')).toHaveClass('h-24');
    expect(
      screen.getByText(/a global ecosystem where educators and researchers pin real-world phenomena/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/login');
  });

  test('uses full-viewport snap scrolling across welcome sections', () => {
    renderWelcome();

    const scroller = screen.getByTestId('welcome-scroll');
    expect(scroller).toHaveClass('snap-y', 'snap-mandatory');

    const hero = document.getElementById('hero');
    const audience = document.getElementById('audience');
    const methodology = document.getElementById('methodology');
    const howItWorks = document.getElementById('how-it-works');
    const explore = document.getElementById('explore-pebbles');
    const about = document.getElementById('about-us');

    expect(hero).toHaveClass('h-dvh', 'snap-start');
    expect(audience).toHaveClass('h-dvh', 'snap-start');
    expect(methodology).toHaveClass('h-dvh', 'snap-start');
    expect(howItWorks).toHaveClass('h-dvh', 'snap-start');
    expect(explore).toHaveClass('min-h-dvh', 'md:h-dvh', 'snap-start');
    expect(about).toHaveClass('min-h-dvh', 'snap-start');
  });

  test('does not link guests to /register', () => {
    renderWelcome();

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).not.toContain('/register');
  });

  test('renders header auth and section navigation links', () => {
    renderWelcome();

    const loginLinks = screen.getAllByRole('link', { name: /log in/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    loginLinks.forEach((link) => expect(link).toHaveAttribute('href', '/login'));
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '#about-us');
    expect(screen.getByRole('link', { name: 'How it Works' })).toHaveAttribute(
      'href',
      '#how-it-works'
    );
  });

  test('places audience before methodology before how it works before explore before about us', () => {
    renderWelcome();

    const audience = screen.getByRole('heading', { name: 'Who is pebble for?' });
    const methodology = screen.getByRole('heading', { name: /building the nest/i });
    const howItWorks = screen.getByRole('heading', { name: 'How it Works' });
    const explore = screen.getByRole('link', { name: 'Explore Pebbles' });
    const about = screen.getByRole('heading', { name: 'About Us' });
    expect(audience.compareDocumentPosition(methodology) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(methodology.compareDocumentPosition(howItWorks) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(howItWorks.compareDocumentPosition(explore) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(explore.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  test('renders methodology steps and mockup details', () => {
    renderWelcome();

    expect(screen.getByRole('heading', { name: /building the nest/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Collect' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('heading', { name: 'Connect' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('heading', { name: 'Create' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Flora')).toBeInTheDocument();
    expect(screen.getByText('45.021° N, 12.332° E')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Learn More' })).not.toBeInTheDocument();
  });

  test('keeps audience, methodology, how-it-works, and about-us section headers size-matched', () => {
    renderWelcome();

    const methodologyLabel = screen.getByText('Methodology');
    const audienceLabel = screen.getByText('Audience');
    const mechanicsLabel = screen.getByText('Mechanics');
    const inspirationLabel = screen.getByText('Inspiration');
    const methodologyTitle = screen.getByRole('heading', { name: /building the nest/i });
    const audienceTitle = screen.getByRole('heading', { name: 'Who is pebble for?' });
    const howItWorksTitle = screen.getByRole('heading', { name: 'How it Works' });
    const aboutTitle = screen.getByRole('heading', { name: 'About Us' });

    expect(methodologyLabel.parentElement).toHaveClass('text-left', 'mb-12');
    expect(audienceLabel.parentElement).toHaveClass('text-center', 'mb-12');
    expect(mechanicsLabel.parentElement).toHaveClass('text-center', 'mb-12');
    expect(inspirationLabel.parentElement).toHaveClass('text-left', 'mb-5');
    expect(methodologyLabel).toHaveClass('text-sm', 'text-moss');
    expect(audienceLabel).toHaveClass('text-sm', 'text-moss');
    expect(mechanicsLabel).toHaveClass('text-sm', 'text-moss');
    expect(inspirationLabel).toHaveClass('text-sm', 'text-moss');
    expect(methodologyTitle).toHaveClass('text-4xl', 'md:text-5xl');
    expect(audienceTitle).toHaveClass('text-4xl', 'md:text-5xl');
    expect(howItWorksTitle).toHaveClass('text-4xl', 'md:text-5xl');
    expect(aboutTitle).toHaveClass('text-4xl', 'md:text-5xl');
  });

  test('renders how it works columns, copy, and illustration', () => {
    renderWelcome();

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
    ).toBeInTheDocument();
  });

  test('renders explore pebbles comparison and CTA', () => {
    renderWelcome();

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
    expect(
      screen.getByRole('img', { name: 'Rocky coastline on Madeira' })
    ).toBeInTheDocument();
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

  test('renders about us story and field journey timeline', () => {
    renderWelcome();

    expect(screen.getByRole('heading', { name: 'About Us' })).toBeInTheDocument();
    expect(
      screen.getByText(/nature inspires the best things in life, and pebble is no different/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/so, i decided to build the nest/i)).toBeInTheDocument();
    expect(screen.getByText(/now, i invite you to add your pebble/i)).toBeInTheDocument();
    expect(screen.getByText('Jul 2023')).toBeInTheDocument();
    expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('Galápagos Islands')).toBeInTheDocument();
    expect(screen.getByText('Kyrgyzstan')).toBeInTheDocument();
    expect(screen.getByText('Chemistry')).toBeInTheDocument();
    expect(screen.getByText('Marine Biology')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Lichen-covered boulders' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'A scuba diver among coral and fish' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Two climbers roped together on a mountain ridge' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'A life in the field' })).not.toBeInTheDocument();
    expect(screen.queryByText('Pebble makes this possible.')).not.toBeInTheDocument();
  });

  test('renders audience section for each audience type', () => {
    renderWelcome();

    expect(screen.getByRole('heading', { name: 'Who is pebble for?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Educators' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Researchers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Academics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument();
  });

  test('renders footer brand, legal links, and copyright', () => {
    renderWelcome();

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '#privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '#terms');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
    expect(
      screen.getByText('Copyright 2026 Pebble. All Rights Reserved.')
    ).toBeInTheDocument();
  });
});
