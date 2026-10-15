/**
 * Rotación determinista de la pizarra de precios de hacienda (valores ficticios).
 * Módulo puro: lo usan el seed (historial inicial) y el cron diario (semanas nuevas).
 *
 * Cada semana: precio = anterior × (1 + ruido + reversión)
 *  - ruido: ±1,5 % derivado de un hash de (categoría, lunes) → siempre el mismo valor.
 *  - reversión: 15 % de la distancia al precio base, para que no deriven con los años.
 */

const MAX_NOISE = 0.015;
const REVERSION = 0.15;

export type Quote = { categoryId: string; weekStart: string; price: number };

/** FNV-1a de 32 bits → número en [0, 1). */
function hashUnit(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x1_0000_0000;
}

export function nextPrice(categoryId: string, weekStart: string, previous: number, base: number) {
  const noise = (hashUnit(`${categoryId}|${weekStart}`) * 2 - 1) * MAX_NOISE;
  const reversion = ((base - previous) / base) * REVERSION;
  return Math.round(previous * (1 + noise + reversion) * 100) / 100;
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
 * Semanas faltantes desde la última cargada hasta la vigente (inclusive).
 * Si el cron falló varios días, completa todas las semanas que falten.
 */
export function missingQuotes(
  categoryId: string,
  base: number,
  last: { weekStart: string; price: number },
  currentMonday: string,
): Quote[] {
  const out: Quote[] = [];
  let { weekStart, price } = last;
  while (weekStart < currentMonday) {
    weekStart = addWeeks(weekStart, 1);
    price = nextPrice(categoryId, weekStart, price, base);
    out.push({ categoryId, weekStart, price });
  }
  return out;
}

/** Historial inicial: arranca en el precio base `weeks` semanas atrás. */
export function initialHistory(categoryId: string, base: number, currentMonday: string, weeks: number): Quote[] {
  const first = addWeeks(currentMonday, -(weeks - 1));
  return [
    { categoryId, weekStart: first, price: base },
    ...missingQuotes(categoryId, base, { weekStart: first, price: base }, currentMonday),
  ];
}
