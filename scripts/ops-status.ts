/**
 * Estado operativo (clave secreta, solo lectura).
 *   npm run ops:status [-- --days 14]
 * - Ejecuciones del cron (cron_runs): una por día UTC, sin huecos desde la primera registrada.
 * - Pizarra: semana vigente cargada y una fila por categoría y semana en las últimas 12.
 * - Formularios: filas pendientes de purga (más de 90 días) = 0.
 */
import { addWeeks, mondayOf } from "@/lib/prices/rotation";
import { adminClient } from "./lib/db";

const args = process.argv.slice(2);
const days = Number(args[args.indexOf("--days") + 1]) || 14;
const db = adminClient();
const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

async function main() {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data: runs, error } = await db.from("cron_runs").select("ran_at, current_monday, inserted_quotes, purged, ok").gte("ran_at", since).order("ran_at");
  if (error) throw new Error(`cron_runs: ${error.message}`);
  console.log(`Ejecuciones del cron (últimos ${days} días):`);
  for (const r of runs) console.log(`  ${r.ran_at.replace("T", " ").slice(0, 19)} UTC · semana ${r.current_monday} · ${r.inserted_quotes} precios · purga ${JSON.stringify(r.purged)}`);
  const byDay = new Set(runs.map((r) => r.ran_at.slice(0, 10)));
  const missing: string[] = [];
  if (runs.length) {
    const today = new Date().toISOString().slice(0, 10);
    for (let d = new Date(`${runs[0].ran_at.slice(0, 10)}T00:00:00Z`); d.toISOString().slice(0, 10) <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = d.toISOString().slice(0, 10);
      // Hoy solo cuenta si ya pasó la ventana del cron (09:00–10:00 UTC en Hobby).
      if (day === today && new Date().getUTCHours() < 10) continue;
      if (!byDay.has(day)) missing.push(day);
    }
  }
  check("cron: al menos una ejecución registrada", runs.length > 0, "cron_runs vacía (el registro empezó en la fase 6)");
  check("cron: una ejecución por día, sin huecos", runs.length > 0 && missing.length === 0, missing.join(", "));

  const current = mondayOf(new Date());
  const from = addWeeks(current, -11);
  const { data: quotes, error: qError } = await db.from("price_quotes").select("week_start, category_id").gte("week_start", from);
  if (qError) throw new Error(`price_quotes: ${qError.message}`);
  const weeks = new Set(quotes.map((q) => q.week_start));
  check(`pizarra: semana vigente (${current}) cargada`, weeks.has(current));
  check("pizarra: 12 semanas × 6 categorías", weeks.size === 12 && quotes.length === 72, `${weeks.size} semanas · ${quotes.length} filas`);

  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
  for (const t of ["quote_requests", "producer_contacts", "livestock_offers"]) {
    const { count } = await db.from(t).select("*", { count: "exact", head: true }).lt("created_at", cutoff);
    check(`formularios: ${t} sin filas de más de 90 días`, (count ?? 0) === 0, String(count));
  }

  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.ok || !r.detail ? "" : ` — ${r.detail}`}`);
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
