// Icon subset from the Lore Icon System v2: 24×24 grid, 1.75 stroke,
// currentColor, two-tone opacity. Only the icons the prototype needs.

import type { SVGProps } from "react";

export type IconName =
  | "mic"
  | "quiz"
  | "whiteboard"
  | "upload"
  | "download"
  | "close"
  | "back"
  | "warning"
  | "error"
  | "info"
  | "play"
  | "pause"
  | "plus"
  | "trash"
  | "doc"
  | "image"
  | "sparkle"
  | "chevron"
  | "wifi-off";

const paths: Record<IconName, React.ReactNode> = {
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 12Q6 18.5 12 18.5Q18 18.5 18 12" />
      <line x1="12" y1="18.5" x2="12" y2="21.5" />
    </>
  ),
  quiz: (
    <>
      <path d="M7.5 8.5A4.5 4.5 0 1 1 12 13.5L12 15.5" />
      <circle cx="12" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  whiteboard: (
    <>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M7 10.5Q9 8.5 11 10.5Q13 12.5 15 10.5" />
      <line x1="9" y1="20.5" x2="15" y2="20.5" />
      <line x1="12" y1="17" x2="12" y2="20.5" />
    </>
  ),
  upload: (
    <>
      <path d="M4 17L4 19Q4 21 6 21L18 21Q20 21 20 19L20 17" />
      <line x1="12" y1="3.5" x2="12" y2="15" />
      <polyline points="8,7.5 12,3.5 16,7.5" />
    </>
  ),
  download: (
    <>
      <path d="M4 17L4 19Q4 21 6 21L18 21Q20 21 20 19L20 17" />
      <line x1="12" y1="3.5" x2="12" y2="15" />
      <polyline points="8,11 12,15 16,11" />
    </>
  ),
  close: (
    <>
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
    </>
  ),
  back: (
    <>
      <path d="M10 19L3 12L10 5" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3L21.5 20.5L2.5 20.5Z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="8.75" y1="8.75" x2="15.25" y2="15.25" />
      <line x1="15.25" y1="8.75" x2="8.75" y2="15.25" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <line x1="12" y1="11.5" x2="12" y2="17" />
    </>
  ),
  play: <path d="M7.5 5L19 12L7.5 19Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="5.5" y="4.5" width="4.5" height="15" rx="2" />
      <rect x="14" y="4.5" width="4.5" height="15" rx="2" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  trash: (
    <>
      <line x1="3.5" y1="6" x2="20.5" y2="6" />
      <path d="M9.5 6L9.5 4Q9.5 3 10.5 3L13.5 3Q14.5 3 14.5 4L14.5 6" />
      <path d="M5.5 6L6.5 20Q6.5 21 7.5 21L16.5 21Q17.5 21 17.5 20L18.5 6" />
    </>
  ),
  doc: (
    <>
      <path d="M6 21L6 4Q6 3 7 3L14.5 3L18 6.5L18 21Q18 22 17 22L7 22Q6 22 6 21Z" />
      <path d="M14.5 3L14.5 6.5L18 6.5" opacity=".45" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" opacity=".45" />
      <line x1="8.5" y1="15.5" x2="15.5" y2="15.5" opacity=".45" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.8" />
      <path d="M4 17L9 12.5L13 16L16.5 13L20 16.5" opacity=".7" />
    </>
  ),
  sparkle: (
    <path
      d="M12 3L13.6 9.2L20 11L13.6 12.8L12 19L10.4 12.8L4 11L10.4 9.2Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  chevron: <path d="M5.5 9L12 15.5L18.5 9" />,
  "wifi-off": (
    <>
      <path d="M2 8.5Q7 4.5 12 4.5" opacity=".45" />
      <path d="M5 12Q8 9.5 11 9.7" />
      <path d="M8.5 15.5Q10.5 14 12.5 14.7" />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
