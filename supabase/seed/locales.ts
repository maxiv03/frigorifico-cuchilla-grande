import type { LocaleSeed } from "./types";

// Debe coincidir con routing.locales (lo verifica i18n:check).
export const locales: LocaleSeed[] = [
  { code: "es", name: "Español", isDefault: true, sort: 1 },
  { code: "en", name: "English", isDefault: false, sort: 2 },
];
