import type { Locale } from "@/i18n/routing";

/**
 * Toda cifra del sitio (destacada o en texto corrido) pasa por acá: separador de miles
 * SIEMPRE ("1.150" en ES, "1,150" en EN). No usar `{n, number}` de ICU en los mensajes:
 * en español omite el separador en números de cuatro cifras.
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

/** Participación entera ("38 %" / "38%"), con el formato de porcentaje de cada idioma. */
export function formatShare(pct: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(pct / 100);
}

/** Monto en dólares, sin decimales, con separador de miles siempre ("US$ 12.345" / "US$ 12,345"). */
export function formatUsd(value: number, locale: Locale) {
  return `US$ ${formatFigure(Math.round(value), locale)}`;
}

/** Número con decimales fijos según el idioma ("53,0" / "53.0"). */
export function formatDecimal(value: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(locale, {
    useGrouping: "always",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Locale de Intl para fechas: el inglés del sitio es británico ("12 October 2026", no
 * "October 12, 2026"). Toda fecha visible pasa por formatDate; no usar `{date, date}` de ICU ni
 * format.dateTime de next-intl (formatean con "en" a la estadounidense).
 */
const DATE_LOCALE: Record<Locale, string> = { es: "es-UY", en: "en-GB" };

/** Fecha (YYYY-MM-DD o Date) en el día exacto, sin corrimientos de zona horaria. */
export function formatDate(date: string | Date, locale: Locale, options: Intl.DateTimeFormatOptions = { dateStyle: "long" }) {
  const d = typeof date === "string" ? new Date(`${date.slice(0, 10)}T12:00:00Z`) : date;
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { timeZone: "UTC", ...options }).format(d);
}
