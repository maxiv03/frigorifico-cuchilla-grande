"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { control, useErrorText } from "@/components/forms/fields";
import { IconAlert, IconClose, IconSearch } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import type { Species } from "@/lib/catalog/types";
import { MAX_CUTS } from "@/lib/forms/contact-rules";
import type { FieldError } from "@/lib/forms/types";

export type CutOption = { id: string; species: Species; name: string; alias: string | null };

/** Sin acentos ni mayúsculas, para buscar "carre" y encontrar "Carré". */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Cortes de interés: casillas del catálogo agrupadas por especie, con búsqueda (nombre y alias)
 * y la lista de elegidos con botón para quitar. Las casillas filtradas quedan ocultas pero se
 * siguen enviando si están marcadas (name="cuts", ids neutros).
 */
export function CutPicker({
  options,
  defaultSelected,
  error,
  speciesLabels,
}: {
  options: CutOption[];
  defaultSelected: string[];
  error?: FieldError;
  speciesLabels: Record<Species, string>;
}) {
  const t = useTranslations("Contact.quote.cuts");
  const errorText = useErrorText();
  const [selected, setSelected] = useState<string[]>(() => defaultSelected.filter((id) => options.some((o) => o.id === id)));
  const [query, setQuery] = useState("");
  const listId = useId();
  const countId = useId();
  const q = fold(query.trim());
  const matches = (o: CutOption) => !q || fold(o.name).includes(q) || (o.alias ? fold(o.alias).includes(q) : false);
  const visibleCount = options.filter(matches).length;
  const byId = new Map(options.map((o) => [o.id, o]));

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => (on ? (s.includes(id) ? s : [...s, id]) : s.filter((x) => x !== id)));

  const describedBy = [`f-cuts-hint`, error ? `f-cuts-error` : null].filter(Boolean).join(" ");

  return (
    <fieldset className="scroll-below-header sm:col-span-2" data-field="cuts" aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
      <legend className="font-semibold text-ink">{t("label")}</legend>
      <p id="f-cuts-hint" className="mt-0.5 text-sm text-ink-muted">
        {t("hint", { max: String(MAX_CUTS) })}
      </p>

      {selected.length > 0 && (
        <div className="mt-3">
          <p className="sr-only" id={`${listId}-chosen`}>
            {t("chosen", { count: selected.length })}
          </p>
          <ul aria-labelledby={`${listId}-chosen`} className="flex flex-wrap gap-2" data-selected-cuts>
            {selected.map((id) => {
              const o = byId.get(id);
              if (!o) return null;
              return (
                <li key={id} data-chip={id}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pr-1 pl-3 text-sm font-semibold text-brand-900 ring-1 ring-brand-200 ring-inset">
                    {o.name}
                    <button
                      type="button"
                      onClick={() => toggle(id, false)}
                      aria-label={t("remove", { cut: o.name })}
                      className="inline-flex size-7 items-center justify-center rounded-full hover:bg-brand-100"
                    >
                      <IconClose width={14} height={14} />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="relative mt-3">
        <label htmlFor="f-cutsSearch" className="sr-only">
          {t("search")}
        </label>
        <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" />
        <input
          id="f-cutsSearch"
          type="search"
          data-focus-for="cuts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter en la búsqueda no envía el formulario.
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder={t("searchPlaceholder")}
          aria-controls={listId}
          aria-describedby={countId}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          className={cn(control, "pl-11")}
        />
      </div>
      <p id={countId} aria-live="polite" className="mt-1.5 text-sm text-ink-muted">
        {q ? t("matches", { count: visibleCount }) : t("total", { count: options.length })}
      </p>

      <div id={listId} className="mt-2 max-h-72 overflow-y-auto rounded-md bg-surface ring-1 ring-earth-300 ring-inset" data-cut-options>
        {(["beef", "lamb"] as const).map((species) => {
          const group = options.filter((o) => o.species === species);
          const anyVisible = group.some(matches);
          return (
            <div key={species} role="group" aria-labelledby={`${listId}-${species}`} hidden={!anyVisible}>
              <p id={`${listId}-${species}`} className="sticky top-0 z-10 border-b border-line bg-surface-muted px-3.5 py-1.5 text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">
                {speciesLabels[species]}
              </p>
              <ul>
                {group.map((o) => {
                  const checked = selected.includes(o.id);
                  return (
                    <li key={o.id} hidden={!matches(o)}>
                      <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3.5 py-1.5 hover:bg-earth-50">
                        <input
                          type="checkbox"
                          name="cuts"
                          value={o.id}
                          checked={checked}
                          onChange={(e) => toggle(o.id, e.target.checked)}
                          className="size-5 shrink-0 accent-brand-700"
                        />
                        <span className="text-ink">
                          {o.name}
                          {o.alias && <span className="ml-1.5 text-sm text-ink-muted">({o.alias})</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {visibleCount === 0 && <p className="px-3.5 py-4 text-sm text-ink-muted">{t("none")}</p>}
      </div>

      {error && (
        <p id="f-cuts-error" data-error={error.code} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-down">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
          {errorText(error)}
        </p>
      )}
    </fieldset>
  );
}
