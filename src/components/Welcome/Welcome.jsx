import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from '../Brand/BrandMark';
import audienceEducators from '../../resources/educators.png';
import audienceResearchers from '../../resources/researchers.png';
import audienceAcademics from '../../resources/academics.png';
import audienceOrganizations from '../../resources/organizations.png';
import methodologyArt from '../../resources/building nest map.png';
import { ArrowDownRightIcon } from '../Icons/Icons';
import {
  WELCOME_TAGLINE,
  WelcomeHeader,
  WelcomeFooter,
  WelcomeScroller,
  SectionHeader,
  sectionClassName,
  sectionPadClassName,
} from './WelcomeShared';

export { WELCOME_TAGLINE };

const METHODOLOGY_STEPS = [
  {
    number: '01',
    title: 'Collect',
    description: 'Observe and document meaningful real-world phenomena.',
    active: false,
  },
  {
    number: '02',
    title: 'Connect',
    description: 'Pin discoveries on a map and build a network of shared knowledge.',
    active: false,
  },
  {
    number: '03',
    title: 'Create',
    description:
      'Use those observations to design authentic inquiry-driven learning grounded in real-world evidence.',
    active: true,
  },
];

const AUDIENCES = [
  {
    title: 'Educators',
    description: 'Bringing real-world phenomena into the classroom to ground abstract concepts',
    src: audienceEducators,
  },
  {
    title: 'Researchers',
    description: 'Documenting and sharing field observations to build a verified global repository',
    src: audienceResearchers,
  },
  {
    title: 'Academics',
    description: 'Synthesizing peer-reviewed data into accessible narratives',
    src: audienceAcademics,
  },
  {
    title: 'Organizations',
    description: 'Increasing visibility for large-scale environmental and scientific initiatives',
    src: audienceOrganizations,
  },
];

const WelcomeHero = () => (
  <section id="hero" className={`${sectionClassName} relative`}>
    <WelcomeHeader />
    <div className={`${sectionPadClassName} overflow-y-auto`}>
      <div className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center animate-fade-up md:gap-8">
        <div className="flex items-center gap-3 md:gap-5">
          <BrandMark size="hero" showWordmark={false} to={null} animated />
          <div className="flex w-max flex-col gap-2 md:gap-3">
            <h1 className="whitespace-nowrap font-display text-4xl font-medium lowercase leading-none tracking-tight text-ink md:text-5xl lg:text-6xl">
              pebble
            </h1>
            <p
              className="flex justify-between font-display text-xs font-semibold uppercase text-moss"
              aria-label={WELCOME_TAGLINE}
            >
              <span>Collect</span>
              <span aria-hidden="true" className="text-ink">
                •
              </span>
              <span>Connect</span>
              <span aria-hidden="true" className="text-ink">
                •
              </span>
              <span>Create</span>
            </p>
          </div>
        </div>
        <p className="max-w-2xl font-sans text-lg leading-relaxed text-ink/70 md:text-2xl">
          A global ecosystem where educators and researchers pin real-world phenomena, share
          discoveries, and build a collaborative network of place-based learning.
        </p>
        <Link
          to="/login"
          className="mt-2 inline-flex items-center gap-3 rounded-full border-2 border-ink px-8 py-3 text-ink transition hover:bg-ink hover:text-white"
        >
          <ArrowDownRightIcon className="h-6 w-6" />
          <span className="text-xl font-semibold uppercase tracking-wide">Get started</span>
        </Link>
      </div>
    </div>
  </section>
);

const AudienceSection = () => (
  <section id="audience" className={sectionClassName}>
    <div
      data-testid="audience-stage"
      className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 py-16 md:px-8 md:py-20"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader
          label="Audience"
          title="Who is pebble for?"
          className="mb-0"
          titleClassName="leading-none"
        />
        <div className="h-16 shrink-0" data-testid="audience-gap" />

        <div className="grid grid-cols-2 items-start gap-x-3 gap-y-6 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-8">
          {AUDIENCES.map(({ title, description, src }) => (
            <div key={title} className="group text-center">
              <img src={src} alt="" className="mx-auto mb-2 h-24 w-auto md:h-32 lg:h-40" />
              <h3 className="mb-3 font-display text-2xl font-medium text-ink">{title}</h3>
              <p className="px-2 text-sm leading-none text-ink/70">{description}</p>
            </div>
          ))}
        </div>

        <div className="h-16 shrink-0" data-testid="audience-gap" />
        <p data-testid="audience-note" className="text-center text-sm italic leading-none text-moss">
          Note: Pebble is organized for science-related disciplines
        </p>
      </div>
    </div>
  </section>
);

const MethodologySection = () => (
  <section id="methodology" className={sectionClassName}>
    <div
      data-testid="methodology-body"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-16 pb-8 md:px-8 md:pt-20"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 lg:grid-cols-2 lg:gap-12">
        <div className="flex w-full min-h-0 flex-col" data-testid="methodology-copy">
          <SectionHeader
            label="Methodology"
            title={
              <>
                Building the Nest…
                <br />
                think Gentoo Penguins!
              </>
            }
            align="left"
            compact
            titleClassName="leading-tight"
          />
          <div className="flex flex-col gap-6">
            <p className="max-w-lg text-base leading-relaxed text-ink/70">
              The Pebble platform operates on a simple, iterative cycle — gathering individual
              observations (pebbles) to construct a robust, interconnected catalog of our world.
            </p>

            <ol className="relative">
              {METHODOLOGY_STEPS.map((step, index) => (
                <li key={step.number} className="relative flex items-start gap-4">
                  <div className="relative flex w-10 shrink-0 flex-col items-center self-stretch">
                    {index < METHODOLOGY_STEPS.length - 1 ? (
                      <span
                        className="absolute left-1/2 top-10 bottom-0 w-px -translate-x-1/2 bg-border"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                        step.active ? 'bg-ocean text-white shadow-md' : 'bg-ocean/15 text-ocean'
                      }`}
                    >
                      {step.number}
                    </span>
                  </div>
                  <div className={`min-w-0 flex-1 ${index < METHODOLOGY_STEPS.length - 1 ? 'pb-6' : ''}`}>
                    <h3 className="mb-1 font-display text-xl font-medium text-ink">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-ink/70">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex w-full justify-center pt-2 pb-6">
              <Link
                to="/about-us"
                data-testid="methodology-learn-more"
                className="inline-flex items-center justify-center rounded-full border-2 border-ink px-6 py-2 text-sm font-semibold uppercase tracking-wide text-ink transition hover:bg-ink hover:text-white"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <img
            src={methodologyArt}
            alt="A pebble observation card with a verified map location"
            className="max-h-48 w-full max-w-md object-contain sm:max-h-64 lg:max-h-none"
          />
        </div>
      </div>
    </div>
    <WelcomeFooter />
  </section>
);

/**
 * Guest home: hero → audience → methodology.
 */
const Welcome = () => (
  <WelcomeScroller testId="welcome-scroll">
    <WelcomeHero />
    <AudienceSection />
    <MethodologySection />
  </WelcomeScroller>
);

export default Welcome;
