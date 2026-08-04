import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPageLayout from '../components/Auth/AuthPageLayout';
import { BRAND_TAGLINE } from '../components/Brand/BrandMark';

describe('AuthPageLayout', () => {
  test('renders brand mark, title, subtitle, and children', () => {
    render(
      <MemoryRouter>
        <AuthPageLayout title="Sign in" subtitle="Welcome back">
          <button type="button">Continue</button>
        </AuthPageLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('pebble')).toBeInTheDocument();
    expect(screen.getByText(BRAND_TAGLINE)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  test('omits subtitle when not provided', () => {
    render(
      <MemoryRouter>
        <AuthPageLayout title="Create account">
          <div>Form</div>
        </AuthPageLayout>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });
});
