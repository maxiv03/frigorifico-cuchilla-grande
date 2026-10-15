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
