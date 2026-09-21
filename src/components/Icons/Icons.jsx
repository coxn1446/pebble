import React from 'react';

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

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

export const LeafIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M5 13c0-5 4-9 11-9 0 7-4 11-11 11Z" />
    <path d="M5 13c3-1 6-4 8-8" />
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
  <svg {...baseProps} className={className}>
    <path d="M12 3v18M7 8c3 2 7 2 10 0M7 16c3-2 7-2 10 0" />
    <ellipse cx="12" cy="12" rx="4" ry="8" />
  </svg>
);

export const PhysicsIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="12" cy="12" r="2" />
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" />
  </svg>
);

export const ChemistryIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3" />
  </svg>
);

export const EarthScienceIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

export const AstronomyIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="m12 3 1.8 4.8L19 9.5l-4 3.2L16.2 18 12 15.4 7.8 18l1.2-5.3-4-3.2 5.2-1.7L12 3Z" />
  </svg>
);

export const MathematicsIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M5 8h6M8 5v6M14 7l5 5M19 7l-5 5M5 16h6M14 16h5" />
  </svg>
);

export const ComputerScienceIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <rect x="3" y="5" width="18" height="12" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const PsychologyIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...baseProps} className={className}>
    <path d="M12 3a6 6 0 0 0-4 10.5V21h3v-3h2v3h3v-7.5A6 6 0 0 0 12 3Z" />
    <circle cx="10" cy="10" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="14" cy="10" r="0.8" fill="currentColor" stroke="none" />
  </svg>
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
  Biology: BiologyIcon,
  Physics: PhysicsIcon,
  Chemistry: ChemistryIcon,
  'Earth Science': EarthScienceIcon,
  Astronomy: AstronomyIcon,
  Mathematics: MathematicsIcon,
  'Computer Science': ComputerScienceIcon,
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
