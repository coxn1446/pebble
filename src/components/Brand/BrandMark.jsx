import React from 'react';
import { Link } from 'react-router-dom';
import logoSrc from '../../resources/pebble-logo.png';

const SIZE_CLASS = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-20 w-20',
  hero: 'h-24 w-24 md:h-28 md:w-28',
  xl: 'h-40 w-40 md:h-56 md:w-56',
};

export const BRAND_TAGLINE = 'Collect · Connect · Share · Grow';

/**
 * Reusable pebble brand mark: circular logo, optional wordmark, optional tagline.
 */
const BrandMark = ({
  size = 'sm',
  showWordmark = true,
  showTagline = false,
  to = '/',
  animated = false,
  className = '',
}) => {
  const mark = (
    <img
      src={logoSrc}
      alt={showWordmark ? '' : 'Pebble'}
      className={`${SIZE_CLASS[size] || SIZE_CLASS.sm} shrink-0 rounded-full ${
        animated ? 'animate-float' : ''
      }`}
    />
  );

  const content = (
    <span
      className={`inline-flex items-center gap-3 ${showTagline ? 'flex-col items-start gap-1' : ''} ${className}`}
    >
      {showTagline ? (
        <span className="inline-flex items-center gap-3">
          {mark}
          {showWordmark ? (
            <span className="font-display text-2xl font-bold lowercase tracking-tight text-ink">
              pebble
            </span>
          ) : null}
        </span>
      ) : (
        <>
          {mark}
          {showWordmark ? (
            <span className="font-display text-xl font-bold lowercase tracking-tight text-ink">
              pebble
            </span>
          ) : null}
        </>
      )}
      {showTagline ? (
        <span className="text-xs font-semibold uppercase tracking-tagline text-muted">
          {BRAND_TAGLINE}
        </span>
      ) : null}
    </span>
  );

  if (!to) {
    return content;
  }

  return (
    <Link to={to} className="w-fit transition hover:opacity-90" aria-label="Pebble home">
      {content}
    </Link>
  );
};

export default BrandMark;
