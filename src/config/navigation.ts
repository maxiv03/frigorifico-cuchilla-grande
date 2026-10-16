import type { StaticPathname } from "@/i18n/routing";

/**
 * Navegación del sitio: menú principal y barra superior (los dos se repiten en el footer y en el
 * menú móvil). Las etiquetas salen de `Nav.<key>` en los mensajes.
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
  /** Estilo diferenciado (el otro público: productores). */
  highlight?: boolean;
};

export const mainNav: NavItem[] = [
  { key: "products", href: "/products" },
  { key: "markets", href: "/markets" },
  { key: "quality", href: "/quality" },
  { key: "company", href: "/company" },
  { key: "producers", href: "/producers", highlight: true },
  { key: "contact", href: "/contact" },
];

export const utilityNav: NavItem[] = [
  { key: "news", href: "/news" },
  { key: "sustainability", href: "/sustainability" },
  { key: "careers", href: "/careers" },
];
