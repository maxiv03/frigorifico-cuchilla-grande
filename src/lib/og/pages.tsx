import "server-only";
import { getTranslations } from "next-intl/server";
import { company } from "@/data/company";
import { routing, type Locale } from "@/i18n/routing";
import { formatFigure } from "@/lib/format";
import { renderGeneral } from "./render";

/** Páginas con la plantilla general: namespace de mensajes con eyebrow, title y metaDescription. */
export type GeneralOgPage =
  | "home"
  | "products"
  | "markets"
  | "quality"
  | "company"
  | "producers"
  | "contact"
  | "news"
  | "sustainability"
  | "careers"
  | "privacy";

const NAMESPACE = {
  products: "Products",
  markets: "Markets",
  quality: "Quality",
  company: "Company",
  producers: "Producers",
  contact: "Contact",
  news: "News",
  sustainability: "Sustainability",
  careers: "Careers",
  privacy: "Privacy",
} as const;

export const ogLocale = (params: Promise<{ locale: string }>) =>
  params.then(({ locale }) => ((routing.locales as readonly string[]).includes(locale) ? (locale as Locale) : routing.defaultLocale));

export async function ogBrand(locale: Locale) {
  const tf = await getTranslations({ locale, namespace: "Footer" });
  return { kicker: company.brand.kicker, brand: company.brand.name, disclaimer: tf("disclaimer") };
}

/** Valores de los placeholders de los títulos (mismas cifras que las páginas). */
const values = (locale: Locale) => ({
  countries: formatFigure(company.figures.countries, locale),
  founded: String(company.founded),
  city: company.address.city,
  department: company.address.department,
  cattle: formatFigure(company.figures.cattlePerDay, locale),
  sheep: formatFigure(company.figures.sheepPerDay, locale),
});

export async function generalOgImage(locale: Locale, page: GeneralOgPage) {
  const brand = await ogBrand(locale);
  if (page === "home") {
    const t = await getTranslations({ locale, namespace: "Home.hero" });
    const meta = await getTranslations({ locale, namespace: "Meta" });
    return renderGeneral({ brand, eyebrow: t("eyebrow", values(locale)), title: t("title"), description: meta("description") });
  }
  const t = await getTranslations({ locale, namespace: NAMESPACE[page] });
  const v = values(locale);
  // Los namespaces tienen claves distintas: se lee cada una con los mismos valores.
  const read = (key: "eyebrow" | "title" | "metaDescription") => (t as unknown as (k: string, v: object) => string)(key, v);
  return renderGeneral({ brand, eyebrow: read("eyebrow"), title: read("title"), description: read("metaDescription") });
}

/** Texto alternativo de la imagen OG general (mismo para todas las páginas). */
export const OG_ALT = "Frigorífico Cuchilla Grande";
