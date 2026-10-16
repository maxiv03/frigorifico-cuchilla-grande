"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type Props = {
  /** Contenido por especie (renderizado en el servidor). */
  panels: Record<"beef" | "lamb", ReactNode>;
  labels: Record<"beef" | "lamb", string>;
  groupLabel: string;
};

/** Selector Vacunos/Ovinos: botones con aria-pressed; el otro gráfico queda oculto (hidden). */
export function SpeciesToggle({ panels, labels, groupLabel }: Props) {
  const [species, setSpecies] = useState<"beef" | "lamb">("beef");
  return (
    <div>
      <div role="group" aria-label={groupLabel} className="inline-flex rounded-md bg-surface-muted p-1 ring-1 ring-line ring-inset">
        {(["beef", "lamb"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={species === s}
            data-species={s}
            onClick={() => setSpecies(s)}
            className={cn(
              "min-h-10 rounded-sm px-4 text-sm font-semibold transition-colors",
              species === s ? "bg-brand-700 text-white shadow-sm" : "text-ink hover:bg-surface",
            )}
          >
            {labels[s]}
          </button>
        ))}
      </div>
      {(["beef", "lamb"] as const).map((s) => (
        <div key={s} hidden={species !== s} className="mt-6">
          {panels[s]}
        </div>
      ))}
    </div>
  );
}
