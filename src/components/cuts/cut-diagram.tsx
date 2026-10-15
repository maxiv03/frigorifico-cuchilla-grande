"use client";

import { useTranslations } from "next-intl";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/components/ui/cn";
import type { Species } from "@/lib/catalog/types";
import { diagrams, toPath, zonePieceOf } from "./diagram-geometry";

export type DiagramZone = {
  key: string;
  name: string;
  /** Texto accesible completo (nombre + cantidad de cortes). */
  label: string;
  /** Sin cortes con los filtros actuales: se atenúa (sigue siendo navegable). */
  empty?: boolean;
};

type Props = {
  species: Species;
  zones: DiagramZone[];
  selected: string | null;
  /** Sin `onSelect` el diagrama es estático (detalle de corte). */
  onSelect?: (zone: string) => void;
  /** Nombre accesible del diagrama. */
  label: string;
  /** Nombres de zona dentro del dibujo (desde sm): todos, solo la seleccionada o ninguno. */
  showLabels?: boolean | "selected";
  className?: string;
};

/**
 * Diagrama de cortes en SVG. Estados distinguibles sin depender del color:
 * - reposo: relleno arena, separadores blancos;
 * - hover: tono más oscuro + contorno fino;
 * - foco de teclado: anillo punteado grueso;
 * - seleccionada: relleno bordó con rayado diagonal + contorno grueso + nombre en negrita
 *   sobre pastilla.
 */
export function CutDiagram({ species, zones, selected, onSelect, label, showLabels = true, className }: Props) {
  const t = useTranslations("Products.diagram");
  const geometry = diagrams[species];
  const uid = useId().replace(/:/g, "");
  const [focused, setFocused] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const interactive = !!onSelect;
  const byKey = new Map(zones.map((z) => [z.key, z]));

  // Piezas agrupadas por zona lógica (el garrón tiene dos: delantero y trasero).
  const groups = new Map<string, typeof geometry.zones[number][]>();
  for (const piece of geometry.zones) {
    const key = zonePieceOf(piece.id);
    groups.set(key, [...(groups.get(key) ?? []), piece]);
  }

  const onKey = (e: KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(key);
    }
  };

  const clip = `body-${uid}`;
  const hatch = `hatch-${uid}`;

  return (
    <svg
      viewBox={geometry.viewBox}
      role={interactive ? "group" : "img"}
      aria-label={label}
      className={cn("h-auto w-full select-none", className)}
    >
      <defs>
        <clipPath id={clip}>
          <path d={geometry.body} />
        </clipPath>
        <pattern id={hatch} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="var(--color-brand-700)" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="var(--color-brand-500)" strokeWidth="6" />
        </pattern>
      </defs>

      {geometry.behind.map((d) => (
        <path key={d} d={d} fill="var(--color-earth-100)" stroke="var(--color-earth-700)" strokeWidth="3" />
      ))}
      {/* Base neutra (cabeza, pezuñas): no es zona */}
      <path d={geometry.body} fill="var(--color-earth-100)" />

      {[...groups.entries()].map(([key, pieces]) => {
        const zone = byKey.get(key);
        if (!zone) return null;
        const isSelected = selected === key;
        const d = pieces.map((p) => toPath(p.polygon)).join("");
        return (
          <g
            key={key}
            data-zone={key}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? zone.label : undefined}
            aria-pressed={interactive ? isSelected : undefined}
            onClick={interactive ? () => onSelect?.(key) : undefined}
            onKeyDown={interactive ? (e) => onKey(e, key) : undefined}
            // Anillo solo con foco de teclado (no al hacer clic).
            onFocus={interactive ? (e) => e.currentTarget.matches(":focus-visible") && setFocused(key) : undefined}
            onBlur={interactive ? () => setFocused((f) => (f === key ? null : f)) : undefined}
            onPointerEnter={interactive ? () => setHovered(key) : undefined}
            onPointerLeave={interactive ? () => setHovered((h) => (h === key ? null : h)) : undefined}
            className={cn("outline-none", interactive && "cursor-pointer")}
          >
            <path
              d={d}
              clipPath={`url(#${clip})`}
              fill={isSelected ? `url(#${hatch})` : undefined}
              className={cn(
                "stroke-white transition-[fill] duration-150 [stroke-width:3]",
                !isSelected && (zone.empty ? "fill-earth-50" : "fill-earth-200"),
                !isSelected && hovered === key && "fill-earth-300",
              )}
            />
          </g>
        );
      })}

      {/* Contornos de hover (fino) y seleccionada (grueso), en una capa propia para que
          las zonas vecinas no los tapen */}
      {[...groups.entries()].map(([key, pieces]) => {
        const isSelected = selected === key;
        if (!isSelected && hovered !== key) return null;
        return (
          <path
            key={key}
            d={pieces.map((p) => toPath(p.polygon)).join("")}
            clipPath={`url(#${clip})`}
            fill="none"
            className={cn("pointer-events-none", isSelected ? "stroke-brand-900 [stroke-width:8]" : "stroke-ink [stroke-width:4]")}
          />
        );
      })}

      {/* Contorno de la silueta */}
      <path d={geometry.body} fill="none" stroke="var(--color-earth-700)" strokeWidth="3" className="pointer-events-none" />
      {geometry.over.map((d) => (
        <path
          key={d}
          d={d}
          fill="var(--color-earth-100)"
          stroke="var(--color-earth-700)"
          strokeWidth="3"
          className="pointer-events-none"
        />
      ))}

      {/* Foco de teclado: anillo punteado por encima de todo */}
      {focused &&
        (groups.get(focused) ?? []).map((p) => (
          <path
            key={p.id}
            d={toPath(p.polygon)}
            clipPath={`url(#${clip})`}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="10"
            strokeDasharray="14 9"
            className="pointer-events-none"
          />
        ))}

      {showLabels &&
        geometry.zones.map((piece) => {
          const key = zonePieceOf(piece.id);
          const zone = byKey.get(key);
          if (!zone || !piece.label) return null;
          const isSelected = selected === key;
          if (showLabels === "selected" && !isSelected) return null;
          return (
            <ZoneLabel
              key={piece.id}
              at={piece.label}
              anchor={piece.anchor ?? "middle"}
              lines={wrap(piece.piece ? t(`pieces.${piece.piece}` as "pieces.shin") : zone.name)}
              selected={isSelected}
            />
          );
        })}
    </svg>
  );
}

const FONT = 19;
const LINE = 1.1 * FONT;

/**
 * Nombre de zona dentro del dibujo. Reposo: texto con halo claro. Seleccionada: texto
 * blanco en negrita sobre una pastilla bordó (sin contorno en el texto, que lo emborronaba).
 */
function ZoneLabel({
  at: [x, y],
  anchor,
  lines,
  selected,
}: {
  at: readonly [number, number];
  anchor: "start" | "middle" | "end";
  lines: string[];
  selected: boolean;
}) {
  const top = y - ((lines.length - 1) * LINE) / 2;
  // Ancho aproximado (Source Sans 3 en negrita ≈ 0,56 em por carácter) para la pastilla.
  const width = Math.max(...lines.map((l) => l.length)) * FONT * 0.56 + 22;
  const height = lines.length * LINE + 10;
  const left = anchor === "start" ? x - 11 : anchor === "end" ? x - width + 11 : x - width / 2;
  return (
    <g aria-hidden="true" className="pointer-events-none hidden sm:inline">
      {selected && (
        <rect
          x={left}
          y={top - FONT * 0.72 - 5}
          width={width}
          height={height}
          rx={lines.length > 1 ? 12 : height / 2}
          className="fill-brand-900"
        />
      )}
      <text
        x={x}
        y={top}
        textAnchor={anchor}
        className={cn(
          "font-sans text-[19px]",
          selected ? "fill-white font-bold" : "fill-ink font-semibold [paint-order:stroke] [stroke:var(--color-surface)] [stroke-width:4]",
        )}
      >
        {lines.map((line, i) => (
          <tspan key={line} x={x} dy={i === 0 ? 0 : LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/** Parte nombres largos en dos líneas por el espacio más cercano al medio. */
function wrap(name: string): string[] {
  if (name.length <= 14) return [name];
  const mid = name.length / 2;
  let best = -1;
  for (let i = 0; i < name.length; i++) {
    if (name[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return best < 0 ? [name] : [name.slice(0, best), name.slice(best + 1)];
}
