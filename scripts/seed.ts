/**
 * Carga idempotente del contenido (upsert). Usa la clave secreta.
 * Orden en la base compartida: migración aditiva → este seed → deploy.
 *   npm run db:seed
 */
import type { Locale } from "@/i18n/routing";
import { initialHistory, mondayOf } from "@/lib/prices/rotation";
import { locales, priceCategories } from "../supabase/seed";
import { adminClient } from "./lib/db";

const HISTORY_WEEKS = 12;
const db = adminClient();
const localeCodes = locales.map((l) => l.code as Locale);

async function upsert(table: string, rows: object[], onConflict: string) {
  if (rows.length === 0) return;
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table} (${rows.length})`);
}

async function seedPrices() {
  await upsert(
    "price_categories",
    priceCategories.map((c) => ({
      id: c.id,
      species: c.species,
      base_price: c.basePrice,
      yield_pct: c.yieldPct,
      sort: c.sort,
    })),
    "id",
  );
  await upsert(
    "price_category_translations",
    priceCategories.flatMap((c) => localeCodes.map((locale) => ({ category_id: c.id, locale, name: c.name[locale] }))),
    "category_id,locale",
  );

  // El historial solo se genera la primera vez; después lo mantiene el cron.
  const { count, error } = await db.from("price_quotes").select("*", { count: "exact", head: true });
  if (error) throw new Error(`price_quotes: ${error.message}`);
  if (count && count > 0) {
    console.log(`  · price_quotes ya tiene ${count} filas (lo mantiene el cron)`);
    return;
  }
  const current = mondayOf(new Date());
  await upsert(
    "price_quotes",
    priceCategories.flatMap((c) =>
      initialHistory(c.id, c.basePrice, current, HISTORY_WEEKS).map((q) => ({
        category_id: q.categoryId,
        week_start: q.weekStart,
        price_usd_kg: q.price,
      })),
    ),
    "category_id,week_start",
  );
}

async function main() {
  console.log("Seed →", process.env.SUPABASE_URL);
  await upsert(
    "locales",
    locales.map((l) => ({ code: l.code, name: l.name, is_default: l.isDefault, sort: l.sort })),
    "code",
  );
  await seedPrices();
  console.log("Seed completo.");
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
