import type { Locale } from "@/i18n/routing";
import { SPECIES, type Species } from "./types";

/** Segmento de URL de la especie en el detalle de corte: /es/productos/vacuno/… ↔ /en/products/beef/… */
export const speciesSlugs: Record<Species, Record<Locale, string>> = {
  beef: { es: "vacuno", en: "beef" },
  lamb: { es: "ovino", en: "lamb" },
};

export function speciesFromSlug(locale: Locale, slug: string): Species | null {
  return SPECIES.find((s) => speciesSlugs[s][locale] === slug) ?? null;
}
