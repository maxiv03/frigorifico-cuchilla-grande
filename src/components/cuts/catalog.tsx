"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { IconClose } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  activeFilterKeys,
  matches,
  parseFilters,
  serializeFilters,
  type CatalogFilters,
  type FilterKey,
} from "@/lib/catalog/filters";
import { BONES, PRESENTATIONS, SPECIES, type Bone, type Presentation, type Species } from "@/lib/catalog/types";
import { CutCard, type CardCut } from "./cut-card";
import { CutDiagram } from "./cut-diagram";

export type CatalogCutLite = CardCut & { zone: string; markets: string[] };

export type CatalogProps = {
  cuts: CatalogCutLite[];
  zones: { key: string; species: Species; name: string }[];
  markets: { id: string; name: string }[];
  email: string;
  /** Contenido estático (datos de presentación): junto a los filtros desde lg. */
  aside?: ReactNode;
  /** Versión plegable del mismo contenido, debajo de los resultados en pantallas chicas. */
  asideCollapsed?: ReactNode;
};

/** Catálogo con los filtros leídos de la URL. Debe ir dentro de <Suspense>. */
export function CatalogFromUrl(props: CatalogProps) {
  const query = useSearchParams().toString();
  return <Catalog {...props} urlQuery={query} eager />;
}

/**
 * Variante sin URL (fallback estático del Suspense: catálogo vacuno sin filtros). Sus fotos
 * cargan en diferido: si la URL trae filtros, este bloque se reemplaza enseguida.
 */
export function CatalogStatic(props: CatalogProps) {
  return <Catalog {...props} urlQuery="" />;
}

function Catalog({
  cuts,
  zones,
  markets,
  email,
  aside,
  asideCollapsed,
  urlQuery,
  eager = false,
}: CatalogProps & { urlQuery: string; eager?: boolean }) {
  const t = useTranslations("Products");
  const valid = useMemo(
    () => ({ zones: zones.map((z) => `${z.species}:${z.key}`), markets: markets.map((m) => m.id) }),
    [zones, markets],
  );
  // Estado propio como fuente de verdad: useSearchParams se actualiza en una transición y,
  // con clics rápidos, puede llegar desfasado (un filtro recién quitado "volvía"). La URL se
  // adopta al montar, al ir atrás/adelante y cuando cambia por una navegación externa
  // (no por nuestras propias escrituras).
  const [query, setQuery] = useState(urlQuery);
  const written = useRef(new Set<string>([urlQuery]));
  useEffect(() => {
    if (!written.current.has(urlQuery)) setQuery(urlQuery);
  }, [urlQuery]);
  useEffect(() => {
    const onPop = () => setQuery(window.location.search.slice(1));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const filters = parseFilters(params, valid);
  const results = cuts.filter((c) => matches(c, filters));
  const speciesZones = zones.filter((z) => z.species === filters.species);
  const zoneName = (key: string) => speciesZones.find((z) => z.key === key)?.name ?? key;

  // Cambiar filtros = estado local + reescribir la URL (History API), sin ida y vuelta al
  // servidor: el catálogo completo ya está en el cliente.
  const [announcement, setAnnouncement] = useState("");
  const userChanged = useRef(false);
  const setFilters = (next: CatalogFilters) => {
    userChanged.current = true;
    const qs = serializeFilters(next, params);
    written.current.add(qs);
    setQuery(qs);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };
  const update = (patch: Partial<CatalogFilters>) => setFilters({ ...filters, ...patch });

  // Anuncio de cuántos cortes quedan (solo tras una acción del usuario, no al cargar).
  const count = results.length;
  const key = serializeFilters(filters);
  useEffect(() => {
    if (userChanged.current) setAnnouncement(t("results.live", { count }));
  }, [key, count, t]);

  const zoneCounts = new Map(
    speciesZones.map((z) => [z.key, cuts.filter((c) => matches(c, { ...filters, zone: z.key })).length]),
  );
  const toggleZone = (zone: string) => update({ zone: filters.zone === zone ? null : zone });

  const filterLabel = (k: FilterKey) => {
    const v = filters[k];
    if (!v) return "";
    if (k === "zone") return zoneName(v);
    if (k === "market") return markets.find((m) => m.id === v)?.name ?? v;
    if (k === "presentation") return t(`presentation.${v as Presentation}`);
    return t(`bone.${v as Bone}`);
  };
  const active = activeFilterKeys(filters);

  // Estado vacío: sugerir el filtro cuya quita devuelve más resultados.
  const suggestion =
    count === 0
      ? active
          .map((k) => ({ k, n: cuts.filter((c) => matches(c, filters, k)).length }))
          .filter((s) => s.n > 0)
          .sort((a, b) => b.n - a.n)[0]
      : undefined;

  // Filtros en pantallas chicas: panel modal ("drawer") que se abre con "Filtros (n)". Desde
  // lg es una columna fija. Foco atrapado, Escape cierra y devuelve el foco al botón.
  const [panelOpen, setPanelOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    triggerRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!panelOpen) return;
    const panel = panelRef.current;
    const focusables = () =>
      panel ? [...panel.querySelectorAll<HTMLElement>("button:not([disabled]), select, a[href]")].filter((el) => el.offsetParent) : [];
    focusables()[0]?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    // Al pasar a escritorio el panel deja de ser modal.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && setPanelOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = overflow;
    };
  }, [panelOpen, closePanel]);
  const panelFilters = (["market", "presentation", "bone"] as const).filter((k) => filters[k]).length;

  return (
    <div>
      {/* Especie */}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">{t("speciesLabel")}</legend>
        <div className="mt-2 inline-flex rounded-md bg-surface p-1 ring-1 ring-line">
          {SPECIES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filters.species === s}
              onClick={() => filters.species !== s && update({ species: s, zone: null })}
              className={cn(
                "min-h-11 rounded-sm px-5 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
                filters.species === s ? "bg-brand-700 text-white shadow-card" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              {t(`species.${s}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:mt-8 lg:grid-cols-12 lg:gap-10">
        {/* Diagrama + zonas */}
        <section aria-labelledby="zonas-titulo" className="min-w-0 lg:col-span-7">
          <div className="rounded-lg bg-surface p-4 shadow-card ring-1 ring-line sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="zonas-titulo" className="font-serif text-xl font-semibold text-ink">
                {t("diagram.title")}
              </h2>
              <p className="text-sm text-ink-muted">{t("diagram.hint")}</p>
            </div>
            <CutDiagram
              species={filters.species}
              label={t("diagram.label", { species: t(`species.${filters.species}`) })}
              selected={filters.zone}
              onSelect={toggleZone}
              zones={speciesZones.map((z) => ({
                key: z.key,
                name: z.name,
                label: t("diagram.zone", { zone: z.name, count: zoneCounts.get(z.key) ?? 0 }),
                empty: (zoneCounts.get(z.key) ?? 0) === 0,
              }))}
              className="mt-4"
            />
            <div
              role="group"
              aria-label={t("diagram.chipsLabel")}
              className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-5 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
            >
              <Chip pressed={!filters.zone} onClick={() => update({ zone: null })}>
                {t("diagram.seeAll")}
              </Chip>
              {speciesZones.map((z) => (
                <Chip
                  key={z.key}
                  pressed={filters.zone === z.key}
                  onClick={() => toggleZone(z.key)}
                  muted={(zoneCounts.get(z.key) ?? 0) === 0}
                  aria-label={t("diagram.zone", { zone: z.name, count: zoneCounts.get(z.key) ?? 0 })}
                >
                  {z.name}
                  <span aria-hidden="true" className="tabular-nums opacity-70">
                    {zoneCounts.get(z.key) ?? 0}
                  </span>
                </Chip>
              ))}
            </div>
          </div>
        </section>

        {/* Filtros: drawer en pantallas chicas, columna desde lg */}
        <section aria-labelledby="filtros-titulo" className="min-w-0 lg:col-span-5">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={panelOpen}
            aria-controls={panelId}
            onClick={() => setPanelOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-surface px-4 font-semibold text-ink ring-1 ring-line hover:bg-earth-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h14M6 10h8M8.5 15h3" strokeLinecap="round" />
            </svg>
            {panelFilters > 0 ? t("filters.openCount", { count: String(panelFilters) }) : t("filters.open")}
          </button>
          <div
            id={panelId}
            ref={panelRef}
            role={panelOpen ? "dialog" : undefined}
            aria-modal={panelOpen || undefined}
            aria-labelledby={panelOpen ? "filtros-titulo" : undefined}
            className={cn(
              panelOpen ? "fixed inset-0 z-50 flex flex-col bg-surface" : "hidden",
              "lg:static lg:z-auto lg:flex lg:flex-col lg:bg-transparent",
            )}
          >
            <div className="flex h-header shrink-0 items-center justify-between border-b border-line px-4 lg:h-auto lg:border-0 lg:px-0">
              <h2 id="filtros-titulo" className="font-serif text-xl font-semibold text-ink">
                {t("filters.title")}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-surface-muted lg:hidden"
              >
                <IconClose width={24} height={24} />
                <span className="sr-only">{t("filters.close")}</span>
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 lg:mt-4 lg:flex-none lg:overflow-visible lg:p-0">
              <div>
                <label htmlFor="filtro-mercado" className="text-sm font-semibold text-ink">
                  {t("filters.market")}
                </label>
                <select
                  id="filtro-mercado"
                  value={filters.market ?? ""}
                  onChange={(e) => update({ market: e.target.value || null })}
                  className="mt-2 block min-h-11 w-full rounded-md border border-line bg-surface px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  <option value="">{t("filters.allMarkets")}</option>
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <ChoiceGroup
                legend={t("filters.presentation")}
                anyLabel={t("filters.any")}
                options={PRESENTATIONS.map((p) => ({ value: p, label: t(`presentation.${p}`) }))}
                value={filters.presentation}
                onChange={(v) => update({ presentation: v })}
              />
              <ChoiceGroup
                legend={t("filters.bone")}
                anyLabel={t("filters.anyBone")}
                options={BONES.map((b) => ({ value: b, label: t(`bone.${b}`) }))}
                value={filters.bone}
                onChange={(v) => update({ bone: v })}
              />
              {aside && <div className="hidden lg:block">{aside}</div>}
            </div>
            <div className="flex shrink-0 gap-3 border-t border-line p-4 lg:hidden">
              <Button onClick={closePanel} className="flex-1">
                {t("filters.show", { count })}
              </Button>
              <Button variant="secondary" onClick={() => setFilters({ ...filters, market: null, presentation: null, bone: null })}>
                {t("filters.clear")}
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Resultados */}
      <section aria-labelledby="resultados-titulo" className="mt-6 lg:mt-12">
        <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="resultados-titulo" className="font-serif text-2xl font-semibold text-ink tabular-nums">
            {t("results.count", { count })}
          </h2>
          {active.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="sr-only">{t("filters.active")}</span>
              <ul className="flex flex-wrap gap-2">
                {active.map((k) => (
                  <li key={k}>
                    <button
                      type="button"
                      onClick={() => update({ [k]: null })}
                      aria-label={t("filters.remove", { label: filterLabel(k) })}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-2 pl-3 text-sm font-semibold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    >
                      {filterLabel(k)}
                      <IconClose width={14} height={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                onClick={() => setFilters({ species: filters.species, zone: null, market: null, presentation: null, bone: null })}
              >
                {t("filters.clear")}
              </Button>
            </div>
          )}
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {count > 0 ? (
          <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((c, i) => (
              <li key={c.id} className="flex">
                <CutCard cut={c} email={email} eager={eager && i < 4} className="w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
            <p className="font-serif text-xl font-semibold text-ink">{t("empty.title")}</p>
            <p className="mx-auto mt-2 max-w-md text-ink-muted">
              {suggestion
                ? t("empty.suggestion", { filter: filterLabel(suggestion.k), count: suggestion.n })
                : t("empty.generic")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {suggestion && (
                <Button onClick={() => update({ [suggestion.k]: null })}>
                  {t("empty.remove", { filter: filterLabel(suggestion.k) })}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setFilters({ species: filters.species, zone: null, market: null, presentation: null, bone: null })}
              >
                {t("filters.clear")}
              </Button>
            </div>
          </div>
        )}
      </section>

      {asideCollapsed && <div className="mt-10 lg:hidden">{asideCollapsed}</div>}
    </div>
  );
}

function Chip({
  pressed,
  muted,
  children,
  ...props
}: { pressed: boolean; muted?: boolean; children: ReactNode } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
        pressed
          ? "bg-brand-700 text-white ring-brand-700"
          : cn("bg-surface ring-line hover:bg-earth-50 hover:ring-earth-300", muted ? "text-ink-subtle" : "text-ink"),
      )}
      {...props}
    >
      {pressed && (
        <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5l3 3 7-7" />
        </svg>
      )}
      {children}
    </button>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  anyLabel,
  options,
  value,
  onChange,
}: {
  legend: string;
  anyLabel: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip pressed={value === null} onClick={() => onChange(null)}>
          {anyLabel}
        </Chip>
        {options.map((o) => (
          <Chip key={o.value} pressed={value === o.value} onClick={() => onChange(value === o.value ? null : o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
