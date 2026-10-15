import type { Locale } from "@/i18n/routing";

/**
 * Cifras destacadas (hero, banda de cifras): separador de miles SIEMPRE
 * ("1.800" en ES, "1,800" en EN). En texto corrido se usa el formato por defecto
 * del idioma (en español la RAE omite el separador en números de cuatro cifras).
 */
export function formatFigure(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { useGrouping: "always" }).format(value);
}

/** Precio en US$/kg con dos decimales según el idioma. */
export function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** Variación porcentual con signo explícito ("+1,14 %" / "+1.14%"). */
export function formatChange(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    signDisplay: "exceptZero",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
