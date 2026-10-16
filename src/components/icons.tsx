import type { SVGProps } from "react";

/** Íconos de trazo propios (24×24, currentColor). Decorativos por defecto. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);
export const IconMapPin = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Icon>
);
export const IconMail = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="M4 7l8 6 8-6" />
  </Icon>
);
export const IconPhone = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
  </Icon>
);
export const IconWhatsApp = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z" />
    <path d="M9 8.8c0 3 2.3 5.6 5.4 6.2l1.1-1.4-1.8-.9-.8.8a4.5 4.5 0 0 1-2.6-2.6l.8-.8-.9-1.8z" />
  </Icon>
);
export const IconTrendUp = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 16l6-6 4 4 6-6M15 8h5v5" />
  </Icon>
);
export const IconTrendDown = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 8l6 6 4-4 6 6M15 16h5v-5" />
  </Icon>
);
export const IconMinus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);
export const IconGlobe = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" />
  </Icon>
);

// ─── Institucionales (calidad, empresa) ─────────────────────────────────────
export const IconEarTag = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M9 3.5h6l2.5 5-5.5 12-5.5-12z" />
    <circle cx="12" cy="7.5" r="1.3" />
    <path d="M10 12.5h4M10.7 15h2.6" />
  </Icon>
);
export const IconDatabase = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </Icon>
);
export const IconTruck = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" />
    <circle cx="6.5" cy="17" r="1.8" />
    <circle cx="17" cy="17" r="1.8" />
  </Icon>
);
export const IconFactory = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 20.5V10l5 3V10l5 3V6.5h3V4h3v16.5zM3 20.5h18" />
    <path d="M7 17h2M12 17h2" />
  </Icon>
);
export const IconCuts = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 10c0-3.3 3.4-6 8-6s8 2.7 8 6-3.6 7-8 7-8-3.7-8-7z" />
    <path d="M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5zM12 17v3.5" />
  </Icon>
);
export const IconBox = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4zM3.5 7.5L12 11.5l8.5-4M12 11.5v9" />
  </Icon>
);
export const IconBarcode = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 5.5v13M7 5.5v13M10.5 5.5v13M13 5.5v13M16.5 5.5v13M20 5.5v13" />
  </Icon>
);
export const IconSnowflake = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />
  </Icon>
);
export const IconShip = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 15.5h18l-2.5 4h-13zM6 15.5v-5h12v5M9 10.5V7h6v3.5" />
  </Icon>
);
export const IconWater = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3.5s-6 6.6-6 10.5a6 6 0 0 0 12 0c0-3.9-6-10.5-6-10.5z" />
  </Icon>
);
export const IconHand = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5c0 4-2.7 7-6.5 7-2.6 0-4.2-1.4-5.6-3.6L3.5 13.5a1.5 1.5 0 0 1 2.4-1.7L8 14" />
  </Icon>
);
export const IconShieldCheck = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.1-7.5 9.5-4.4-1.4-7.5-5.1-7.5-9.5V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </Icon>
);
export const IconClipboard = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M8.5 4.5h-2a1.5 1.5 0 0 0-1.5 1.5v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-2" />
    <path d="M9 3h6v3H9zM8.5 11.5l2 2 4-4M8.5 17h7" />
  </Icon>
);
export const IconStethoscope = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 3.5v5a4 4 0 0 0 8 0v-5M10 12.5V15a4.5 4.5 0 0 0 9 0v-2" />
    <circle cx="19" cy="11" r="2" />
  </Icon>
);
export const IconFlask = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M9.5 3.5h5M10.5 3.5v5.5L5 18.5a1.5 1.5 0 0 0 1.3 2.2h11.4a1.5 1.5 0 0 0 1.3-2.2L13.5 9V3.5" />
    <path d="M7.5 14.5h9" />
  </Icon>
);
export const IconThermometer = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" />
    <path d="M12 9v7" />
  </Icon>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1zM4 10h16M8 3.5v4M16 3.5v4" />
  </Icon>
);
export const IconDocument = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3.5V8h4.5M8.5 12.5h7M8.5 16h5" />
  </Icon>
);
export const IconHandshake = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M2.5 8.5 6 6l4 1.5M21.5 8.5 18 6l-5.5 2-3 2.5a1.4 1.4 0 0 0 2 2l2-1.5 4.5 4" />
    <path d="M2.5 14.5 6 17l2.5 2a1.3 1.3 0 0 0 1.9-1.7M10.4 17.3l1.3 1.2a1.3 1.3 0 0 0 1.9-1.7M13.6 16.8l.7.6a1.3 1.3 0 0 0 1.8-1.8L18 17l3.5-2.5" />
  </Icon>
);
export const IconUserCheck = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="9.5" cy="8" r="3.5" />
    <path d="M3 20c.6-3.5 3.2-5.5 6.5-5.5 1.4 0 2.6.3 3.6 1M15 18l2 2 4-4.5" />
  </Icon>
);
export const IconCalculator = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M7 3h10a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 17 21H7a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 7 3z" />
    <path d="M8.5 6.5h7v3h-7zM8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01" />
  </Icon>
);
export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3.5 21.5 20h-19z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </Icon>
);
