import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { publicDb } from "@/lib/supabase/public";

export type PriceRow = {
  categoryId: string;
  species: "beef" | "lamb";
  name: string;
  price: number;
  previousPrice: number | null;
  changePct: number | null;
};

export type PriceBoard = { weekStart: string; rows: PriceRow[] };

/**
 * Pizarra vigente (última semana cargada) con nombres en el idioma pedido.
 * Caché: la invalida el cron diario con revalidateTag("prices") al insertar una semana.
 * cacheLife("days") es solo la red de seguridad si el cron falla (revalida a las 24 h).
 */
export async function getPriceBoard(locale: Locale): Promise<PriceBoard | null> {
  "use cache";
  cacheTag("prices");
  cacheLife("days");

  const db = publicDb();
  const [board, categories] = await Promise.all([
    db.from("price_board").select("category_id, week_start, price_usd_kg, previous_price_usd_kg, change_pct"),
    db
      .from("price_categories")
      .select("id, species, sort, price_category_translations(name)")
      .eq("price_category_translations.locale", locale)
      .order("sort"),
  ]);
  if (board.error) throw new Error(`price_board: ${board.error.message}`);
  if (categories.error) throw new Error(`price_categories: ${categories.error.message}`);
  if (board.data.length === 0) return null;

  const byCategory = new Map(board.data.map((r) => [r.category_id, r]));
  const rows: PriceRow[] = categories.data.flatMap((c) => {
    const q = byCategory.get(c.id);
    if (!q) return [];
    return [
      {
        categoryId: c.id,
        species: c.species as PriceRow["species"],
        name: c.price_category_translations[0]?.name ?? c.id,
        price: Number(q.price_usd_kg),
        previousPrice: q.previous_price_usd_kg === null ? null : Number(q.previous_price_usd_kg),
        changePct: q.change_pct === null ? null : Number(q.change_pct),
      },
    ];
  });

  return { weekStart: board.data[0].week_start, rows };
}
