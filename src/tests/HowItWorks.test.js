import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HowItWorksPage from '../components/Welcome/HowItWorksPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <HowItWorksPage />
    </MemoryRouter>
  );

describe('HowItWorks', () => {
  test('renders how it works columns, copy, and illustration', () => {
    renderPage();

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
    const collect = screen.getByRole('heading', { name: 'Collect' });
    const art = screen.getByRole('img', {
      name: /a researcher recording a field observation/i,
    });
    expect(collect.compareDocumentPosition(art) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(collect.parentElement).toContainElement(art);
    expect(art.parentElement).toHaveClass('h-32', 'md:h-44', 'items-end');
    expect(screen.getByRole('img', { name: /field observations connected across a world map/i }).parentElement).toHaveClass(
      'h-32',
      'md:h-44',
      'items-end'
    );
    expect(screen.getByText(/professionals create a pebble account/i)).toHaveClass(
      'font-semibold',
      'text-ink'
    );
    expect(screen.getByText(/pebbles are pinned to a map/i)).toHaveClass('font-semibold');
    expect(screen.getByText(/educators turn pebbles into meaningful/i)).toHaveClass('font-semibold');
    const columns = screen.getByTestId('how-it-works-columns');
    expect(columns).toHaveClass('w-full', 'gap-0', 'md:divide-x', 'md:divide-ink');
    expect(columns).not.toHaveClass('max-w-4xl');
    expect(columns.parentElement.parentElement).toHaveClass('max-w-6xl');
    expect(document.getElementById('explore-pebbles').querySelector('.max-w-6xl')).toBeTruthy();
    expect(screen.getByText(/observations are shared as 'pebbles'/i).parentElement.parentElement).toHaveClass(
      'md:grid-rows-subgrid',
      'md:row-span-4'
    );
    expect(screen.getByText(/professionals create a pebble account/i).parentElement).toHaveClass(
      'flex',
      'md:h-full',
      'items-center'
    );
    expect(screen.getByText(/observations are shared as 'pebbles'/i).parentElement).toHaveClass(
      'items-start'
    );
    const stage = screen.getByTestId('how-it-works-stage');
    expect(stage).toHaveClass('pt-24', 'md:pt-36', 'overflow-hidden');
    expect(columns).toHaveClass('snap-x', 'snap-mandatory', 'md:grid', 'md:snap-none');
    expect(columns.children).toHaveLength(3);
    const columnDots = screen.getByTestId('how-it-works-columns-dots');
    expect(columnDots).toHaveClass('md:hidden');
    expect(columnDots.querySelectorAll('li')).toHaveLength(3);
    expect(columnDots.querySelector('[aria-current="true"]')).toHaveClass('bg-ink');
    expect(columnDots.querySelector('[aria-label="Slide 2 of 3"]')).toHaveClass('bg-pebble');
    Array.from(columns.children).forEach((slide) => {
      expect(slide).toHaveClass('w-full', 'snap-start', 'shrink-0');
    });
  });

  test('renders explore pebbles comparison and CTA', () => {
    renderPage();

    expect(screen.getAllByText('How it was').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pebble').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('How it can be').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('LS4.B Natural Selection')).toBeInTheDocument();
    expect(screen.getByText('ETSA.B Designing Solutions')).toBeInTheDocument();
    expect(screen.getByText('LS2.C Ecosystem Dynamics')).toBeInTheDocument();
    expect(screen.getByText('PS1.B Chemical Reactions')).toBeInTheDocument();
    expect(
      screen.getByText(
        /students read an article about evolution and look at pictures of galapagos finches/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/similarities between flowers on madeira \(portugal\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/teachers assign a worksheet with a passage about agriculture/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/teachers show a video about coral reefs and ocean conservation/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/teachers lecture about chemical reactions using diagrams and notes/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/students use multiple pebbles, including flowers in madeira/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/terraced rice paddy fields in sa pa, vietnam/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/scuba diving in coiba national park that comprises 270,000 hectares/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/lichens and moss growing on rocks in canada/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rocky coastline on Madeira' })).toBeInTheDocument();
    const exploreLink = screen.getByRole('link', { name: 'Explore Pebbles' });
    expect(exploreLink).toHaveAttribute('href', '/login');
    expect(exploreLink.parentElement).toHaveClass('shrink-0', 'md:flex-1', 'items-center', 'justify-center');
    const exploreCarousel = screen.getByTestId('explore-carousel');
    expect(exploreCarousel).toHaveClass('snap-x', 'snap-mandatory', 'md:flex-col', 'md:snap-none');
    expect(exploreCarousel.children).toHaveLength(4);
    const exploreDots = screen.getByTestId('explore-carousel-dots');
    expect(exploreDots).toHaveClass('md:hidden');
    expect(exploreDots.querySelectorAll('li')).toHaveLength(4);
    expect(exploreDots.querySelector('[aria-current="true"]')).toHaveClass('bg-ink');
    expect(exploreDots.querySelector('[aria-label="Slide 2 of 4"]')).toHaveClass('bg-pebble');
    Array.from(exploreCarousel.children).forEach((slide) => {
      expect(slide).toHaveClass('w-full', 'snap-start', 'flex-col', 'md:grid', 'md:grid-cols-3');
    });

    const columnHeaders = ['How it was', 'Pebble', 'How it can be']
      .map((label) => screen.getAllByText(label).find((el) => el.classList.contains('w-full')))
      .filter(Boolean);
    expect(columnHeaders).toHaveLength(3);
    columnHeaders.forEach((header) => {
      expect(header).toHaveClass('w-full', 'rounded-full', 'text-center');
    });

    [
      'LS4.B Natural Selection',
      'ETSA.B Designing Solutions',
      'LS2.C Ecosystem Dynamics',
      'PS1.B Chemical Reactions',
    ].forEach(
      (standard) => {
        const line = screen.getByText(standard);
        expect(line).toHaveClass('block', 'font-semibold', 'text-ink');
        expect(line.previousElementSibling).toHaveClass('block');
      }
    );

    const madeira = screen.getByRole('img', { name: 'Rocky coastline on Madeira' });
    expect(madeira).toHaveClass('h-20', 'w-20', 'rounded-full', 'object-cover', 'md:h-24', 'md:w-24');
    ['Terraced rice fields in Sa Pa, Vietnam', 'Scuba divers in Coiba National Park', 'Lichen growing on rock in Canada'].forEach(
      (name) => {
        const photo = screen.getByRole('img', { name });
        expect(photo).toHaveClass('h-20', 'w-20', 'rounded-full', 'object-cover', 'md:h-24', 'md:w-24');
      }
    );

    const explore = document.getElementById('explore-pebbles');
    [
      'Book',
      'Microscope',
      'Pen and paper',
      'Pencil and ruler',
      'Video',
      'Conversation',
      'Smart board',
      'Graph',
    ].forEach((name) => {
      const icon = screen.getByRole('img', { name });
      expect(icon).toHaveClass('h-16', 'w-16', 'md:h-20', 'md:w-20', 'object-contain');
      expect(explore).toContainElement(icon);
    });

    expect(explore.querySelector('.border-t-2')).toBeNull();
    expect(explore.querySelectorAll('.md\\:border-t.md\\:border-border').length).toBe(3);
  });

  test('uses snap scrolling and routes header links', () => {
    renderPage();

    expect(screen.getByTestId('how-it-works-scroll')).toHaveClass('snap-y', 'snap-mandatory');
    expect(document.getElementById('how-it-works')).toHaveClass('h-dvh', 'snap-start');
    expect(document.getElementById('explore-pebbles')).toHaveClass('h-dvh', 'snap-start');
    expect(document.getElementById('explore-pebbles')).not.toHaveClass('min-h-dvh');
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about-us');
    expect(screen.getByRole('link', { name: 'How it Works' })).toHaveAttribute(
      'href',
      '/how-it-works'
    );
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
