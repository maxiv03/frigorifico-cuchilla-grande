import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { company } from "@/data/company";
import { routing, type Locale, type StaticPathname } from "@/i18n/routing";

/** Locale de Open Graph por idioma (inglés británico en todo el sitio). */
const OG_LOCALE: Record<Locale, string> = { es: "es_UY", en: "en_GB" };

type PageMeta = {
  locale: Locale;
  /** Ruta de la página en cada idioma (con slugs traducidos). */
  hrefs: Record<Locale, string>;
  /** Con `absolute`, sin la plantilla del layout (home). */
  title: string | { absolute: string };
  description: string;
  type?: "website" | "article";
  publishedTime?: string;
};

/**
 * Metadata completa de una página: título (la plantilla del layout agrega el nombre del sitio),
 * descripción, canonical, hreflang (es, en, x-default), Open Graph y Twitter card.
 * Las imágenes OG/Twitter salen de los archivos opengraph-image / twitter-image de cada ruta.
 */
export function pageMetadata({ locale, hrefs, title: pageTitle, description, type = "website", publishedTime }: PageMeta): Metadata {
  const title = typeof pageTitle === "string" ? pageTitle : pageTitle.absolute;
  return {
    title: pageTitle,
    description,
    alternates: { canonical: hrefs[locale], languages: { ...hrefs, "x-default": hrefs[routing.defaultLocale] } },
    openGraph: {
      type,
      siteName: company.name,
      url: hrefs[locale],
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Rutas de una página estática en cada idioma. */
export function staticHrefs(href: StaticPathname) {
  return Object.fromEntries(routing.locales.map((l) => [l, getPathname({ locale: l, href })])) as Record<Locale, string>;
}

/** Metadata de una página estática. */
export function staticPageMetadata(locale: Locale, href: StaticPathname, title: string, description: string): Metadata {
  return pageMetadata({ locale, hrefs: staticHrefs(href), title, description });
}
