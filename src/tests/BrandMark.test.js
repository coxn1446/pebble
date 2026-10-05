import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BrandMark, { BRAND_TAGLINE } from '../components/Brand/BrandMark';

const renderMark = (props = {}) =>
  render(
    <MemoryRouter>
      <BrandMark {...props} />
    </MemoryRouter>
  );

describe('BrandMark', () => {
  test('renders the wordmark and links home by default', () => {
    renderMark();

    expect(screen.getByText('pebble')).toBeInTheDocument();
    expect(screen.getByLabelText('Pebble home')).toHaveAttribute('href', '/');
  });

  test('renders the brand tagline when requested', () => {
    renderMark({ showTagline: true });

    expect(screen.getByText(BRAND_TAGLINE)).toBeInTheDocument();
  });

  test('uses icon-only accessible label when wordmark is hidden', () => {
    renderMark({ showWordmark: false });

    expect(screen.getByAltText('Pebble')).toBeInTheDocument();
    expect(screen.queryByText('pebble')).not.toBeInTheDocument();
  });

  test('can render without a link wrapper', () => {
    renderMark({ to: null, showWordmark: false });

    expect(screen.queryByLabelText('Pebble home')).not.toBeInTheDocument();
    expect(screen.getByAltText('Pebble')).toBeInTheDocument();
  });

  test('can render the logo as a white shape with a black outline', () => {
    renderMark({ outline: true, showWordmark: false });

    expect(screen.getByAltText('Pebble')).toHaveClass('logo-outline');
    expect(screen.getByAltText('Pebble')).not.toHaveClass('grayscale');
  });

  test('applies float animation class when animated', () => {
    renderMark({ animated: true, showWordmark: false });

    expect(screen.getByAltText('Pebble')).toHaveClass('animate-float');
  });
});
