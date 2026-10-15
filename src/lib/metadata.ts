import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type StaticPathname } from "@/i18n/routing";

/** Metadata de una página estática: título, descripción, canonical y hreflang (con x-default). */
export function staticPageMetadata(locale: Locale, href: StaticPathname, title: string, description: string): Metadata {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, getPathname({ locale: l, href })]));
  return {
    title,
    description,
    alternates: { canonical: languages[locale], languages: { ...languages, "x-default": languages[routing.defaultLocale] } },
  };
}
