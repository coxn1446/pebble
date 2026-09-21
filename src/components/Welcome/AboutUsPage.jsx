import React from 'react';
import aboutAntarctica from '../../resources/about us antartica.png';
import aboutCanada from '../../resources/about us canada.png';
import aboutNewYork from '../../resources/about us new york.png';
import aboutPanama from '../../resources/about us panama.png';
import aboutItaly from '../../resources/about us dolomites.png';
import aboutGalapagos from '../../resources/about us galapagos.png';
import aboutSapa from '../../resources/about us sa pa.png';
import aboutKyrgyzstan from '../../resources/about us kyrgyzstan.png';
import { CheckIcon } from '../Icons/Icons';
import {
  WelcomeHeader,
  WelcomeFooter,
  WelcomeScroller,
  SectionHeader,
  marketingTitleColumnClassName,
} from './WelcomeShared';

const ABOUT_JOURNEY = [
  {
    date: 'JUL 2023',
    place: 'CANADA',
    src: aboutCanada,
    alt: 'Lichen-covered boulders in Canada',
  },
  {
    date: 'AUG 2023',
    place: 'NEW YORK',
    src: aboutNewYork,
    alt: 'A patterned beetle in New York',
  },
  {
    date: 'FEB 2024',
    place: 'PANAMA',
    src: aboutPanama,
    alt: 'A scuba diver among coral and fish in Panama',
  },
  {
    date: 'JUL 2024',
    place: 'ITALY',
    src: aboutItaly,
    alt: 'Jagged mountain peaks in Italy',
  },
  {
    date: 'AUG 2024',
    place: 'GALAPAGOS ISLANDS',
    src: aboutGalapagos,
    alt: 'Two seabirds facing each other in the Galápagos',
  },
  {
    date: 'DEC 2024',
    place: 'ANTARCTICA',
    src: aboutAntarctica,
    alt: 'Gentoo penguins stacking pebbles in Antarctica',
  },
  {
    date: 'AUG 2025',
    place: 'SA PA',
    src: aboutSapa,
    alt: 'Terraced rice fields in Sa Pa, Vietnam',
  },
  {
    date: 'JUL 2026',
    place: 'KYRGYZSTAN',
    src: aboutKyrgyzstan,
    alt: 'Two climbers roped together on a mountain ridge in Kyrgyzstan',
  },
];

const JOURNEY_FIRST = ABOUT_JOURNEY.slice(0, 4);
const JOURNEY_SECOND = ABOUT_JOURNEY.slice(4);

const DIFFERENT_POINTS = [
  'Pebbles are created by professionals',
  'Real places / Real observations',
  'Pebble adapts to a changing planet',
  'Science-focused, interdisciplinary uses',
  'Tagged by topic & location, easily searchable',
  'Helpful resources (field notes, media, data)',
  'Guided tutorial & support',
  'Pebble responds to your feedback to make the tool more useful!',
];

const AboutJourneyItem = ({ date, src, alt, isFirst, isLast }) => (
  <li className="relative flex min-h-0 flex-1 items-center gap-3">
    <time className="w-20 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-ink/60">
      {date}
    </time>
    <span
      className="relative flex w-4 shrink-0 self-stretch items-center justify-center"
      aria-hidden="true"
    >
      {isFirst ? null : <span className="welcome-timeline-line welcome-timeline-line-up" />}
      {isLast ? null : <span className="welcome-timeline-line welcome-timeline-line-down" />}
      <span className="welcome-timeline-pebble relative z-10" />
    </span>
    <figure className="flex h-full min-h-0 w-28 shrink-0 items-center justify-center py-2 md:w-44">
      <img src={src} alt={alt} className="max-h-full w-auto max-w-full object-contain" />
    </figure>
  </li>
);

const FieldJourney = ({ stops, continueFrom = false, continueTo = false, className }) => (
  <ol className={className} aria-label="Field journey">
    {stops.map((stop, index) => (
      <AboutJourneyItem
        key={stop.place}
        {...stop}
        isFirst={index === 0 && !continueFrom}
        isLast={index === stops.length - 1 && !continueTo}
      />
    ))}
  </ol>
);

const AboutLetter = () => (
  <div className="min-h-0 w-full max-w-xl">
    <SectionHeader label="Inspiration" title="About Us" align="left" compact />
    <div className="space-y-3 text-justify text-xs leading-snug text-ink/70">
      <p className="font-semibold text-ink">
        Nature inspires the best things in life, and Pebble is no different.
      </p>
      <p>
        During an expedition to Antarctica as a Grosvenor Teacher Fellow with National Geographic
        and Lindblad Expeditions, I observed a large breeding colony of Gentoo penguins. It was
        comical chaos... thievery, feuds, and frantic pebble-gifting. But beneath the chaos was
        something remarkable: penguins collecting individual pebbles and working together to build
        nests that protect the next generation.
      </p>
      <p>
        I started wondering...{' '}
        <strong className="font-semibold text-ink">what if we could do something similar?</strong>
      </p>
      <p>
        What if educators, researchers, and explorers could collect their real-world observations-
        metaphorical “pebbles”- and bring them together to create a shared resource for learning?
      </p>
      <p>
        A few years ago, I realized how difficult it was to find compelling, relevant, real-world
        stories for my science classroom that were connected to content standards and ready to use
        with students. I was tired of relying on decades-old examples (think peppered moths and the
        Industrial Revolution) when our world was full of new stories waiting to be explored. So, I
        started using my own.
      </p>
      <p>
        In meeting other professionals through my work and travels, I realized that I wasn&apos;t
        the only one collecting these stories. There is an incredible community of people observing,
        documenting, and protecting our changing world, but their experiences and discoveries are
        often scattered and not readily accessible to educators.
      </p>
      <p className="font-semibold text-ink">So, I decided to build the nest.</p>
      <p>
        Pebble brings these stories together in one searchable, shared space, helping educators
        discover real-world phenomena and turn them into meaningful learning experiences.
      </p>
      <p>
        Our pebble-collecting, nest-building enterprise will be considerably less dramatic than the
        penguins’, but no less valuable.
      </p>
      <p>Now, I invite you to add your pebble.</p>
    </div>
  </div>
);

const HowWeAreDifferentCard = () => (
  <div className="w-full rounded-3xl bg-background px-6 py-10 md:px-12 md:py-14">
    <h2 className="mb-10 font-display text-3xl font-medium text-ink md:text-4xl">
      How we&apos;re <em className="welcome-different-mark">different</em>
    </h2>
    <ul className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
      {DIFFERENT_POINTS.map((point) => (
        <li key={point} className="flex items-start gap-3">
          <span className="welcome-check-pebble mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-ink">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <p className="font-display text-sm leading-snug text-ink md:text-base">{point}</p>
        </li>
      ))}
    </ul>
    <p className="mt-12 text-center font-display text-lg text-ink md:text-xl">
      Made for educators <em>by an educator</em>
    </p>
  </div>
);

const AboutUsSection = () => (
  <section
    id="about-us"
    className="relative flex min-h-dvh w-full snap-start snap-always flex-col overflow-hidden bg-surface lg:h-dvh"
  >
    <WelcomeHeader />
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 w-full flex-col self-stretch pt-24 lg:w-2/5">
        <FieldJourney
          stops={JOURNEY_FIRST}
          continueTo
          className="flex min-h-0 flex-1 flex-col"
        />
      </div>
      <div className={`${marketingTitleColumnClassName} lg:w-3/5`}>
        <AboutLetter />
      </div>
    </div>
  </section>
);

const HowWeAreDifferentSection = () => (
  <section
    id="how-we-are-different"
    className="flex min-h-dvh w-full snap-start snap-always flex-col overflow-hidden bg-surface lg:h-dvh"
  >
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 w-full flex-col self-stretch lg:w-2/5">
        <FieldJourney
          stops={JOURNEY_SECOND}
          continueFrom
          className="flex min-h-0 flex-1 flex-col"
        />
      </div>
      <div className="flex min-h-0 w-full flex-1 items-center px-4 py-8 md:px-8 lg:w-3/5">
        <HowWeAreDifferentCard />
      </div>
    </div>
    <WelcomeFooter />
  </section>
);

const AboutUsPage = () => (
  <WelcomeScroller testId="about-us-scroll">
    <AboutUsSection />
    <HowWeAreDifferentSection />
  </WelcomeScroller>
);

export default AboutUsPage;
