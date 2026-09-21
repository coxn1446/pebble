import React from 'react';
import { Link } from 'react-router-dom';
import howItWorksArt from '../../resources/how it works.png';
import exploreMadeira from '../../resources/explore-madeira.png';
import exploreSapa from '../../resources/explore-sapa.png';
import exploreCoiba from '../../resources/explore-coiba.png';
import exploreLichen from '../../resources/explore-lichen.png';
import {
  BoardIcon,
  BookOpenIcon,
  ChartIcon,
  ClipboardIcon,
  DesignIcon,
  MicroscopeIcon,
  UsersIcon,
  VideoIcon,
} from '../Icons/Icons';
import {
  WelcomeHeader,
  WelcomeFooter,
  WelcomeScroller,
  SectionHeader,
  sectionClassName,
  marketingTitleColumnClassName,
} from './WelcomeShared';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Collect',
    paragraphs: [
      'Professionals create a pebble account to document real-world phenomena that they experience at home or abroad.',
      "Observations are shared as 'pebbles' with location, notes, photos and the science behind what is observed.",
    ],
  },
  {
    title: 'Connect',
    paragraphs: [
      'Pebbles are pinned to a map, and users are connected with observations published by a global community.',
      'Filters help you explore by location, science discipline, NGSS topic, resources, and more. The shared repository grows every day.',
    ],
  },
  {
    title: 'Create',
    paragraphs: [
      'Educators turn pebbles into meaningful, standards-aligned learning.',
      'Lessons, activities and assessments use real observations and evidence to spark curiosity and deepen understanding.',
    ],
  },
];

const EXPLORE_HEADERS = [
  { label: 'How it was', tone: 'bg-sandstone/30' },
  { label: 'Pebble', tone: 'bg-ocean/10' },
  { label: 'How it can be', tone: 'bg-moss/20' },
];

const EXPLORE_ROWS = [
  {
    was: {
      icon: BookOpenIcon,
      text: 'Students read an article about evolution and look at pictures of Galapagos finches on the different islands.',
    },
    pebble: {
      image: exploreMadeira,
      alt: 'Rocky coastline on Madeira',
      text: 'Similarities between flowers on Madeira (Portugal), its neighboring archipelagos and those in North Africa and Southern Europe.',
      standard: 'LS4.B Natural Selection',
    },
    canBe: {
      icon: MicroscopeIcon,
      text: (
        <>
          Students use <em>multiple</em> pebbles, including flowers in Madeira, as evidence in a CER
          to explain how living things adapt over time to their environments.
        </>
      ),
    },
  },
  {
    was: {
      icon: ClipboardIcon,
      text: 'Teachers assign a worksheet with a passage about agriculture and its importance.',
    },
    pebble: {
      image: exploreSapa,
      alt: 'Terraced rice fields in Sa Pa, Vietnam',
      text: 'Terraced rice paddy fields in Sa Pa, Vietnam and transformations driven by climate change and water scarcity.',
      standard: 'ETSA.B Designing Solutions',
    },
    canBe: {
      icon: DesignIcon,
      text: 'Students design a solution to a challenge in a local agricultural system and share it with the community, using Vietnam as a case study.',
    },
  },
  {
    was: {
      icon: VideoIcon,
      text: 'Teachers show a video about coral reefs and ocean conservation.',
    },
    pebble: {
      image: exploreCoiba,
      alt: 'Scuba divers in Coiba National Park',
      text: 'Scuba diving in Coiba National Park that comprises 270,000 hectares of protected marine areas, islands, mangroves and tropical forests.',
      standard: 'LS2.C Ecosystem Dynamics',
    },
    canBe: {
      icon: UsersIcon,
      text: 'Students analyze Coiba reef survey data and use mathematical representations to determine if there is a change in biodiversity.',
    },
  },
  {
    was: {
      icon: BoardIcon,
      text: 'Teachers lecture about chemical reactions using diagrams and notes.',
    },
    pebble: {
      image: exploreLichen,
      alt: 'Lichen growing on rock in Canada',
      text: 'Lichens and moss growing on rocks in Canada contribute to the chemical breakdown of rock minerals.',
      standard: 'PS1.B Chemical Reactions',
    },
    canBe: {
      icon: ChartIcon,
      text: 'Students analyze evidence from lichen-rock interactions and use particle models to illustrate how chemical reactions cause rocks to break down.',
    },
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className={`${sectionClassName} relative overflow-hidden`}>
    <WelcomeHeader />
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
      <div className={marketingTitleColumnClassName}>
        <div className="w-full pt-10">
          <SectionHeader label="Mechanics" title="How it Works" compact />

          <div className="mx-auto w-full max-w-4xl">
            <img
              src={howItWorksArt}
              alt="Collect field observations, connect them on a global map, and create lessons from real evidence."
              className="mb-5 w-full"
            />

            <div className="grid min-h-0 grid-cols-1 gap-6 md:grid-cols-3 md:gap-0">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className={`text-center md:px-4 ${
                    index > 0 ? 'border-t border-border pt-6 md:border-l md:border-t-0 md:pt-0' : ''
                  }`}
                >
                  <h3 className="mb-3 font-display text-2xl font-medium text-ink md:text-3xl">
                    {step.title}
                  </h3>
                  <div className="space-y-2 text-sm leading-snug text-ink/70">
                    {step.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ExploreCell = ({ icon: Icon, image, imageAlt, children }) => (
  <div className="flex h-full items-center">
    <div className={`flex gap-3 ${image ? 'items-center' : 'items-start'}`}>
      {image ? (
        <img
          src={image}
          alt={imageAlt}
          className="h-20 w-20 shrink-0 rounded-full object-cover md:h-24 md:w-24"
        />
      ) : (
        <Icon className="mt-0.5 h-7 w-7 shrink-0 text-pebble" />
      )}
      <p className="min-w-0 text-sm leading-snug text-ink/70">{children}</p>
    </div>
  </div>
);

const ExplorePebblesSection = () => (
  <section
    id="explore-pebbles"
    className="flex min-h-dvh w-full snap-start snap-always flex-col bg-surface"
  >
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-16 pb-4 md:px-8 md:pt-20">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <div className="hidden shrink-0 grid-cols-3 gap-6 md:grid">
          {EXPLORE_HEADERS.map(({ label, tone }) => (
            <p
              key={label}
              className={`w-full rounded-full px-6 py-2 text-center text-sm font-semibold uppercase tracking-wide text-ink ${tone}`}
            >
              {label}
            </p>
          ))}
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          {EXPLORE_ROWS.map((row, index) => (
            <div
              key={row.pebble.standard}
              className={`grid min-h-0 flex-1 grid-cols-1 items-center gap-3 py-3 md:grid-cols-3 md:gap-6 ${
                index === 0 ? '' : 'border-t border-border'
              }`}
            >
              <ExploreCell icon={row.was.icon}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink md:hidden">
                  How it was
                </span>
                {row.was.text}
              </ExploreCell>
              <ExploreCell icon={null} image={row.pebble.image} imageAlt={row.pebble.alt}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink md:hidden">
                  Pebble
                </span>
                {row.pebble.text}{' '}
                <span className="font-semibold text-ink">{row.pebble.standard}</span>
              </ExploreCell>
              <ExploreCell icon={row.canBe.icon}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink md:hidden">
                  How it can be
                </span>
                {row.canBe.text}
              </ExploreCell>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 justify-center pt-4 pb-4">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-ink px-10 py-3 text-lg font-semibold text-white transition hover:bg-ocean"
          >
            Explore Pebbles
          </Link>
        </div>
      </div>
    </div>
    <WelcomeFooter />
  </section>
);

const HowItWorksPage = () => (
  <WelcomeScroller testId="how-it-works-scroll">
    <HowItWorksSection />
    <ExplorePebblesSection />
  </WelcomeScroller>
);

export default HowItWorksPage;
