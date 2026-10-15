import type { PriceCategorySeed } from "./types";

/** Valores referenciales ficticios, en US$/kg carcasa. */
export const priceCategories: PriceCategorySeed[] = [
  { id: "steer", species: "beef", basePrice: 5.2, yieldPct: 53, sort: 1, name: { es: "Novillo", en: "Steer" } },
  { id: "heifer", species: "beef", basePrice: 5.05, yieldPct: 51, sort: 2, name: { es: "Vaquillona", en: "Heifer" } },
  { id: "cow", species: "beef", basePrice: 4.8, yieldPct: 49, sort: 3, name: { es: "Vaca", en: "Cow" } },
  {
    id: "heavy_lamb",
    species: "lamb",
    basePrice: 5.9,
    yieldPct: 47,
    sort: 4,
    name: { es: "Cordero pesado", en: "Heavy lamb" },
  },
  { id: "hogget", species: "lamb", basePrice: 5.6, yieldPct: 45, sort: 5, name: { es: "Borrego", en: "Hogget" } },
  { id: "ewe", species: "lamb", basePrice: 4.3, yieldPct: 43, sort: 6, name: { es: "Oveja", en: "Ewe" } },
];
