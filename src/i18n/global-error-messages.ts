import type { Locale } from "./routing";

/**
 * Textos de global-error (reemplaza el layout raíz y no tiene next-intl). Van aparte de
 * messages/*.json para no mandar todos los mensajes al cliente en cada página. i18n:check los
 * valida igual que el contenido (todos los idiomas, sin vacíos ni copias).
 */
type Field = Record<Locale, string>;

/** Nombre propio (igual que company.name; no se importa company.ts para no sumarlo al cliente). */
export const GLOBAL_ERROR_BRAND = "Frigorífico Cuchilla Grande";
export const globalErrorMessages: Record<"title" | "text" | "retry" | "home", Field> = {
  title: { es: "Algo salió mal", en: "Something went wrong" },
  text: { es: "El sitio no pudo cargarse. Probá de nuevo en unos segundos.", en: "The site could not load. Please try again in a few seconds." },
  retry: { es: "Probar de nuevo", en: "Try again" },
  home: { es: "Ir al inicio", en: "Go to the home page" },
};
