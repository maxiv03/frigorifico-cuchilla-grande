import type { StaticPathname } from "@/i18n/routing";

/**
 * Navegación del sitio. Cada ítem tiene un flag `enabled`: SOLO se muestran las
 * secciones que ya existen (nunca un link a una página 404 en producción).
 * Al terminar cada fase, se activa su ítem acá.
 *
 * NAV_PREVIEW=1 muestra todos los ítems para revisar el diseño en local. Se ignora
 * siempre en producción (VERCEL_ENV=production).
 */
export type NavKey =
  | "products"
  | "markets"
  | "quality"
  | "company"
  | "producers"
  | "contact"
  | "news"
  | "sustainability"
  | "careers";

export type NavItem = {
  key: NavKey;
  href: StaticPathname;
  enabled: boolean;
  /** Estilo diferenciado (el otro público: productores). */
  highlight?: boolean;
};

export const mainNav: NavItem[] = [
  { key: "products", href: "/products", enabled: false }, // fase 2
  { key: "markets", href: "/markets", enabled: false }, // fase 3
  { key: "quality", href: "/quality", enabled: false }, // fase 3
  { key: "company", href: "/company", enabled: false }, // fase 3
  { key: "producers", href: "/producers", enabled: false, highlight: true }, // fase 4
  { key: "contact", href: "/contact", enabled: false }, // fase 5
];

export const utilityNav: NavItem[] = [
  { key: "news", href: "/news", enabled: false }, // fase 5
  { key: "sustainability", href: "/sustainability", enabled: false }, // fase 5
  { key: "careers", href: "/careers", enabled: false }, // fase 5
];

function previewAll() {
  return process.env.NAV_PREVIEW === "1" && process.env.VERCEL_ENV !== "production";
}

export function visible(items: NavItem[]): NavItem[] {
  const all = previewAll();
  return items.filter((i) => i.enabled || all);
}

/** ¿La sección existe? Para decidir el destino de CTAs (página real o ancla de la home). */
export function isEnabled(key: NavKey): boolean {
  return [...mainNav, ...utilityNav].some((i) => i.key === key && i.enabled);
}
