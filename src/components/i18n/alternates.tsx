"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/routing";

/**
 * Rutas equivalentes en otros idiomas para la página actual.
 * Las páginas con slugs traducidos (cortes, noticias) renderizan <SetAlternates>
 * con la ruta completa de cada idioma; el selector de idioma la usa en lugar de la
 * ruta actual. Sin alternates, el selector traduce la ruta con los mismos params.
 */
type Alternates = Partial<Record<Locale, string>>;

const Ctx = createContext<{ alternates: Alternates; set: (a: Alternates) => void }>({
  alternates: {},
  set: () => {},
});

export function AlternatesProvider({ children }: { children: ReactNode }) {
  const [alternates, set] = useState<Alternates>({});
  return <Ctx.Provider value={{ alternates, set }}>{children}</Ctx.Provider>;
}

export function useAlternates() {
  return useContext(Ctx).alternates;
}

/** Declara las rutas equivalentes de la página actual (se limpian al salir). */
export function SetAlternates({ hrefs }: { hrefs: Alternates }) {
  const { set } = useContext(Ctx);
  const key = JSON.stringify(hrefs);
  useEffect(() => {
    set(JSON.parse(key));
    return () => set({});
  }, [key, set]);
  return null;
}
