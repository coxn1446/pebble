import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AboutUsPage from '../components/Welcome/AboutUsPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <AboutUsPage />
    </MemoryRouter>
  );

describe('AboutUs', () => {
  afterEach(() => {
    window.matchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  test('renders about us story and field journey timeline', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'About Us' })).toBeInTheDocument();
    expect(
      screen.getByText(/nature inspires the best things in life, and pebble is no different/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/so, i decided to build the nest/i)).toBeInTheDocument();
    expect(screen.getByText(/now, i invite you to add your pebble/i)).toBeInTheDocument();
    expect(screen.queryByText(/peppered moths/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/there is an incredible community of people observing, documenting, and protecting/i)
    ).toBeInTheDocument();
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
      'text-justify',
      'text-sm'
    );
    const aboutHeading = screen.getByRole('heading', { name: 'About Us' });
    const inspiration = screen.getByText('Inspiration');
    expect(aboutHeading).toHaveClass('leading-snug');
    expect(inspiration.parentElement).toHaveClass('flex', 'flex-col', 'gap-3');
    expect(inspiration.compareDocumentPosition(aboutHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(aboutHeading.closest('.lg\\:items-center')).not.toBeNull();
  });

  test('renders how we are different and footer', () => {
    renderPage();

    const differentHeading = screen.getByRole('heading', { name: /how we're different/i });
    expect(differentHeading).toBeInTheDocument();
    expect(differentHeading.parentElement).toHaveClass('my-auto');
    expect(differentHeading.parentElement.parentElement).toHaveClass('justify-center');
    expect(screen.getByText('Pebbles are created by professionals')).toBeInTheDocument();
    expect(screen.getByText('Pebbles are created by professionals')).toHaveClass('font-sans');
    expect(screen.getByText('Pebbles are created by professionals')).not.toHaveClass('font-display');
    const educatorLine = screen.getByText(/made for educators/i);
    expect(educatorLine).toHaveClass('font-display');
    expect(educatorLine).not.toHaveClass('italic');
    const footer = screen.getByRole('contentinfo');
    expect(footer.querySelector('img')).toHaveClass('logo-outline');
    expect(footer.querySelector('img')).not.toHaveClass('grayscale');
    expect(footer.querySelector('img').closest('div')).toHaveClass('hidden', 'md:block');
    expect(footer.querySelector('nav')).toHaveClass('hidden', 'md:flex');
    expect(footer.firstElementChild).toHaveClass('items-center', 'justify-center', 'py-2', 'md:py-2');
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
    expect(document.getElementById('about-us')).toHaveClass('h-dvh', 'snap-start');
    expect(document.getElementById('how-we-are-different')).toHaveClass('h-dvh', 'snap-start');
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

  test('on a phone, letter and timeline share one slide as a horizontal carousel', async () => {
    window.matchMedia.mockImplementation((query) => ({
      matches: String(query).includes('max-width: 767px'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    renderPage();

    const carousel = screen.getByTestId('about-carousel');
    expect(carousel).toHaveClass('snap-x', 'snap-mandatory');
    expect(carousel.children).toHaveLength(4);
    Array.from(carousel.children).forEach((slide) => {
      expect(slide).toHaveClass('h-full', 'w-full', 'snap-start', 'snap-always', 'overflow-hidden', 'flex-col');
    });

    const about = document.getElementById('about-us');
    const different = document.getElementById('how-we-are-different');
    const journeys = screen.getAllByRole('list', { name: 'Field journey' });
    expect(journeys).toHaveLength(4);
    journeys.forEach((journey) => {
      expect(about.contains(journey)).toBe(true);
      expect(journey).toHaveClass('flex-row');
      expect(journey).not.toHaveClass('flex-col');
      expect(journey.querySelectorAll('img')).toHaveLength(2);
      expect(journey.querySelector('.w-px')).toBeNull();
    });
    expect(journeys.map((journey) => journey.querySelectorAll('.h-px.bg-border').length)).toEqual([
      3, 4, 4, 3,
    ]);
    const firstRail = journeys[0].querySelector('li span.flex');
    expect(firstRail.firstElementChild).not.toHaveClass('bg-border');
    expect(firstRail.lastElementChild).toHaveClass('h-px', 'bg-border');
    const lastRails = journeys[3].querySelectorAll('li span.flex');
    expect(lastRails[1].firstElementChild).toHaveClass('h-px', 'bg-border');
    expect(lastRails[1].lastElementChild).not.toHaveClass('bg-border');

    const canada = screen.getByRole('img', { name: 'Lichen-covered boulders in Canada' });
    const newYork = screen.getByRole('img', { name: 'A patterned beetle in New York' });
    const nature = screen.getByText(/nature inspires the best things in life/i);
    const firstSlide = canada.closest('.snap-start');
    expect(firstSlide).toBe(newYork.closest('.snap-start'));
    expect(firstSlide).toBe(nature.closest('.snap-start'));
    expect(
      canada.closest('[aria-label="Field journey"]').compareDocumentPosition(nature) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    const dots = screen.getByTestId('about-carousel-dots');
    expect(dots).toHaveClass('md:hidden');
    expect(dots.querySelectorAll('li')).toHaveLength(4);
    expect(dots.querySelector('[aria-current="true"]')).toHaveClass('bg-ink');
    expect(dots.querySelector('[aria-current="true"]')).toHaveAttribute('aria-label', 'Slide 1 of 4');
    expect(dots.querySelector('[aria-label="Slide 2 of 4"]')).toHaveClass('bg-pebble');
    expect(dots.querySelector('[aria-label="Slide 2 of 4"]')).not.toHaveAttribute('aria-current');

    Object.defineProperty(carousel, 'clientWidth', { configurable: true, value: 400 });
    carousel.scrollLeft = 800;
    await act(async () => {
      carousel.dispatchEvent(new Event('scroll'));
    });
    await waitFor(() => {
      expect(dots.querySelector('[aria-current="true"]')).toHaveAttribute('aria-label', 'Slide 3 of 4');
    });
    expect(dots.querySelector('[aria-label="Slide 4 of 4"]')).toHaveClass('bg-pebble');
    expect(different.contains(journeys[0])).toBe(false);
    expect(about).toHaveClass('h-dvh', 'snap-start', 'overflow-hidden');
    expect(different).toHaveClass('h-dvh', 'snap-start', 'overflow-hidden');

    const classroom = screen.getByText(/a few years ago, i realized how difficult/i);
    const invite = screen.getByText(/now, i invite you to add your pebble/i);
    expect(nature.closest('.snap-start')).not.toBe(classroom.closest('.snap-start'));
    expect(classroom.closest('.snap-start')).not.toBe(invite.closest('.snap-start'));
    expect(about.contains(nature)).toBe(true);
    expect(screen.queryByRole('heading', { name: 'About Us' })).not.toBeInTheDocument();
    expect(screen.queryByText('Inspiration')).not.toBeInTheDocument();
    expect(carousel.children[0]).toHaveClass('pt-32');
    expect(different.contains(screen.getByRole('heading', { name: /how we're different/i }))).toBe(
      true
    );
    expect(different.contains(screen.getByRole('contentinfo'))).toBe(true);
  });
});
