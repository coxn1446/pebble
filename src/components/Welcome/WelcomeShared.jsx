import React, { Children, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandMark from '../Brand/BrandMark';
import { CloseIcon, MenuIcon } from '../Icons/Icons';
import logoSrc from '../../resources/pebble-logo.png';
import signInIcon from '../../resources/icon-sign-in.png';

export const WELCOME_TAGLINE = 'Collect • Connect • Create';

/** Phones only. Tablet (`md`, 768px) and up keep the wider marketing layout. */
export const MOBILE_WELCOME_QUERY = '(max-width: 767px)';

export const useMobileWelcome = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_WELCOME_QUERY).matches
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_WELCOME_QUERY);
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};

export const sectionClassName =
  'flex h-dvh min-h-dvh w-full snap-start snap-always flex-col overflow-hidden bg-surface';

export const sectionPadClassName =
  'flex min-h-0 flex-1 flex-col px-4 pt-24 pb-8 md:px-8 md:pt-28 md:pb-10';

export const marketingTitleColumnClassName =
  'flex min-h-0 w-full flex-1 items-center justify-center px-4 py-8 md:px-8 lg:pt-24 lg:pb-8';

const FOOTER_LINKS = [
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
  { label: 'Contact', href: '#contact' },
];

export const SectionHeader = ({
  label,
  title,
  align = 'center',
  compact = false,
  className = '',
  titleClassName = '',
  children,
}) => (
  <div
    className={`flex flex-col gap-3 ${
      className || (compact ? 'mb-5 md:mb-6' : 'mb-12 md:mb-16')
    } ${align === 'left' ? 'text-left' : 'text-center'}`}
  >
    <p className="text-sm font-semibold uppercase leading-normal tracking-tagline text-moss">{label}</p>
    <h2 className={`font-display text-4xl font-medium text-ink md:text-5xl ${titleClassName || 'leading-snug'}`}>
      {title}
    </h2>
    {children}
  </div>
);

const navToneClass = ({ isActive }) =>
  `font-medium leading-none transition hover:text-ocean ${isActive ? 'text-ocean' : 'text-ink'}`;

const navLinkClass = (state) => `${navToneClass(state)} font-sans text-xl`;

const wordmarkClass = (state) => `${navToneClass(state)} font-display text-2xl lowercase`;

const MarketingNavLinks = ({ onNavigate }) => (
  <>
    <NavLink to="/" end className={wordmarkClass} onClick={onNavigate}>
      pebble
    </NavLink>
    <NavLink to="/about-us" className={navLinkClass} onClick={onNavigate}>
      About Us
    </NavLink>
    <NavLink to="/how-it-works" className={navLinkClass} onClick={onNavigate}>
      How it Works
    </NavLink>
  </>
);

export const WelcomeHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="absolute inset-x-0 top-0 z-20 pt-safe-top">
      <div
        className="welcome-nav-fade pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div
        data-testid="welcome-nav-bar"
        className="relative flex w-full items-center justify-between gap-4 px-4 py-4 lg:items-baseline lg:py-6"
      >
        <div className="relative flex items-center gap-2 md:gap-3 lg:block">
          <Link
            to="/"
            aria-label="Pebble home"
            className="shrink-0 lg:absolute lg:top-1/2 lg:left-0 lg:-translate-y-1/2"
          >
            <img src={logoSrc} alt="" className="h-11 w-11" />
          </Link>
          <nav className="hidden items-baseline gap-6 lg:flex lg:pl-14" aria-label="Welcome">
            <MarketingNavLinks />
          </nav>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-ink lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="welcome-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
        <div className="relative flex items-center gap-2 sm:gap-4 lg:block lg:pr-14">
          <Link
            to="/login"
            className="font-sans text-xl font-medium leading-none text-ink transition hover:text-ocean"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            aria-label="Sign in"
            className="inline-flex items-center transition hover:opacity-80 lg:absolute lg:top-1/2 lg:right-0 lg:-translate-y-1/2"
          >
            <img src={signInIcon} alt="" className="h-11 w-11" />
          </Link>
        </div>
      </div>
      {menuOpen ? (
        <nav
          id="welcome-menu"
          data-testid="welcome-menu"
          aria-label="Welcome menu"
          className="relative flex flex-col gap-4 border-b border-border bg-surface px-4 py-4 lg:hidden"
        >
          <MarketingNavLinks onNavigate={closeMenu} />
        </nav>
      ) : null}
    </header>
  );
};

export const WelcomeFooter = () => (
  <footer className="w-full shrink-0 bg-ocean/10">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-2 md:flex-row md:justify-between md:gap-4 md:px-8 md:py-2">
      <div className="hidden md:block">
        <BrandMark size="sm" to="/" outline />
      </div>
      <nav className="hidden flex-wrap items-center gap-6 md:flex md:gap-10" aria-label="Footer">
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
      <p className="text-center text-sm text-ink md:text-right">
        Copyright 2026 Pebble. All Rights Reserved.
      </p>
    </div>
  </footer>
);

export const WelcomeScroller = ({ testId, children }) => (
  <div
    data-testid={testId}
    className="h-full min-h-0 overflow-x-hidden overflow-y-auto scroll-smooth snap-y snap-mandatory bg-surface"
  >
    {children}
  </div>
);

export const WelcomeHCarousel = ({ testId, label, className = '', children }) => {
  const scrollerRef = useRef(null);
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;
    const onScroll = () => {
      const width = scroller.clientWidth;
      if (!width) return;
      const next = Math.round(scroller.scrollLeft / width);
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [slides.length]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div
        ref={scrollerRef}
        data-testid={testId}
        role="region"
        aria-label={label}
        className={`welcome-h-carousel flex min-h-0 w-full flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden ${className}`}
      >
        {slides}
      </div>
      {slides.length > 1 ? (
        <ol
          data-testid={`${testId}-dots`}
          aria-label={`${label} progress`}
          className="flex shrink-0 items-center justify-center gap-1.5 py-2 md:hidden"
        >
          {slides.map((slide, dotIndex) => (
            <li key={slide.key ?? dotIndex}>
              <span
                aria-current={dotIndex === index ? 'true' : undefined}
                aria-label={`Slide ${dotIndex + 1} of ${slides.length}`}
                className={`block rounded-full ${
                  dotIndex === index ? 'h-2 w-2 bg-ink' : 'h-1.5 w-1.5 bg-pebble'
                }`}
              />
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
};

export const WelcomeHSlide = ({ className = '', children }) => (
  <div
    className={`flex h-full w-full shrink-0 snap-start snap-always flex-col overflow-hidden ${className}`}
  >
    {children}
  </div>
);
