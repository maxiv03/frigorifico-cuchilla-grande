/**
 * Rotación determinista de la pizarra de precios de hacienda (valores ficticios).
 * Módulo puro: lo usan el seed (historial) y el cron diario (semanas nuevas).
 *
 * El precio de una semana es función SOLO de (categoría, lunes): no depende de lo que haya en
 * la base, así que el seed y el cron siempre coinciden y regenerar es idempotente.
 *
 *  1. Mercado por especie: índice semanal común a todas sus categorías, paseo aleatorio con
 *     reversión a 1 desde `EPOCH` (choque ±2 % por semana, 15 % de reversión).
 *  2. Categoría: base × índice × (1 + ruido chico, ±0,5 %).
 *  3. Orden: dentro de cada especie, en el orden de `sort` (novillo > vaquillona > vaca;
 *     cordero pesado > borrego > oveja), cada categoría queda al menos `MIN_GAP` por debajo
 *     de la anterior.
 */

const EPOCH = "2025-01-06"; // lunes
const MARKET_SHOCK = 0.02;
const REVERSION = 0.15;
const CATEGORY_NOISE = 0.005;
/** Diferencia mínima, en US$/kg, entre una categoría y la siguiente de su especie. */
export const MIN_GAP = 0.05;

export type Quote = { categoryId: string; weekStart: string; price: number };
export type PriceCategoryRef = { id: string; species: string; basePrice: number; sort: number };

/** FNV-1a de 32 bits → número en [0, 1). */
function hashUnit(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x1_0000_0000;
}

const signed = (key: string) => hashUnit(key) * 2 - 1;

/** Índice de mercado de la especie en esa semana (1 = precio base). */
export function marketIndex(species: string, weekStart: string): number {
  let idx = 1;
  for (let w = addWeeks(EPOCH, 1); w <= weekStart; w = addWeeks(w, 1)) {
    idx = idx * (1 + signed(`market|${species}|${w}`) * MARKET_SHOCK) + (1 - idx) * REVERSION;
  }
  return idx;
}

const cents = (n: number) => Math.round(n * 100) / 100;

/** Pizarra completa de una semana, con el orden entre categorías garantizado. */
export function quotesForWeek(categories: PriceCategoryRef[], weekStart: string): Quote[] {
  const out: Quote[] = [];
  const bySpecies = Map.groupBy(categories, (c) => c.species);
  for (const [species, group] of bySpecies) {
    const idx = marketIndex(species, weekStart);
    let ceiling = Infinity;
    for (const c of group.toSorted((a, b) => a.sort - b.sort)) {
      const raw = cents(c.basePrice * idx * (1 + signed(`${c.id}|${weekStart}`) * CATEGORY_NOISE));
      const price = cents(Math.min(raw, ceiling - MIN_GAP));
      out.push({ categoryId: c.id, weekStart, price });
      ceiling = price;
    }
  }
  return out;
}

/** Pizarras de `from` a `to` (lunes, ambos inclusive). */
export function quotesBetween(categories: PriceCategoryRef[], from: string, to: string): Quote[] {
  const out: Quote[] = [];
  for (let w = from; w <= to; w = addWeeks(w, 1)) out.push(...quotesForWeek(categories, w));
  return out;
}

/** Lunes (YYYY-MM-DD) de la semana que contiene `date`, en hora de Montevideo (UTC−3, sin horario de verano). */
export function mondayOf(date: Date): string {
  const local = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const dow = (local.getUTCDay() + 6) % 7; // 0 = lunes
  local.setUTCDate(local.getUTCDate() - dow);
  return local.toISOString().slice(0, 10);
}

export function addWeeks(weekStart: string, weeks: number): string {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Categorías de una especie fuera de orden en alguna semana (lista vacía = todo en orden).
 * La usan el seed (antes de escribir) y las pruebas.
 */
export function orderViolations(categories: PriceCategoryRef[], quotes: Quote[]): string[] {
  const price = new Map(quotes.map((q) => [`${q.categoryId}|${q.weekStart}`, q.price]));
  const weeks = [...new Set(quotes.map((q) => q.weekStart))];
  const out: string[] = [];
  for (const group of Map.groupBy(categories, (c) => c.species).values()) {
    const sorted = group.toSorted((a, b) => a.sort - b.sort);
    for (const w of weeks) {
      for (let i = 1; i < sorted.length; i++) {
        const hi = price.get(`${sorted[i - 1].id}|${w}`);
        const lo = price.get(`${sorted[i].id}|${w}`);
        if (hi !== undefined && lo !== undefined && !(hi - lo >= MIN_GAP - 1e-9)) {
          out.push(`${w}: ${sorted[i - 1].id} ${hi} ≤ ${sorted[i].id} ${lo}`);
        }
      }
    }
  }
  return out;
}
