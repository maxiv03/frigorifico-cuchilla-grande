import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  // Rutas internas en inglés; cada locale define su ruta pública.
  // Un idioma nuevo solo agrega su columna acá (y sus mensajes/traducciones).
  pathnames: {
    "/": "/",
    "/products": { es: "/productos", en: "/products" },
    "/products/[species]/[cut]": {
      es: "/productos/[species]/[cut]",
      en: "/products/[species]/[cut]",
    },
    "/markets": { es: "/mercados", en: "/markets" },
    "/quality": { es: "/calidad", en: "/quality" },
    "/company": { es: "/empresa", en: "/company" },
    "/producers": { es: "/productores", en: "/producers" },
    "/sustainability": { es: "/sostenibilidad", en: "/sustainability" },
    "/news": { es: "/noticias", en: "/news" },
    "/news/[slug]": { es: "/noticias/[slug]", en: "/news/[slug]" },
    "/careers": { es: "/trabaja-con-nosotros", en: "/careers" },
    "/contact": { es: "/contacto", en: "/contact" },
    "/privacy": { es: "/privacidad", en: "/privacy" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
/** Rutas sin parámetros dinámicos (navegación, CTAs). */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}`>;
