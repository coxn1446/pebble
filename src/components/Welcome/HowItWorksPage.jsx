import React from 'react';
import { Link } from 'react-router-dom';
import howItWorksCollect from '../../resources/how-it-works-collect.png';
import howItWorksConnect from '../../resources/how-it-works-connect.png';
import howItWorksCreate from '../../resources/how-it-works-create.png';
import exploreMadeira from '../../resources/explore-madeira.png';
import exploreSapa from '../../resources/explore-sapa.png';
import exploreCoiba from '../../resources/explore-coiba.png';
import exploreLichen from '../../resources/explore-lichen.png';
import howItWasBook from '../../resources/how-it-was-book.png';
import howItWasPenPaper from '../../resources/how-it-was-pen-paper.png';
import howItWasVideo from '../../resources/how-it-was-video.png';
import howItWasSmartBoard from '../../resources/how-it-was-smart-board.png';
import howItCanBeMicroscope from '../../resources/how-it-can-be-microscope.png';
import howItCanBePencilRuler from '../../resources/how-it-can-be-pencil-ruler.png';
import howItCanBeConversation from '../../resources/how-it-can-be-conversation.png';
import howItCanBeGraph from '../../resources/how-it-can-be-graph.png';
import {
  WelcomeHeader,
  WelcomeFooter,
  WelcomeScroller,
  WelcomeHCarousel,
  WelcomeHSlide,
  SectionHeader,
  sectionClassName,
} from './WelcomeShared';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Collect',
    src: howItWorksCollect,
    alt: 'A researcher recording a field observation beside a pebble card on a phone.',
    paragraphs: [
      'Professionals create a pebble account to document real-world phenomena that they experience at home or abroad.',
      "Observations are shared as 'pebbles' with location, notes, photos and the science behind what is observed.",
    ],
  },
  {
    title: 'Connect',
    src: howItWorksConnect,
    alt: 'Field observations connected across a world map.',
    paragraphs: [
      'Pebbles are pinned to a map, and users are connected with observations published by a global community.',
      'Filters help you explore by location, science discipline, NGSS topic, resources, and more. The shared repository grows every day.',
    ],
  },
  {
    title: 'Create',
    src: howItWorksCreate,
    alt: 'Educators turning pebble observations into a lesson.',
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
      icon: howItWasBook,
      iconAlt: 'Book',
      text: 'Students read an article about evolution and look at pictures of Galapagos finches on the different islands',
    },
    pebble: {
      image: exploreMadeira,
      alt: 'Rocky coastline on Madeira',
      text: 'Similarities between flowers on Madeira (Portugal), its neighboring archipelagos and those in North Africa and Southern Europe',
      standard: 'LS4.B Natural Selection',
    },
    canBe: {
      icon: howItCanBeMicroscope,
      iconAlt: 'Microscope',
      text: 'Students use multiple pebbles, including flowers in Madeira, as evidence in a CER to explain how living things adapt over time to their environments',
    },
  },
  {
    was: {
      icon: howItWasPenPaper,
      iconAlt: 'Pen and paper',
      text: 'Teachers assign a worksheet with a passage about agriculture and its importance',
    },
    pebble: {
      image: exploreSapa,
      alt: 'Terraced rice fields in Sa Pa, Vietnam',
      text: 'Terraced rice paddy fields in Sa Pa, Vietnam and transformations driven by climate change and water scarcity',
      standard: 'ETSA.B Designing Solutions',
    },
    canBe: {
      icon: howItCanBePencilRuler,
      iconAlt: 'Pencil and ruler',
      text: 'Students design a solution to a challenge in a local agricultural system and share it with the community, using Vietnam as a case study',
    },
  },
  {
    was: {
      icon: howItWasVideo,
      iconAlt: 'Video',
      text: 'Teachers show a video about coral reefs and ocean conservation',
    },
    pebble: {
      image: exploreCoiba,
      alt: 'Scuba divers in Coiba National Park',
      text: 'Scuba diving in Coiba National Park that comprises 270,000 hectares of protected marine areas, islands, mangroves and tropical forests',
      standard: 'LS2.C Ecosystem Dynamics',
    },
    canBe: {
      icon: howItCanBeConversation,
      iconAlt: 'Conversation',
      text: 'Students analyze Coiba reef survey data and use mathematical representations to determine if there is a change in biodiversity',
    },
  },
  {
    was: {
      icon: howItWasSmartBoard,
      iconAlt: 'Smart board',
      text: 'Teachers lecture about chemical reactions using diagrams and notes',
    },
    pebble: {
      image: exploreLichen,
      alt: 'Lichen growing on rock in Canada',
      text: 'Lichens and moss growing on rocks in Canada contribute to the chemical breakdown of rock minerals',
      standard: 'PS1.B Chemical Reactions',
    },
    canBe: {
      icon: howItCanBeGraph,
      iconAlt: 'Graph',
      text: 'Students analyze evidence from lichen-rock interactions and use particle models to illustrate how chemical reactions cause rocks to break down',
    },
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className={`${sectionClassName} relative overflow-hidden`}>
    <WelcomeHeader />
    <div
      data-testid="how-it-works-stage"
      className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-24 pb-8 md:overflow-y-auto md:px-8 md:pt-36"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <SectionHeader
          label="Mechanics"
          title="How it Works"
          compact
          className="mb-3 shrink-0 md:mb-5"
        />

        <WelcomeHCarousel
          testId="how-it-works-columns"
          label="Collect, Connect, and Create"
          className="min-h-0 flex-1 gap-0 md:grid md:flex-none md:snap-none md:grid-cols-3 md:overflow-visible md:divide-x md:divide-y-0 md:divide-ink"
        >
          {HOW_IT_WORKS_STEPS.map((step) => (
            <WelcomeHSlide
              key={step.title}
              className="justify-center text-center md:h-auto md:w-auto md:shrink md:justify-start md:row-span-4 md:grid md:grid-rows-subgrid"
            >
              <h3 className="mb-3 px-4 font-display text-2xl font-medium text-ink md:text-3xl">
                {step.title}
              </h3>
              <div className="flex h-32 w-full items-end justify-center px-3 md:h-44 lg:h-56">
                <img src={step.src} alt={step.alt} className="max-h-full w-full object-contain object-bottom" />
              </div>
              <p className="flex items-center px-4 md:h-full">
                <span className="w-full text-sm font-semibold leading-snug text-ink">{step.paragraphs[0]}</span>
              </p>
              <p className="mt-3 flex items-start px-4 md:mt-0 md:h-full">
                <span className="w-full text-sm leading-snug text-ink/70">{step.paragraphs[1]}</span>
              </p>
            </WelcomeHSlide>
          ))}
        </WelcomeHCarousel>
      </div>
    </div>
  </section>
);

const ExploreCell = ({ icon, iconAlt, image, imageAlt, children }) => (
  <div className="flex min-h-0 flex-1 items-center md:h-full md:flex-none">
    <div className="flex items-center gap-3">
      {image ? (
        <img
          src={image}
          alt={imageAlt}
          className="h-20 w-20 shrink-0 rounded-full object-cover md:h-24 md:w-24"
        />
      ) : (
        <img src={icon} alt={iconAlt} className="h-16 w-16 shrink-0 object-contain md:h-20 md:w-20" />
      )}
      <div className="min-w-0 text-sm leading-snug text-ink/70">{children}</div>
    </div>
  </div>
);

const ExplorePebblesSection = () => (
  <section
    id="explore-pebbles"
    className="flex h-dvh w-full snap-start snap-always flex-col overflow-hidden bg-surface"
  >
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 pt-6 md:overflow-y-auto md:px-8 md:pt-20">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col md:flex-none">
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

        <WelcomeHCarousel
          testId="explore-carousel"
          label="How it was, Pebble, and how it can be"
          className="mt-0 min-h-0 flex-1 md:mt-3 md:flex md:flex-none md:flex-col md:snap-none md:overflow-visible"
        >
          {EXPLORE_ROWS.map((row, index) => (
            <WelcomeHSlide
              key={row.pebble.standard}
              className={`justify-center gap-4 px-4 md:grid md:h-auto md:w-full md:shrink md:grid-cols-3 md:items-stretch md:gap-6 md:px-0 md:py-3 ${
                index === 0 ? '' : 'md:border-t md:border-border'
              }`}
            >
              <ExploreCell icon={row.was.icon} iconAlt={row.was.iconAlt}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink md:hidden">
                  How it was
                </span>
                {row.was.text}
              </ExploreCell>
              <ExploreCell icon={null} image={row.pebble.image} imageAlt={row.pebble.alt}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink md:hidden">
                  Pebble
                </span>
                <span className="block">{row.pebble.text}</span>
                <span className="mt-1 block font-semibold text-ink">{row.pebble.standard}</span>
              </ExploreCell>
              <ExploreCell icon={row.canBe.icon} iconAlt={row.canBe.iconAlt}>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink md:hidden">
                  How it can be
                </span>
                {row.canBe.text}
              </ExploreCell>
            </WelcomeHSlide>
          ))}
        </WelcomeHCarousel>
      </div>
      <div className="flex w-full shrink-0 items-center justify-center px-4 py-6 md:flex-1">
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-xl bg-ink px-10 py-3 text-lg font-semibold text-white transition hover:bg-ocean"
        >
          Explore Pebbles
        </Link>
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
