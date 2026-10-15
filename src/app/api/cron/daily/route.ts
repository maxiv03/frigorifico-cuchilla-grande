/**
 * Único cron diario (Vercel Hobby: 1/día, solo producción). Protegido con CRON_SECRET.
 * 1. Keep-alive de Supabase (las consultas de abajo cuentan como actividad).
 * 2. Rotación de la pizarra: inserta la semana vigente y cualquier semana faltante.
 * 3. Purga de envíos de formularios con más de 90 días (declarado en Privacidad).
 * Única ubicación de la app donde se usa la clave secreta.
 */
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { missingQuotes, mondayOf } from "@/lib/prices/rotation";
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
  const { data: categories, error: catError } = await db.from("price_categories").select("id, base_price");
  if (catError) return fail("price_categories", catError.message);

  const inserted: { categoryId: string; weekStart: string; price: number }[] = [];
  for (const c of categories) {
    const { data: last, error } = await db
      .from("price_quotes")
      .select("week_start, price_usd_kg")
      .eq("category_id", c.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return fail("price_quotes", error.message);
    if (!last) continue; // sin historial: lo crea el seed

    const quotes = missingQuotes(
      c.id,
      Number(c.base_price),
      { weekStart: last.week_start, price: Number(last.price_usd_kg) },
      currentMonday,
    );
    if (quotes.length === 0) continue;

    const { error: insError } = await db.from("price_quotes").upsert(
      quotes.map((q) => ({ category_id: q.categoryId, week_start: q.weekStart, price_usd_kg: q.price })),
      { onConflict: "category_id,week_start", ignoreDuplicates: true },
    );
    if (insError) return fail("price_quotes insert", insError.message);
    inserted.push(...quotes);
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

  return Response.json({ ok: true, currentMonday, insertedQuotes: inserted.length, purged });
}

function fail(step: string, message: string) {
  console.error(`[cron/daily] ${step}: ${message}`);
  return Response.json({ ok: false, step }, { status: 500 });
}
