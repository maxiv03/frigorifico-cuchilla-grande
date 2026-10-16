/**
 * Único cron diario (Vercel Hobby: 1/día, solo producción). Protegido con CRON_SECRET.
 * 1. Keep-alive de Supabase (las consultas de abajo cuentan como actividad).
 * 2. Rotación de la pizarra: inserta la semana vigente y cualquier semana faltante (sin historial: lo crea el seed).
 * 3. Purga de envíos de formularios con más de 90 días (declarado en Privacidad).
 * 4. Registro en cron_runs (los logs de Vercel Hobby no alcanzan para verificar las corridas).
 * Única ubicación de la app donde se usa la clave secreta.
 */
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { addWeeks, mondayOf, quotesBetween, type Quote } from "@/lib/prices/rotation";
import { adminDb } from "@/lib/supabase/admin";

const RETENTION_DAYS = 90;
const FORM_TABLES = ["quote_requests", "producer_contacts", "livestock_offers"] as const;

export async function GET() {
  const auth = (await headers()).get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const currentMonday = mondayOf(new Date());

  // ─── Rotación de precios ──────────────────────────────────────────────────
  // El precio es función de (categoría, lunes): se completan todas las semanas que falten
  // desde la última cargada hasta la vigente, con el orden entre categorías garantizado.
  const { data: rows, error: catError } = await db.from("price_categories").select("id, species, base_price, sort");
  if (catError) return fail("price_categories", catError.message);
  const categories = rows.map((c) => ({ id: c.id, species: c.species, basePrice: Number(c.base_price), sort: c.sort }));

  const { data: last, error } = await db
    .from("price_quotes")
    .select("week_start")
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return fail("price_quotes", error.message);

  let inserted: Quote[] = [];
  if (last && last.week_start < currentMonday) {
    inserted = quotesBetween(categories, addWeeks(last.week_start, 1), currentMonday);
    const { error: insError } = await db.from("price_quotes").upsert(
      inserted.map((q) => ({ category_id: q.categoryId, week_start: q.weekStart, price_usd_kg: q.price })),
      { onConflict: "category_id,week_start", ignoreDuplicates: true },
    );
    if (insError) return fail("price_quotes insert", insError.message);
  }
  // expire: 0 → la próxima visita renderiza la pizarra nueva (sin servir la semana vieja).
  // El cron corre 06:00 UY, con poco tráfico: ese único render bloqueante es barato.
  if (inserted.length > 0) revalidateTag("prices", { expire: 0 });

  // ─── Purga de formularios ─────────────────────────────────────────────────
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const purged: Record<string, number> = {};
  for (const table of FORM_TABLES) {
    const { count, error } = await db.from(table).delete({ count: "exact" }).lt("created_at", cutoff);
    if (error) return fail(`${table} purge`, error.message);
    purged[table] = count ?? 0;
  }

  // ─── Registro de la ejecución ─────────────────────────────────────────────
  // Vercel Hobby no retiene logs: esta fila es la prueba de que el cron corrió (npm run ops:status).
  const { error: runError } = await db.from("cron_runs").insert({ current_monday: currentMonday, inserted_quotes: inserted.length, purged });
  if (runError) return fail("cron_runs", runError.message);

  return Response.json({ ok: true, currentMonday, insertedQuotes: inserted.length, purged });
}

function fail(step: string, message: string) {
  console.error(`[cron/daily] ${step}: ${message}`);
  return Response.json({ ok: false, step }, { status: 500 });
}
