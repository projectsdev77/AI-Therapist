// Deep lagoon icons: paths lifted from docs/design-handoff/from-designer-v2/Haven App v2.dc.html
// (24px viewBox stroke icons, round caps). Stroke widths follow the design per icon.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, strokeWidth = 1.7, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

const MIC = "M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5";
export const HEART = "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z";

export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 9h14M5 15h14" />
  </Svg>
);
export const HelpIcon = (p: IconProps) => (
  <Svg strokeWidth={1.9} {...p}>
    <path d={HEART} />
  </Svg>
);
export const MicIcon = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d={MIC} />
  </Svg>
);
export const MicOffIcon = (p: IconProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d={`${MIC}M4 4l16 16`} />
  </Svg>
);
export const WriteIcon = (p: IconProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
  </Svg>
);
export const BreatheIcon = (p: IconProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
  </Svg>
);
export const StyleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
  </Svg>
);
export const TranscriptIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 7h12M6 12h12M6 17h7" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const EndIcon = CloseIcon;
export const SendIcon = (p: IconProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const ChevronIcon = (p: IconProps) => (
  <Svg strokeWidth={1.5} {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Svg strokeWidth={1.5} {...p}>
    <path d="M5 9l7 7 7-7" />
  </Svg>
);
export const PhoneIcon = (p: IconProps) => (
  <Svg strokeWidth={1.9} {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Svg>
);
export const DownloadIcon = (p: IconProps) => (
  <Svg strokeWidth={1.9} {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg strokeWidth={1.9} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </Svg>
);
export const PauseIcon = ({ size = 26, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <rect x="7" y="6" width="3.5" height="12" rx="1.2" />
    <rect x="13.5" y="6" width="3.5" height="12" rx="1.2" />
  </svg>
);
export const MailIcon = (p: IconProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
);
export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
  </Svg>
);
export const FaceIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M9 10h.01M15 10h.01M9 14.5c1.6 1.4 4.4 1.4 6 0" />
  </Svg>
);
export const SparkIcon = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M12 3v4M12 17v4M5 12H3M21 12h-2M7 7l-1.5-1.5M18.5 18.5 17 17M7 17l-1.5 1.5M18.5 5.5 17 7" />
  </Svg>
);
export const SkiesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 16h16M7 12a5 5 0 0 1 10 0" />
  </Svg>
);
export const PatternsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 7l5 4 4-3 5 6M5 7h.01M10 11h.01M14 8h.01M19 14h.01" />
  </Svg>
);
export const MemoryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 4h12v16l-6-4-6 4z" />
  </Svg>
);
export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 3v3M12 18v3M3 12h3M18 12h3" />
  </Svg>
);
export const SignInIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4" />
  </Svg>
);
export const TalkNavIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
  </Svg>
);
