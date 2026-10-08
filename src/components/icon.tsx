import type { ReactNode, SVGProps } from "react";

/** Line icons from the prototype's sprite (24×24, stroked). */
const icons = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.1 7.5 9.5 4.3-1.4 7.5-4.9 7.5-9.5V6z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </>
  ),
  bolt: <path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z" />,
  fork: (
    <path d="M6.5 3v7a2.5 2.5 0 0 0 2.5 2.5V21M4.5 3v5.5M8.5 3v5.5M16.5 21V3c2.6 1.1 3.6 4.2 3.6 7.2 0 2.6-1.6 3.8-3.6 3.8" />
  ),
  glass: <path d="M5 3h14l-2 7.5a5 5 0 0 1-10 0zM12 15.5V21M8 21h8M6 6.5h12" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  euro: <path d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20.5 20.5-4.8-4.8" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 19h2M20.5 14v2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="3" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 7.5V6h18v1.5a2.5 2.5 0 0 0 0 5V14a2.5 2.5 0 0 0 0 5V18H3v-.5a2.5 2.5 0 0 0 0-5v-.5a2.5 2.5 0 0 0 0-5z" />
      <path d="M14.5 6v12" strokeDasharray="1.6 2.2" />
    </>
  ),
  museum: <path d="M3 9.5 12 4l9 5.5M5 9.5V18M9.7 9.5V18M14.3 9.5V18M19 9.5V18M3 20.5h18" />,
  wave: (
    <>
      <path d="M2 16c2.2 0 2.2-1.8 4.4-1.8S8.6 16 10.8 16 13 14.2 15.2 14.2 17.4 16 19.6 16 21.8 14.2 22 14.2M2 20c2.2 0 2.2-1.8 4.4-1.8S8.6 20 10.8 20s2.2-1.8 4.4-1.8S17.4 20 19.6 20" />
      <circle cx="16" cy="7" r="3.2" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="3.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s-7-6.2-7-11.7a7 7 0 0 1 14 0c0 5.5-7 11.7-7 11.7z" />
      <circle cx="12" cy="9.8" r="2.6" />
    </>
  ),
  cal: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.4" />
    </>
  ),
  star: <path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" />,
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="M2.5 9.5h19M6.5 15h4" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7.5V6a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20H19a2 2 0 0 0 2-2V9.5a2 2 0 0 0-2-2H5.5" />
      <circle cx="16.5" cy="14" r="1.3" />
    </>
  ),
  store: (
    <path d="M4 9.5 5.6 4h12.8L20 9.5M4.5 9.5V20h15V9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c1.2-3.7 4-5.6 7.5-5.6s6.3 1.9 7.5 5.6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="3" />
      <path d="m4 7.5 8 6 8-6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4" />
      <path d="m11 12.5 8.5-8.5M16.5 7l2.5 2.5M14 9.5l2 2" />
    </>
  ),
  home: <path d="M4 11 12 4l8 7M6 9.5V20h4.5v-5.5h3V20H18V9.5" />,
  logout: <path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M10 16.5 5.5 12 10 7.5M5.5 12h10" />,
  back: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  chev: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  next: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.4" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="16.5" cy="9.8" r="2.6" />
      <path d="M3.5 19c.9-3.1 3-4.7 5.5-4.7s4.6 1.6 5.5 4.7M15 14.6c2.6-.3 4.5 1.2 5.5 4.4" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.3" />
      <circle cx="18" cy="6" r="2.3" />
      <path d="M8.3 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.7" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M10 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.4 7.4A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 4.7-1.3" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" />
    </>
  ),
  sparkle: <path d="M12 3.5c.8 4.4 2.1 5.7 6.5 6.5-4.4.8-5.7 2.1-6.5 6.5-.8-4.4-2.1-5.7-6.5-6.5 4.4-.8 5.7-2.1 6.5-6.5zM18.5 15.5c.3 1.8.9 2.4 2.5 2.7-1.6.3-2.2.9-2.5 2.7-.3-1.8-.9-2.4-2.5-2.7 1.6-.3 2.2-.9 2.5-2.7z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5s1.2-6.2 3.6-8.5z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof icons;

/** Decorative line icon. Stroke colour follows currentColor. */
export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {icons[name]}
    </svg>
  );
}
