import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(tagline).toHaveClass('font-display', 'text-moss');
    tagline.querySelectorAll('[aria-hidden="true"]').forEach((dot) => {
      expect(dot).toHaveClass('text-ink');
    });
    const heroMark = screen.getByAltText('Pebble');
    expect(heroMark).toHaveClass('h-20', 'w-24', 'object-contain', 'md:h-32', 'md:w-36');
    expect(heroMark).not.toHaveClass('rounded-full');
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
    expect(pebbleNav).toHaveClass('hover:text-ocean', 'text-2xl', 'font-display');
    const aboutLink = screen.getByRole('link', { name: 'About Us' });
    const howLink = screen.getByRole('link', { name: 'How it Works' });
    expect(aboutLink).toHaveAttribute('href', '/about-us');
    expect(howLink).toHaveAttribute('href', '/how-it-works');
    expect(aboutLink).toHaveClass('text-xl', 'font-sans', 'leading-none');
    expect(howLink).toHaveClass('text-xl', 'font-sans', 'leading-none');
    expect(aboutLink).not.toHaveClass('font-display');
    expect(howLink).not.toHaveClass('font-display');

    const navBar = screen.getByTestId('welcome-nav-bar');
    expect(navBar).toHaveClass('w-full', 'px-4');
    expect(navBar).not.toHaveClass('max-w-6xl', 'px-0');
    expect(document.querySelector('.welcome-nav-fade')).toHaveClass('inset-0');
    expect(document.querySelector('.welcome-nav-fade')).not.toHaveClass('h-20', 'h-44');
    expect(navBar).toHaveClass('items-center', 'lg:items-baseline', 'lg:py-6');
    expect(navBar.querySelector('nav')).toHaveClass('items-baseline');

    const signInIcon = screen
      .getAllByRole('link', { name: /sign in/i })
      .find((link) => link.querySelector('img'));
    expect(signInIcon).toBeTruthy();
    expect(signInIcon).not.toHaveClass('rounded-full');
    expect(signInIcon.querySelector('img')).not.toHaveClass('rounded-full');
    expect(signInIcon.querySelector('img')).toHaveClass('h-11', 'w-11');
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveClass(
      'text-xl',
      'font-sans',
      'leading-none'
    );
    expect(screen.getByRole('link', { name: 'Sign In' })).not.toHaveClass('font-display', 'lg:text-2xl');
    expect(screen.queryByTestId('welcome-menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens the welcome menu and closes it from a link or Escape', async () => {
    const user = userEvent.setup();
    renderWelcome();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const menu = screen.getByTestId('welcome-menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');

    const about = menu.querySelector('a[href="/about-us"]');
    const how = menu.querySelector('a[href="/how-it-works"]');
    const home = menu.querySelector('a[href="/"]');
    expect(about).toHaveTextContent('About Us');
    expect(how).toHaveTextContent('How it Works');
    expect(home).toHaveTextContent('pebble');
    expect(about).toHaveClass('text-xl', 'font-sans');
    expect(home).toHaveClass('text-2xl', 'font-display');

    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('welcome-menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByTestId('welcome-menu').querySelector('a[href="/about-us"]'));
    expect(screen.queryByTestId('welcome-menu')).not.toBeInTheDocument();
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
    const learnMore = screen.getByRole('link', { name: 'Learn More' });
    expect(learnMore.parentElement).toHaveClass('flex', 'w-full', 'justify-center', 'pb-2', 'md:pb-6');
    expect(screen.getByTestId('methodology-copy')).toHaveClass('w-full');
    expect(screen.getByText(/observe and document meaningful real-world phenomena/i)).not.toHaveClass(
      'max-w-sm'
    );
    expect(screen.getByTestId('methodology-body')).toHaveClass(
      'overflow-hidden',
      'md:overflow-y-auto',
      'pb-4',
      'md:pb-8'
    );
    expect(screen.getByText(/the pebble platform operates on a simple, iterative cycle/i)).toHaveClass(
      'hidden',
      'md:block'
    );
    expect(
      screen.getByRole('img', { name: 'A pebble observation card with a verified map location' })
        .parentElement
    ).toHaveClass('hidden', 'md:flex');
  });

  test('keeps audience and methodology section headers size-matched', () => {
    renderWelcome();

    const methodologyLabel = screen.getByText('Methodology');
    const audienceLabel = screen.getByText('Audience');
    const methodologyTitle = screen.getByRole('heading', { name: /building the nest/i });
    const audienceTitle = screen.getByRole('heading', { name: 'Who is pebble for?' });

    expect(methodologyLabel.parentElement).toHaveClass('text-left', 'mb-5');
    expect(audienceLabel.parentElement).toHaveClass('text-center', 'mb-0');
    expect(audienceTitle).toHaveClass('leading-none');
    const audienceGaps = screen.getAllByTestId('audience-gap');
    expect(audienceGaps).toHaveLength(2);
    audienceGaps.forEach((gap) => expect(gap).toHaveClass('h-8', 'md:h-16'));
    expect(screen.getByTestId('audience-note')).toHaveClass('leading-none');
    expect(screen.getByTestId('audience-note')).not.toHaveClass('mt-8');
    expect(methodologyLabel).toHaveClass('text-sm', 'text-moss');
    expect(audienceLabel).toHaveClass('text-sm', 'text-moss');
    expect(methodologyTitle).toHaveClass('text-4xl', 'md:text-5xl', 'leading-tight');
    expect(audienceTitle).toHaveClass('text-4xl', 'md:text-5xl', 'leading-none');
    expect(screen.getByTestId('audience-stage')).toHaveClass(
      'justify-center',
      'overflow-hidden',
      'py-8',
      'md:py-20'
    );
  });

  test('renders audience section for each audience type and science note', () => {
    renderWelcome();

    expect(screen.getByRole('heading', { name: 'Who is pebble for?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Educators' })).toHaveClass('font-display');
    expect(screen.getByRole('heading', { name: 'Researchers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Academics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument();
    expect(
      screen.getByText(/note: pebble is organized for science-related disciplines/i)
    ).toHaveClass('text-moss');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
