import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import BrandMark from '../Brand/BrandMark';
import logoSrc from '../../resources/pebble-logo.png';
import peopleIcon from '../../resources/icon - people.png';

export const WELCOME_TAGLINE = 'Collect • Connect • Create';

export const sectionClassName =
  'flex h-dvh min-h-dvh w-full snap-start snap-always flex-col bg-surface';

export const sectionPadClassName =
  'flex min-h-0 flex-1 flex-col px-4 pt-24 pb-8 md:px-8 md:pt-28 md:pb-10';

export const marketingTitleColumnClassName =
  'flex min-h-0 w-full flex-1 items-center justify-center px-4 py-8 md:px-8 lg:pt-24 lg:pb-8';

const FOOTER_LINKS = [
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
  { label: 'Contact', href: '#contact' },
];

export const SectionHeader = ({ label, title, align = 'center', compact = false, children }) => (
  <div
    className={`${compact ? 'mb-5 md:mb-6' : 'mb-12 md:mb-16'} ${
      align === 'left' ? 'text-left' : 'text-center'
    }`}
  >
    <p className="mb-2 text-sm font-semibold uppercase tracking-tagline text-moss">{label}</p>
    <h2 className="font-display text-4xl font-medium text-ink md:text-5xl">{title}</h2>
    {children}
  </div>
);

const navLinkClass = ({ isActive }) =>
  `font-display text-lg font-medium leading-none transition hover:text-ocean ${
    isActive ? 'text-ocean' : 'text-ink'
  }`;

export const WelcomeHeader = () => (
  <header className="absolute inset-x-0 top-0 z-20">
    <div
      className="welcome-nav-fade pointer-events-none absolute inset-x-0 top-0 h-44"
      aria-hidden="true"
    />
    <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <Link to="/" aria-label="Pebble home" className="shrink-0">
          <img src={logoSrc} alt="" className="h-11 w-11 rounded-full" />
        </Link>
        <nav className="hidden h-11 items-center gap-6 md:flex" aria-label="Welcome">
          <NavLink to="/" end className={({ isActive }) => `${navLinkClass({ isActive })} lowercase`}>
            pebble
          </NavLink>
          <NavLink to="/about-us" className={navLinkClass}>
            About Us
          </NavLink>
          <NavLink to="/how-it-works" className={navLinkClass}>
            How it Works
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-lg font-medium text-ink transition hover:text-ocean">
          Sign In
        </Link>
        <Link to="/login" aria-label="Sign in" className="inline-flex items-center transition hover:opacity-80">
          <img src={peopleIcon} alt="" className="h-10 w-10" />
        </Link>
      </div>
    </div>
  </header>
);

export const WelcomeFooter = () => (
  <footer className="w-full shrink-0 bg-ocean/10">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 md:py-6">
      <BrandMark size="sm" to="/" />
      <nav className="flex flex-wrap items-center gap-6 md:gap-10" aria-label="Footer">
        {FOOTER_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-sm font-medium uppercase tracking-wide text-ink transition hover:text-ocean"
          >
            {label}
          </a>
        ))}
      </nav>
      <p className="text-sm text-ink md:text-right">Copyright 2026 Pebble. All Rights Reserved.</p>
    </div>
  </footer>
);

export const WelcomeScroller = ({ testId, children }) => (
  <div
    data-testid={testId}
    className="h-full min-h-0 overflow-y-auto scroll-smooth snap-y snap-mandatory bg-surface"
  >
    {children}
  </div>
);
