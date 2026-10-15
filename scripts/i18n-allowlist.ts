/**
 * Excepciones del i18n:check: textos que legítimamente son iguales en todos los idiomas.
 * Agregar con criterio (nombres propios, siglas, marcas de normas).
 */

/** Claves de mensajes (ruta con puntos) cuyo valor puede repetirse entre idiomas. */
export const allowedMessageKeys: string[] = [
  "Meta.siteName",
  "Home.hero.eyebrow", // solo topónimos
  "LocaleSwitcher.es", // endónimos: cada idioma se nombra en su propia lengua
  "LocaleSwitcher.en",
];

/** Valores de contenido (seed y company.ts) que pueden repetirse entre idiomas. */
export const allowedValues: string[] = ["Halal", "Kosher", "HACCP", "BRCGS"];
