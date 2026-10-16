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
  "Products.detail.metaTitle", // solo placeholders
  "Markets.list.volumeValue", // placeholder + unidad (t)
  "Markets.map.legend.range", // solo placeholders
  "Producers.calculator.kgValue", // placeholder + unidad (kg)
  "Privacy.sections.cookies.title", // préstamo aceptado en español
  "Sustainability.withUnit", // placeholder + unidad (símbolos neutros)
  "Contact.quote.company.email", // "Email" en los dos idiomas
  "Contact.quote.order.incoterm", // término de comercio internacional
  "Contact.location.plantPlace", // topónimo
];

/** Valores de contenido (seed y company.ts) que pueden repetirse entre idiomas. */
export const allowedValues: string[] = [
  "Halal", "Kosher", "HACCP", "BRCGS",
  "China", "Israel", // topónimos iguales en ES y EN
];
