import type { Localized } from "@/data/company";

export type { Localized };

export type LocaleSeed = { code: string; name: string; isDefault: boolean; sort: number };

export type PriceCategorySeed = {
  id: string;
  species: "beef" | "lamb";
  /** US$/kg carcasa (ficticio). Ancla de la rotación semanal. */
  basePrice: number;
  /** Rendimiento estimado en carcasa (%), usado por la calculadora. */
  yieldPct: number;
  sort: number;
  name: Localized;
};

export type MarketSeed = {
  /** Clave neutra (también en la URL: ?market=cn). */
  id: string;
  lat: number;
  lng: number;
  /** Participación ficticia en las exportaciones (%). */
  sharePct: number;
  sort: number;
  name: Localized;
  description: Localized;
};

export type CutZoneSeed = {
  /** Clave neutra dentro de la especie (?zone=loin). En la base: `${species}_${key}`. */
  key: string;
  species: "beef" | "lamb";
  sort: number;
  name: Localized;
};

/** Foto por zona/categoría (src/lib/catalog/images.ts). Siempre de la especie del corte. */
export type CutImageKey =
  | "beef-steak"
  | "beef-roast"
  | "beef-ribs"
  | "beef-braise"
  | "beef-flank"
  | "lamb-rack"
  | "lamb-chops"
  | "lamb-cuts";

export type CutSeed = {
  /** Clave interna; en la base: `${species}_${key}`. No se muestra. */
  key: string;
  species: "beef" | "lamb";
  zone: string;
  bone: "bone_in" | "boneless";
  presentations: ("chilled" | "frozen")[];
  markets: string[];
  image: CutImageKey;
  featured?: boolean;
  /** ES: nombre INAC. EN: término de exportación. */
  name: Localized;
  /** Término alternativo (EN: de consumidor). Opcional por idioma. */
  alias?: Partial<Localized>;
  description: Localized;
};
