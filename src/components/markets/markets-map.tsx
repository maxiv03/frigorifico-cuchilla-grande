"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type SyntheticEvent } from "react";

type Props = {
  /** SVG del mapa, renderizado en el servidor (un `[data-market]` enfocable por mercado). */
  map: ReactNode;
  /** Panel de cada mercado, renderizado en el servidor. */
  panels: Record<string, ReactNode>;
  /** Contenido del panel sin mercado elegido. */
  intro: ReactNode;
  /** Nombre accesible del panel. */
  panelLabel: string;
};

const DESKTOP = "(min-width: 1024px)";
const marketOf = (e: SyntheticEvent) => (e.target as Element).closest<SVGElement>("[data-market]")?.dataset.market ?? null;

/**
 * Interacción del mapa (lo único que corre en el cliente). Hover o foco en un mercado lo muestra
 * en el panel lateral (escritorio). Enter/clic: en escritorio pasa el foco al panel (Escape lo
 * devuelve al mercado); en móvil, sin panel, lleva a la fila del mercado en la lista.
 */
export function MarketsMap({ map, panels, intro, panelLabel }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Estado visible del mercado activo en el SVG (contorno + aria-expanded).
  useEffect(() => {
    mapRef.current?.querySelectorAll<SVGElement>("[data-market]").forEach((el) => {
      const on = el.dataset.market === active;
      el.toggleAttribute("data-active", on);
      el.setAttribute("aria-expanded", String(on));
    });
  }, [active]);

  const open = (id: string) => {
    setActive(id);
    if (window.matchMedia(DESKTOP).matches) {
      // El panel se re-renderiza con el mercado nuevo: enfocar su título en el próximo cuadro.
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("[data-panel-heading]")?.focus());
    } else {
      const row = document.getElementById(`market-${id}`);
      row?.scrollIntoView({ behavior: "smooth", block: "start" });
      row?.focus({ preventScroll: true });
    }
  };

  const onMapKey = (e: KeyboardEvent) => {
    const id = marketOf(e);
    if (id && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open(id);
    }
  };

  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && active) {
      e.preventDefault();
      mapRef.current?.querySelector<SVGElement>(`[data-market="${active}"]`)?.focus();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div
        ref={mapRef}
        className="lg:col-span-8"
        onPointerOver={(e) => {
          const id = marketOf(e);
          if (id) setActive(id);
        }}
        onFocus={(e) => {
          const id = marketOf(e);
          if (id) setActive(id);
        }}
        onClick={(e) => {
          const id = marketOf(e);
          if (id) open(id);
        }}
        onKeyDown={onMapKey}
      >
        {map}
      </div>
      <div
        ref={panelRef}
        id="market-panel"
        role="region"
        aria-label={panelLabel}
        onKeyDown={onPanelKey}
        data-panel={active ?? "intro"}
        className="hidden self-start rounded-lg bg-surface p-6 shadow-card ring-1 ring-line lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:col-span-4 lg:block"
      >
        {(active && panels[active]) || intro}
      </div>
    </div>
  );
}
