import React from 'react';
import { FIELD_GLYPH_ID, FIELD_GLYPH_SRC, createFieldGlyphElement } from './fieldGlyphs';

export { createFieldGlyphElement };

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

const FieldGlyph = ({ name, className = 'h-4 w-4' }) => (
  <img
    src={FIELD_GLYPH_SRC[name]}
    alt=""
    data-icon={FIELD_GLYPH_ID[name]}
    className={`field-glyph object-contain ${className}`}
  />
);

/** Brand-consistent line icons for nav and field-notes toolbar. */
export const HomeIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
  </svg>
);

export const ArrowUpRightIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export const ArrowDownRightIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M7 7 17 17M9 17h8V9" />
  </svg>
);

export const MenuIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M6 6 18 18M18 6 6 18" />
  </svg>
);

export const LeafIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M5 13c0-5 4-9 11-9 0 7-4 11-11 11Z" />
    <path d="M5 13c3-1 6-4 8-8" />
  </svg>
);

export const ExpandIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </svg>
);

export const CollapseIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4" />
  </svg>
);

export const RecenterIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
  </svg>
);

export const PinIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

export const UserIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const GraduationIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="m3 10 9-5 9 5-9 5-9-5Z" />
    <path d="M7 12.5v4.5c0 1 2.5 2.5 5 2.5s5-1.5 5-2.5v-4.5" />
    <path d="M21 10v6" />
  </svg>
);

export const MicroscopeIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M9 3v6M7 3h4" />
    <path d="M9 9a4 4 0 1 0 4 4" />
    <path d="M13 13h5a3 3 0 0 1 0 6H6" />
    <path d="M9 21h6" />
  </svg>
);

export const BookOpenIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M12 6c-2-1.5-5-2-8-1.5V18c3-.5 6 .5 8 2 2-1.5 5-2.5 8-2V4.5C17 4 14 4.5 12 6Z" />
    <path d="M12 6v14" />
  </svg>
);

export const BuildingIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16" />
    <path d="M16 10h3a1 1 0 0 1 1 1v10" />
    <path d="M8 8h2M8 12h2M8 16h2M4 21h16" />
  </svg>
);

export const MapIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5 9 4.5Z" />
    <path d="M9 4.5v13M15 6.5v13" />
  </svg>
);

export const FeedIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);

export const FilterIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />
  </svg>
);

export const BellIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

export const LikeIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
  </svg>
);

export const ShareIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 13.2 7.6 4.4M15.8 6.4 8.2 10.8" />
  </svg>
);

export const PhotoIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m3 16 5-4 4 3 3-2 6 4" />
  </svg>
);

export const VideoIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-2.5v9L16 14" />
  </svg>
);

export const AudioIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M11 4v11.5a2.5 2.5 0 1 1-2-2.45V8l7-1.5v7.5a2.5 2.5 0 1 1-2-2.45V6.2L11 7" />
  </svg>
);

export const DataIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
    <path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
  </svg>
);

export const AttachmentIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="m15.5 7-7.2 7.2a2.5 2.5 0 0 0 3.5 3.5l8-8a4 4 0 0 0-5.7-5.7l-8.5 8.5a5.5 5.5 0 0 0 7.8 7.8L17 16" />
  </svg>
);

export const BiologyIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Biology" className={className} />
);

export const PhysicsIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Physics" className={className} />
);

export const ChemistryIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Chemistry" className={className} />
);

export const EarthScienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Earth Science" className={className} />
);

export const AstronomyIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Astronomy" className={className} />
);

export const MathematicsIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Mathematics" className={className} />
);

export const ComputerScienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Computer Science" className={className} />
);

export const AgriculturalScienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Agricultural Science" className={className} />
);

export const ClimateScienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Climate Science" className={className} />
);

export const EngineeringIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Engineering & Technology" className={className} />
);

export const EnvironmentalScienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Environmental Science" className={className} />
);

export const HealthMedicineIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Health & Medicine" className={className} />
);

export const MarineScienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Marine Science" className={className} />
);

export const MaterialsScienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Materials Science" className={className} />
);

export const MicrobiologyIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Microbiology" className={className} />
);

export const NeuroscienceIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Neuroscience" className={className} />
);

export const PaleontologyIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Paleontology" className={className} />
);

export const SunIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
);

export const CloudIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M7 17h10a4 4 0 0 0 .4-8 5 5 0 0 0-9.6-1.2A3.5 3.5 0 0 0 7 17Z" />
  </svg>
);

export const RainIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M7 14h10a3.5 3.5 0 0 0 .3-7 4.5 4.5 0 0 0-8.6-1A3 3 0 0 0 7 14Z" />
    <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" />
  </svg>
);

export const SnowIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M12 3v18M5 7.5l14 9M19 7.5l-14 9" />
  </svg>
);

export const WindIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 8h11a2 2 0 1 0-2-2M4 12h14a2 2 0 1 1-2 2M4 16h8" />
  </svg>
);

export const PartlyCloudyIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 4v1.2M8 10.8V12M4.5 8H5.7M10.3 8H11.5M5.4 5.4l.8.8M10 9.8l.8.8" />
    <path d="M9 17h8a3 3 0 0 0 .2-6 3.8 3.8 0 0 0-6.4-.6A2.6 2.6 0 0 0 9 17Z" />
  </svg>
);

export const ThunderIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M7 13h9a3 3 0 0 0 .2-6 4 4 0 0 0-7.4-.8A2.6 2.6 0 0 0 7 13Z" />
    <path d="M13 13.5 10.5 18h3L11 21" />
  </svg>
);

export const SleetIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M7 13h10a3 3 0 0 0 .2-6 4 4 0 0 0-7.6-.8A2.6 2.6 0 0 0 7 13Z" />
    <path d="M9 16.5 8 19M13 16.5 12 19" />
    <path d="M16 16.2v.2M16.8 17.4h.2M15.2 17.4h.2M16 18.6v.2" />
  </svg>
);

export const FogIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 8h16M4 12h16M4 16h16" />
  </svg>
);

export const IceIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M12 3v18M4 8l16 8M20 8 4 16M8 5l4 4 4-4M8 19l4-4 4 4" />
  </svg>
);

export const SevereIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M12 3 4 19h16L12 3Z" />
    <path d="M12 10v4M12 16.5v.5" />
  </svg>
);

export const MoonIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M16 14.5A6.5 6.5 0 0 1 9.2 5 6.5 6.5 0 1 0 16 14.5Z" />
  </svg>
);

export const PsychologyIcon = ({ className = 'h-4 w-4' }) => (
  <FieldGlyph name="Psychology" className={className} />
);

export const ClipboardIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M9 4h6v3H9V4Z" />
    <rect x="6" y="5.5" width="12" height="15" rx="2" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

export const DesignIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 16 15 5l4 4L8 20H4v-4Z" />
    <path d="M14 6l4 4" />
    <path d="M3 11.5h13M6 11.5v2M10 11.5v2M14 11.5v2" />
  </svg>
);

export const UsersIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="8" cy="8" r="2.4" />
    <circle cx="16" cy="8.5" r="2.2" />
    <path d="M3.5 19a4.5 4.5 0 0 1 9 0M14 19a4 4 0 0 1 6.5-3" />
    <path d="M18 3.5h3.5V7" />
    <path d="M21.5 3.5 18 7" />
  </svg>
);

export const PeopleIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="9" cy="8" r="2.8" />
    <circle cx="16" cy="8.5" r="2.4" />
    <path d="M4 20a5 5 0 0 1 10 0" />
    <path d="M13.5 20a4.5 4.5 0 0 1 7-3.2" />
  </svg>
);

export const EyeIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export const EyeOffIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M3 5.5 21 19.5" />
    <path d="M9.5 8.2A6 6 0 0 1 12 7.5c6 0 9.5 4.5 9.5 4.5a13 13 0 0 1-3.2 3.2" />
    <path d="M6.6 10.2A13 13 0 0 0 2.5 12S6 18.5 12 18.5a8 8 0 0 0 3.3-.7" />
    <path d="M10.2 13.8a2.5 2.5 0 0 0 3.6-3.4" />
  </svg>
);

/** Filled cartoon penguin. Body, belly, and beak use black, white, and sandstone. */
const PENGUIN_SHAPES = [
  ['ellipse', { cx: '12', cy: '13.2', rx: '7.2', ry: '8.2', fill: '#000000' }],
  ['ellipse', { cx: '12', cy: '15.6', rx: '4.1', ry: '4.4', fill: '#FFFFFF' }],
  ['circle', { cx: '9.5', cy: '10.1', r: '1.15', fill: '#FFFFFF' }],
  ['circle', { cx: '14.5', cy: '10.1', r: '1.15', fill: '#FFFFFF' }],
  ['circle', { cx: '9.8', cy: '10.3', r: '0.42', fill: '#000000' }],
  ['circle', { cx: '14.8', cy: '10.3', r: '0.42', fill: '#000000' }],
  ['path', { d: 'M10.5 12.3h3L12 14.2Z', fill: '#D6B37A' }],
  ['ellipse', { cx: '8.3', cy: '21.1', rx: '2', ry: '0.85', fill: '#D6B37A' }],
  ['ellipse', { cx: '15.7', cy: '21.1', rx: '2', ry: '0.85', fill: '#D6B37A' }],
];

export const PenguinIcon = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" className={className} data-icon="penguin" aria-hidden="true">
    {PENGUIN_SHAPES.map(([tag, attrs]) => {
      const Tag = tag;
      return <Tag key={`${tag}-${attrs.cx || ''}-${attrs.cy || ''}-${attrs.d || ''}`} {...attrs} />;
    })}
  </svg>
);

export function createPenguinAvatarElement() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('data-icon', 'penguin');
  svg.setAttribute('aria-hidden', 'true');
  PENGUIN_SHAPES.forEach(([tag, attrs]) => {
    const shape = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([name, value]) => shape.setAttribute(name, value));
    svg.append(shape);
  });
  return svg;
}

const sketchProps = {
  ...baseProps,
  viewBox: '0 0 48 48',
  strokeWidth: 1.6,
};

/** Line icons from the How it Works comparison slide. */
export const SketchBookIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-book">
    <path d="M16 10h18a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H16" />
    <path d="M16 10a4 4 0 0 0-4 4v20a4 4 0 0 0 4 4" />
    <path d="M16 10v28" />
    <path d="M20 18h10M20 24h10M20 30h7" />
  </svg>
);

export const SketchGlobeIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-globe">
    <circle cx="24" cy="24" r="14" />
    <ellipse cx="24" cy="24" rx="6.5" ry="14" />
    <path d="M10 24h28M12.5 17.5h23M12.5 30.5h23" />
  </svg>
);

export const SketchClipboardIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-clipboard">
    <rect x="14" y="10" width="20" height="28" rx="2" />
    <path d="M20 8h8a1 1 0 0 1 1 1v3H19V9a1 1 0 0 1 1-1Z" />
    <path d="m18 20 2 2 3.5-3.5M18 28l2 2 3.5-3.5" />
    <path d="M26 21h6M26 29h6" />
  </svg>
);

export const SketchClockIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-clock">
    <circle cx="24" cy="24" r="14" />
    <path d="M24 16v9l6 4" />
  </svg>
);

export const SketchMicroscopeIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-microscope">
    <path d="M18 8h6l2 6h-10l2-6Z" />
    <path d="M21 14v6" />
    <circle cx="21" cy="23" r="4" />
    <path d="M25 22h8" />
    <path d="M30 18v12" />
    <path d="M14 30h18" />
    <path d="M16 30v3h14" />
    <path d="M12 38h22" />
    <path d="M18 38v-5" />
  </svg>
);

export const SketchToolsIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-tools">
    <path d="M16 10h4l1 22-3 6-3-6 1-22Z" />
    <path d="M16 14h4" />
    <path d="M14 34 34 14" />
    <path d="M30 12h6v4" />
    <path d="M32 16v16" />
    <path d="M29 20h6M29 25h6M29 30h6" />
  </svg>
);

export const SketchDiscussionIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-discussion">
    <circle cx="17" cy="22" r="4" />
    <circle cx="31" cy="22" r="4" />
    <path d="M11 34c.8-4.5 3-7 6-7s5.2 2.5 6 7" />
    <path d="M25 34c.8-4.5 3-7 6-7s5.2 2.5 6 7" />
    <path d="M8 12h9v5H11l-3 2v-7Z" />
    <path d="M31 10h9v5h-6l-3 2v-7Z" />
  </svg>
);

export const SketchChartIcon = ({ className = 'h-10 w-10' }) => (
  <svg {...sketchProps} className={className} data-icon="sketch-chart">
    <path d="M10 38h28" />
    <path d="M16 38V26M24 38V18M32 38V23" />
    <path d="M14 30l8-8 6 3 8-9" />
    <path d="M32 14h6v6" />
  </svg>
);

export const CheckIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const BoardIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <rect x="3.5" y="3.5" width="17" height="12" rx="1.5" />
    <path d="M12 15.5V20M8 20h8" />
  </svg>
);

export const ChartIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M4 20h16" />
    <path d="M7 16v-4M12 16V8M17 16v-6" />
  </svg>
);

const FIELD_ICONS = {
  'Agricultural Science': AgriculturalScienceIcon,
  Astronomy: AstronomyIcon,
  Biology: BiologyIcon,
  Chemistry: ChemistryIcon,
  'Climate Science': ClimateScienceIcon,
  'Computer Science': ComputerScienceIcon,
  'Earth Science': EarthScienceIcon,
  'Engineering & Technology': EngineeringIcon,
  'Environmental Science': EnvironmentalScienceIcon,
  'Health & Medicine': HealthMedicineIcon,
  'Marine Science': MarineScienceIcon,
  'Materials Science': MaterialsScienceIcon,
  Mathematics: MathematicsIcon,
  Microbiology: MicrobiologyIcon,
  Neuroscience: NeuroscienceIcon,
  Paleontology: PaleontologyIcon,
  Physics: PhysicsIcon,
  Psychology: PsychologyIcon,
};

export const fieldIconForName = (name) => FIELD_ICONS[name] || DataIcon;

/** Toolbar label: Icon | Name */
export const IconLabel = ({ icon: Icon, label, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <Icon className="h-3.5 w-3.5 shrink-0" />
    <span className="text-muted" aria-hidden="true">
      |
    </span>
    <span>{label}</span>
  </span>
);
