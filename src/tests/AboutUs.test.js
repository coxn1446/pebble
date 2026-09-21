import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AboutUsPage from '../components/Welcome/AboutUsPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <AboutUsPage />
    </MemoryRouter>
  );

describe('AboutUs', () => {
  test('renders about us story and field journey timeline', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'About Us' })).toBeInTheDocument();
    expect(
      screen.getByText(/nature inspires the best things in life, and pebble is no different/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/so, i decided to build the nest/i)).toBeInTheDocument();
    expect(screen.getByText(/now, i invite you to add your pebble/i)).toBeInTheDocument();
    expect(screen.getByText('JUL 2023')).toBeInTheDocument();
    expect(screen.getByText('AUG 2023')).toBeInTheDocument();
    expect(screen.getByText('FEB 2024')).toBeInTheDocument();
    expect(screen.getByText('JUL 2024')).toBeInTheDocument();
    expect(screen.getByText('AUG 2024')).toBeInTheDocument();
    expect(screen.getByText('DEC 2024')).toBeInTheDocument();
    expect(screen.getByText('AUG 2025')).toBeInTheDocument();
    expect(screen.getByText('JUL 2026')).toBeInTheDocument();
    expect(screen.queryByText(/\| canada/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/galapagos islands/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Dec 2022')).not.toBeInTheDocument();
    expect(screen.queryByText(/costa rica/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Lichen-covered boulders in Canada' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Gentoo penguins stacking pebbles in Antarctica' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'A scuba diver among coral and fish in Panama' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Two climbers roped together on a mountain ridge in Kyrgyzstan',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nature inspires the best things in life, and pebble is no different/i)
    ).toHaveClass('font-semibold');
    expect(screen.getByText(/what if we could do something similar/i).tagName).toBe('STRONG');
    expect(screen.getByText(/so, i decided to build the nest/i)).toHaveClass('font-semibold');
    expect(screen.getByText(/now, i invite you to add your pebble/i).parentElement).toHaveClass(
      'text-justify'
    );
    expect(screen.getByRole('heading', { name: 'About Us' }).closest('.items-center')).not.toBeNull();
  });

  test('renders how we are different and footer', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /how we're different/i })).toBeInTheDocument();
    expect(screen.getByText('Pebbles are created by professionals')).toBeInTheDocument();
    const educatorLine = screen.getByText(/made for educators/i);
    expect(educatorLine).not.toHaveClass('italic');
    expect(screen.getByText('by an educator').tagName).toBe('EM');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '#privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '#terms');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
    expect(screen.getByText('Copyright 2026 Pebble. All Rights Reserved.')).toBeInTheDocument();
  });

  test('uses snap scrolling for letter and different sections', () => {
    renderPage();

    expect(screen.getByTestId('about-us-scroll')).toHaveClass('snap-y', 'snap-mandatory');
    expect(document.getElementById('about-us')).toHaveClass('snap-start');
    expect(document.getElementById('how-we-are-different')).toHaveClass('snap-start');
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about-us');

    const scroller = screen.getByTestId('about-us-scroll');
    const about = document.getElementById('about-us');
    const different = document.getElementById('how-we-are-different');
    const journeys = screen.getAllByRole('list', { name: 'Field journey' });
    expect(journeys).toHaveLength(2);
    expect(about.contains(journeys[0])).toBe(true);
    expect(different.contains(journeys[1])).toBe(true);
    expect(journeys[0].querySelectorAll('img')).toHaveLength(4);
    expect(journeys[1].querySelectorAll('img')).toHaveLength(4);
    expect(
      journeys[0].compareDocumentPosition(screen.getByRole('heading', { name: 'About Us' })) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const firstSlideLast = journeys[0].querySelectorAll('li')[3];
    const secondSlideFirst = journeys[1].querySelector('li');
    expect(firstSlideLast.querySelector('.welcome-timeline-line-down')).not.toBeNull();
    expect(secondSlideFirst.querySelector('.welcome-timeline-line-up')).not.toBeNull();
    expect(scroller.contains(screen.getByRole('contentinfo'))).toBe(true);
    expect(different.contains(screen.getByRole('contentinfo'))).toBe(true);
  });
});
