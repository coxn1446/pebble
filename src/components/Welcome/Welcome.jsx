import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from '../Brand/BrandMark';
import howItWorksArt from '../../resources/how-it-works.png';
import exploreMadeira from '../../resources/explore-madeira.png';
import exploreSapa from '../../resources/explore-sapa.png';
import exploreCoiba from '../../resources/explore-coiba.png';
import exploreLichen from '../../resources/explore-lichen.png';
import aboutLineChemistry from '../../resources/about-line-chemistry.png';
import aboutLineEntomology from '../../resources/about-line-entomology.png';
import aboutLineMarine from '../../resources/about-line-marine.png';
import aboutLineGeology from '../../resources/about-line-geology.png';
import aboutLineEcology from '../../resources/about-line-ecology.png';
import aboutLineConservation from '../../resources/about-line-conservation.png';
import aboutLineAgriculture from '../../resources/about-line-agriculture.png';
import aboutLinePhysics from '../../resources/about-line-physics.png';
import {
  ArrowDownRightIcon,
  BoardIcon,
  BookOpenIcon,
  BuildingIcon,
  ChartIcon,
  ClipboardIcon,
  DesignIcon,
  GraduationIcon,
  LeafIcon,
  MicroscopeIcon,
  PinIcon,
  UserIcon,
  UsersIcon,
  VideoIcon,
} from '../Icons/Icons';

export const WELCOME_TAGLINE = 'Collect • Connect • Create';

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
    icon: GraduationIcon,
    blobClass: 'welcome-blob-educators',
  },
  {
    title: 'Researchers',
    description: 'Documenting and sharing field observations to build a verified global repository',
    icon: MicroscopeIcon,
    blobClass: 'welcome-blob-researchers',
  },
  {
    title: 'Academics',
    description: 'Synthesizing peer-reviewed data into accessible narratives',
    icon: BookOpenIcon,
    blobClass: 'welcome-blob-academics',
  },
  {
    title: 'Organizations',
    description: 'Increasing visibility for large-scale environmental and scientific initiatives',
    icon: BuildingIcon,
    blobClass: 'welcome-blob-organizations',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Collect',
    artClass: '',
    paragraphs: [
      'Professionals create a pebble account to document real-world phenomena that they experience at home or abroad.',
      "Observations are shared as 'pebbles' with location, notes, photos and the science behind what is observed.",
    ],
  },
  {
    title: 'Connect',
    artClass: '-translate-x-1/3',
    paragraphs: [
      'Pebbles are pinned to a map, and users are connected with observations published by a global community.',
      'Filters help you explore by location, science discipline, NGSS topic, resources, and more. The shared repository grows every day.',
    ],
  },
  {
    title: 'Create',
    artClass: '-translate-x-2/3',
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

const ABOUT_JOURNEY = [
  {
    date: 'Jul 2023',
    location: 'Canada',
    field: 'Chemistry',
    src: aboutLineChemistry,
    alt: 'Lichen-covered boulders',
  },
  {
    date: 'Aug 2023',
    location: 'New York',
    field: 'Entomology',
    src: aboutLineEntomology,
    alt: 'A patterned beetle',
  },
  {
    date: 'Feb 2024',
    location: 'Panama',
    field: 'Marine Biology',
    src: aboutLineMarine,
    alt: 'A scuba diver among coral and fish',
  },
  {
    date: 'Jul 2024',
    location: 'Dolomites, Italy',
    field: 'Geology',
    src: aboutLineGeology,
    alt: 'Jagged mountain peaks and pines',
  },
  {
    date: 'Aug 2024',
    location: 'Galápagos Islands',
    field: 'Ecology',
    src: aboutLineEcology,
    alt: 'Two seabirds facing each other',
  },
  {
    date: 'Dec 2024',
    location: 'Costa Rica',
    field: 'Conservation',
    src: aboutLineConservation,
    alt: 'A frog on a tropical leaf',
  },
  {
    date: 'Aug 2025',
    location: 'Sa Pa, Vietnam',
    field: 'Agricultural Science',
    src: aboutLineAgriculture,
    alt: 'Terraced rice fields in a mountain valley',
  },
  {
    date: 'Jul 2026',
    location: 'Kyrgyzstan',
    field: 'Physics',
    src: aboutLinePhysics,
    alt: 'Two climbers roped together on a mountain ridge',
  },
];

const FOOTER_LINKS = [
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
  { label: 'Contact', href: '#contact' },
];

/** Shared full-viewport snap section chrome */
const sectionClassName =
  'flex h-dvh min-h-dvh w-full snap-start snap-always flex-col bg-surface';

/** Shared top inset so section headers align across panels */
const sectionPadClassName = 'flex min-h-0 flex-1 flex-col px-4 pt-24 pb-8 md:px-8 md:pt-28 md:pb-10';

const SectionHeader = ({ label, title, align = 'center', compact = false }) => (
  <div className={`${compact ? 'mb-5 md:mb-6' : 'mb-12 md:mb-16'} ${align === 'left' ? 'text-left' : 'text-center'}`}>
    <p className="mb-2 text-sm font-semibold uppercase tracking-tagline text-moss">{label}</p>
    <h2 className="font-display text-4xl font-medium text-ink md:text-5xl">{title}</h2>
  </div>
);

const WelcomeHeader = () => (
  <header className="absolute inset-x-0 top-0 z-20">
    <div
      className="welcome-nav-fade pointer-events-none absolute inset-x-0 top-0 h-44"
      aria-hidden="true"
    />
    <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
      <div className="flex items-center gap-8">
        <BrandMark size="md" to={null} />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Welcome">
          <a href="#about-us" className="text-lg text-ink transition hover:text-ocean">
            About Us
          </a>
          <a href="#how-it-works" className="text-lg text-ink transition hover:text-ocean">
            How it Works
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-lg font-medium text-ink transition hover:text-ocean">
          Log In
        </Link>
        <Link
          to="/login"
          aria-label="Log in"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink hover:text-white"
        >
          <UserIcon className="h-5 w-5" />
        </Link>
      </div>
    </div>
  </header>
);

const WelcomeHero = () => (
  <section id="hero" className={`${sectionClassName} relative`}>
    <WelcomeHeader />
    <div className={`${sectionPadClassName} justify-center`}>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center animate-fade-up">
        <div className="flex items-center gap-4 md:gap-5">
          <BrandMark size="hero" showWordmark={false} to={null} animated />
          <div className="text-left">
            <h1 className="font-display text-5xl font-medium lowercase tracking-tight text-ink md:text-6xl">
              pebble
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-tagline text-moss">
              {WELCOME_TAGLINE}
            </p>
          </div>
        </div>
        <p className="max-w-2xl text-lg font-light leading-relaxed text-ink/70 md:text-2xl">
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
    <div className={sectionPadClassName}>
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader label="Audience" title="Who is pebble for?" />

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(({ title, description, icon: Icon, blobClass }) => (
            <div key={title} className="group text-center">
              <div className={`welcome-blob mb-6 ${blobClass}`}>
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="mb-4 font-display text-2xl font-medium text-ink">{title}</h3>
              <p className="px-2 text-sm leading-relaxed text-ink/70">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const MethodologyMockup = () => (
  <div className="welcome-network relative w-full max-w-md overflow-hidden rounded-3xl p-6 md:p-8">
    <div className="relative mx-auto max-w-xs">
      <div className="rounded-2xl bg-surface px-4 py-4 shadow-lg">
        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-moss/15 text-moss">
          <LeafIcon className="h-4 w-4" />
        </div>
        <div className="space-y-2.5">
          <div className="h-2.5 w-4/5 rounded-full bg-ocean/20" />
          <div className="h-2.5 w-3/5 rounded-full bg-ocean/15" />
          <div className="h-2.5 w-2/3 rounded-full bg-ocean/10" />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="rounded-full bg-moss/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-moss">
            Flora
          </span>
          <span className="text-base leading-none text-pebble" aria-hidden="true">
            …
          </span>
        </div>
      </div>

      <div className="absolute -bottom-1 left-3 right-3 flex items-center gap-2.5 rounded-2xl bg-surface px-3 py-2.5 shadow-lg md:left-6 md:right-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean/10 text-ocean">
          <PinIcon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-semibold text-ink">45.021° N, 12.332° E</p>
          <p className="text-xs text-ink/70">Verified Location</p>
        </div>
      </div>
    </div>
    <div className="h-8" aria-hidden="true" />
  </div>
);

const MethodologySection = () => (
  <section id="methodology" className={sectionClassName}>
    <div className={sectionPadClassName}>
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader
          label="Methodology"
          title="Building the Nest…think Gentoo Penguins!"
          align="left"
        />

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-6 max-w-lg text-base leading-relaxed text-ink/70">
              The Pebble platform operates on a simple, iterative cycle — gathering individual
              observations (pebbles) to construct a robust, interconnected catalog of our world.
            </p>

            <div className="relative space-y-6 pl-1 sm:pl-2">
              <div
                className="absolute bottom-2 left-5 top-2 hidden w-px bg-border sm:block"
                aria-hidden="true"
              />
              {METHODOLOGY_STEPS.map((step) => (
                <div key={step.number} className="relative flex items-start gap-4">
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      step.active ? 'bg-ocean text-white shadow-md' : 'bg-background text-pebble'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3 className="mb-1 font-display text-xl font-medium text-ink">{step.title}</h3>
                    <p className="max-w-sm text-sm leading-relaxed text-ink/70">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div className="flex justify-center lg:justify-end">
            <MethodologyMockup />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section id="how-it-works" className={`${sectionClassName} overflow-hidden`}>
    <div className={sectionPadClassName}>
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader label="Mechanics" title="How it Works" />

        <img
          src={howItWorksArt}
          alt="Collect field observations, connect them on a global map, and create lessons from real evidence."
          className="mb-8 w-full md:hidden"
        />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div
              key={step.title}
              className={`text-center md:px-8 ${
                index > 0 ? 'border-t border-border pt-10 md:border-l md:border-t-0 md:pt-0' : ''
              }`}
            >
              <h3 className="mb-5 font-display text-3xl font-medium text-ink">{step.title}</h3>
              <div className="welcome-how-art mb-5 hidden md:block">
                <img src={howItWorksArt} alt="" className={step.artClass} />
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-ink/70">
                {step.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
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
    className="flex min-h-dvh w-full snap-start snap-always flex-col bg-surface md:h-dvh"
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
  </section>
);

const AboutJourneyItem = ({ date, location, field, src, alt }) => (
  <li className="flex items-center gap-3 py-1.5">
    <time className="w-16 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-ink/60">
      {date}
    </time>
    <span className="relative flex w-4 shrink-0 self-stretch items-center justify-center" aria-hidden="true">
      <span className="absolute inset-y-0 w-px bg-border" />
      <span className="relative z-10 h-2 w-2 rounded-full bg-ink" />
    </span>
    <figure className="flex min-w-0 items-center gap-3">
      <img src={src} alt={alt} className="h-10 w-16 shrink-0 object-contain md:h-12 md:w-20" />
      <figcaption className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink">{location}</p>
        <p className="font-display text-xs italic text-ink/70">{field}</p>
      </figcaption>
    </figure>
  </li>
);

const AboutUsSection = () => (
  <section
    id="about-us"
    className="relative flex min-h-dvh w-full snap-start snap-always flex-col bg-surface md:h-dvh md:overflow-hidden"
  >
    <div className="flex min-h-0 flex-1 flex-col px-4 pt-12 pb-3 md:px-8 md:pt-16">
      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <ol
          className="order-2 flex min-h-0 flex-col justify-between lg:order-1 lg:col-span-5"
          aria-label="Field journey"
        >
          {ABOUT_JOURNEY.map((stop) => (
            <AboutJourneyItem key={stop.field} {...stop} />
          ))}
        </ol>

        <div className="relative order-1 min-h-0 lg:order-2 lg:col-span-7">
          <SectionHeader label="Inspiration" title="About Us" align="left" compact />
          <div className="space-y-2 text-xs leading-snug text-ink/70">
            <p className="font-semibold text-ink">
              Nature inspires the best things in life, and Pebble is no different.
            </p>
            <p>
              During an expedition to Antarctica as a Grosvenor Teacher Fellow with National
              Geographic and Lindblad Expeditions, I observed a large breeding colony of Gentoo
              penguins. It was comical chaos… thievery, feuds, and frantic pebble-gifting. But
              beneath the chaos was something remarkable: penguins collecting individual pebbles and
              working together to build nests that protect the next generation.
            </p>
            <p>
              I started wondering…{' '}
              <strong className="font-semibold text-ink">what if we could do something similar?</strong>
            </p>
            <p>
              What if educators, researchers, and explorers could collect their real-world
              observations—metaphorical “pebbles”—and bring them together to create a shared
              resource for learning?
            </p>
            <p>
              A few years ago, I realized how difficult it was to find compelling, relevant,
              real-world stories for my science classroom that were connected to content standards
              and ready to use with students. I was tired of relying on decades-old examples (think
              peppered moths and the Industrial Revolution) when our world was full of new stories
              waiting to be explored. So, I started using my own.
            </p>
            <p>
              In meeting other professionals through my work and travels, I realized that I wasn&apos;t
              the only one collecting these stories. There is an incredible community of people
              observing, documenting, and protecting our changing world, but their experiences and
              discoveries are often scattered and not readily accessible to educators.
            </p>
            <p className="font-semibold text-ink">So, I decided to build the nest.</p>
            <p>
              Pebble brings these stories together in one searchable, shared space, helping
              educators discover real-world phenomena and turn them into meaningful learning
              experiences.
            </p>
            <p>
              Our pebble-collecting, nest-building enterprise will be considerably less dramatic
              than the penguins’, but no less valuable.
            </p>
            <p>Now, I invite you to add your pebble.</p>
          </div>
          <div className="pointer-events-none absolute bottom-0 right-0 hidden h-40 w-56 lg:block" aria-hidden="true">
            <span className="absolute bottom-2 right-6 h-28 w-28 rounded-full bg-sandstone/25" />
            <span className="absolute bottom-8 right-20 h-24 w-24 rounded-full bg-ocean/10" />
            <span className="absolute bottom-0 right-0 h-20 w-20 rounded-full bg-pebble/30" />
          </div>
        </div>
      </div>
    </div>
    <WelcomeFooter />
  </section>
);

const WelcomeFooter = () => (
  <footer className="w-full shrink-0 bg-ocean/10">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 md:py-6">
      <BrandMark size="sm" to={null} />
      <nav className="flex flex-wrap items-center gap-6 md:gap-10" aria-label="Footer">
        {FOOTER_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-sm font-medium uppercase tracking-wide text-ink transition hover:text-ocean"
          >
            {label}
          </a>
        ))}
      </nav>
      <p className="text-sm text-ink md:text-right">Copyright 2026 Pebble. All Rights Reserved.</p>
    </div>
  </footer>
);

/**
 * Marketing welcome for unauthenticated visitors on `/`.
 * Full-viewport sections with scroll snapping:
 * hero → audience → methodology → how it works → explore pebbles → about us.
 */
const Welcome = () => (
  <div
    data-testid="welcome-scroll"
    className="h-full min-h-0 overflow-y-auto scroll-smooth snap-y snap-mandatory bg-surface"
  >
    <WelcomeHero />
    <AudienceSection />
    <MethodologySection />
    <HowItWorksSection />
    <ExplorePebblesSection />
    <AboutUsSection />
  </div>
);

export default Welcome;
