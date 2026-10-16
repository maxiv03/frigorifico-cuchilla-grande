"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export type TabItem = {
  /** Clave neutra (igual en todos los idiomas; ?tab=quote). */
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Contenido del panel (puede venir renderizado del servidor). */
  panel: ReactNode;
};

type Props = {
  items: TabItem[];
  /** Nombre accesible de la lista de pestañas. */
  label: string;
  /** Controlado (contacto: la pestaña vive en la URL). Sin `value`, el estado es interno. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** Prefijo de ids: `${idPrefix}-tab-<id>` y `${idPrefix}-panel-<id>`. */
  idPrefix?: string;
  /** Panel enfocable (tabindex=0): solo si el panel no tiene controles propios. */
  focusablePanels?: boolean;
  className?: string;
  listClassName?: string;
};

/**
 * Pestañas accesibles (patrón WAI-ARIA, activación automática): role=tablist/tab/tabpanel,
 * tabindex itinerante, flechas izquierda/derecha (y arriba/abajo), Inicio y Fin. Todos los
 * paneles quedan en el HTML (los inactivos con `hidden`), así el contenido es estático.
 */
export function Tabs({ items, label, value, defaultValue, onValueChange, idPrefix, focusablePanels = true, className, listClassName }: Props) {
  const auto = useId();
  const prefix = idPrefix ?? auto;
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
  const active = value ?? internal;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (id: string, focus = false) => {
    if (value === undefined) setInternal(id);
    onValueChange?.(id);
    if (focus) refs.current[id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = items.findIndex((t) => t.id === active);
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (i + 1) % items.length
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (i - 1 + items.length) % items.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    select(items[next].id, true);
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className={cn("flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:thin]", listClassName)}
      >
        {items.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`${prefix}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${prefix}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              data-tab={t.id}
              onClick={() => select(t.id)}
              onKeyDown={onKeyDown}
              className={cn(
                "-mb-px inline-flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-4 font-semibold whitespace-nowrap transition-colors focus-visible:outline-offset-[-2px]",
                selected ? "border-brand-700 text-brand-800" : "border-transparent text-ink-muted hover:border-line hover:text-ink",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${prefix}-panel-${t.id}`}
          aria-labelledby={`${prefix}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={focusablePanels ? 0 : undefined}
          data-tab-panel={t.id}
          className="pt-8 focus-visible:outline-offset-4"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
