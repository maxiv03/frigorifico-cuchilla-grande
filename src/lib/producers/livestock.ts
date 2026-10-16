/**
 * Reglas del portal de productores, compartidas por la calculadora (cliente) y la Server Action
 * del formulario "Ofrecer ganado". Los ids de categoría son los de `price_categories`.
 */
import type { Species } from "@/lib/catalog/types";

export const CATEGORY_SPECIES = {
  steer: "beef",
  heifer: "beef",
  cow: "beef",
  heavy_lamb: "lamb",
  hogget: "lamb",
  ewe: "lamb",
} as const satisfies Record<string, Species>;

export type CategoryId = keyof typeof CATEGORY_SPECIES;
export const CATEGORY_IDS = Object.keys(CATEGORY_SPECIES) as CategoryId[];
export const isCategory = (v: string): v is CategoryId => v in CATEGORY_SPECIES;

/** Rangos razonables por especie (peso vivo promedio en kg, rendimiento en carcasa en %). */
export const LIMITS = {
  beef: { weight: { min: 150, max: 900 }, yield: { min: 45, max: 62 } },
  lamb: { weight: { min: 20, max: 90 }, yield: { min: 38, max: 55 } },
} as const satisfies Record<Species, { weight: Range; yield: Range }>;

/** Cabezas por lote (igual que el check de la base). */
export const HEADS = { min: 1, max: 5000 } as const;

type Range = { min: number; max: number };

/** Los 19 departamentos (nombres propios: iguales en todos los idiomas). */
export const DEPARTMENTS = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres",
] as const;

/** Estimación orientativa: kg carcasa = cabezas × peso vivo × rendimiento; monto = kg × precio. */
export function estimateLot({ heads, weight, yieldPct, price }: { heads: number; weight: number; yieldPct: number; price: number }) {
  const carcassKg = heads * weight * (yieldPct / 100);
  return { carcassKg, grossUsd: carcassKg * price };
}

/** Fecha de hoy (YYYY-MM-DD) en Montevideo (UTC−3, sin horario de verano). */
export function todayUy(now = new Date()) {
  return new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Fecha disponible: desde hoy hasta un año. */
export const AVAILABLE_WITHIN_DAYS = 365;
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
