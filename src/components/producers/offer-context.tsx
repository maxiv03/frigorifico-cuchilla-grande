"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** Valores que la calculadora pasa al formulario "Ofrecer ganado". */
export type OfferPrefill = { category: string; headCount: string; avgWeight: string };

type Ctx = {
  prefill: OfferPrefill | null;
  /** Cambia con cada precarga: el formulario se vuelve a montar con los valores nuevos. */
  version: number;
  offerLot: (values: OfferPrefill) => void;
};

const OfferContext = createContext<Ctx | null>(null);

/** Une la calculadora y el formulario (pueden estar separados por secciones del servidor). */
export function OfferProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<OfferPrefill | null>(null);
  const [version, setVersion] = useState(0);

  const offerLot = useCallback((values: OfferPrefill) => {
    setPrefill(values);
    setVersion((v) => v + 1);
    // Después de montar el formulario precargado: llevarlo a la vista y enfocar su título.
    requestAnimationFrame(() => {
      const heading = document.getElementById("offer");
      heading?.scrollIntoView({ behavior: "smooth", block: "start" });
      heading?.focus({ preventScroll: true });
    });
  }, []);

  const value = useMemo(() => ({ prefill, version, offerLot }), [prefill, version, offerLot]);
  return <OfferContext.Provider value={value}>{children}</OfferContext.Provider>;
}

export function useOffer() {
  const ctx = useContext(OfferContext);
  if (!ctx) throw new Error("useOffer fuera de <OfferProvider>");
  return ctx;
}
