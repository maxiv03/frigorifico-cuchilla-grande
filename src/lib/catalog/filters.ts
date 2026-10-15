import { BONES, PRESENTATIONS, SPECIES, type Bone, type Presentation, type Species } from "./types";

/**
 * Filtros del catálogo en la URL, con claves y valores neutros (iguales en todos los idiomas):
 *   ?species=lamb&zone=leg&market=eu&presentation=chilled&bone=boneless
 * `species` por defecto es beef y no se escribe.
 */
export type CatalogFilters = {
  species: Species;
  zone: string | null;
  market: string | null;
  presentation: Presentation | null;
  bone: Bone | null;
};

export const FILTER_KEYS = ["zone", "market", "presentation", "bone"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

type Readable = { get(name: string): string | null };

const oneOf = <T extends string>(list: readonly T[], v: string | null): T | null =>
  v !== null && (list as readonly string[]).includes(v) ? (v as T) : null;

/** Lee los filtros; valores desconocidos se ignoran (no rompen la página). */
export function parseFilters(params: Readable, valid: { zones: string[]; markets: string[] }): CatalogFilters {
  const species = oneOf(SPECIES, params.get("species")) ?? "beef";
  const zone = params.get("zone");
  return {
    species,
    zone: zone && valid.zones.includes(`${species}:${zone}`) ? zone : null,
    market: oneOf(valid.markets, params.get("market")),
    presentation: oneOf(PRESENTATIONS, params.get("presentation")),
    bone: oneOf(BONES, params.get("bone")),
  };
}

/** Query string sin "?" (vacía si no hay filtros). Conserva parámetros ajenos al catálogo. */
export function serializeFilters(f: CatalogFilters, base?: URLSearchParams) {
  const p = new URLSearchParams(base);
  for (const k of ["species", ...FILTER_KEYS]) p.delete(k);
  if (f.species !== "beef") p.set("species", f.species);
  for (const k of FILTER_KEYS) {
    const v = f[k];
    if (v) p.set(k, v);
  }
  return p.toString();
}

type Filterable = { species: Species; zone: string; markets: string[]; presentations: Presentation[]; bone: Bone };

export function matches(cut: Filterable, f: CatalogFilters, ignore?: FilterKey) {
  return (
    cut.species === f.species &&
    (ignore === "zone" || !f.zone || cut.zone === f.zone) &&
    (ignore === "market" || !f.market || cut.markets.includes(f.market)) &&
    (ignore === "presentation" || !f.presentation || cut.presentations.includes(f.presentation)) &&
    (ignore === "bone" || !f.bone || cut.bone === f.bone)
  );
}

export const activeFilterKeys = (f: CatalogFilters) => FILTER_KEYS.filter((k) => f[k] !== null);
