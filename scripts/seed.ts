/**
 * Carga idempotente del contenido (upsert). Usa la clave secreta.
 * Orden en la base compartida: migración aditiva → este seed → deploy.
 *   npm run db:seed
 */
import { company } from "@/data/company";
import type { Locale } from "@/i18n/routing";
import { initialHistory, mondayOf } from "@/lib/prices/rotation";
import { slugify } from "@/lib/catalog/slug";
import { cutZones, cuts, locales, markets, priceCategories } from "../supabase/seed";
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

async function seedCatalog() {
  await upsert(
    "markets",
    markets.map((m) => ({
      id: m.id,
      lat: m.lat,
      lng: m.lng,
      share_pct: m.sharePct,
      volume_tonnes: Math.round((company.figures.exportTonnesPerYear * m.sharePct) / 100),
      sort: m.sort,
    })),
    "id",
  );
  await upsert(
    "market_translations",
    markets.flatMap((m) =>
      localeCodes.map((locale) => ({ market_id: m.id, locale, name: m.name[locale], description: m.description[locale] })),
    ),
    "market_id,locale",
  );
  await upsert(
    "cut_zones",
    cutZones.map((z) => ({ id: `${z.species}_${z.key}`, species: z.species, sort: z.sort })),
    "id",
  );
  await upsert(
    "cut_zone_translations",
    cutZones.flatMap((z) => localeCodes.map((locale) => ({ zone_id: `${z.species}_${z.key}`, locale, name: z.name[locale] }))),
    "zone_id,locale",
  );
  await upsert(
    "cuts",
    cuts.map((c, i) => ({
      id: `${c.species}_${c.key}`,
      species: c.species,
      zone_id: `${c.species}_${c.zone}`,
      bone: c.bone,
      presentations: c.presentations,
      image: c.image,
      featured: c.featured ?? false,
      sort: i + 1,
    })),
    "id",
  );
  await upsert(
    "cut_translations",
    cuts.flatMap((c) =>
      localeCodes.map((locale) => ({
        cut_id: `${c.species}_${c.key}`,
        species: c.species,
        locale,
        slug: slugify(c.name[locale]),
        name: c.name[locale],
        alias: c.alias?.[locale] ?? null,
        description: c.description[locale],
      })),
    ),
    "cut_id,locale",
  );
  // cut_markets: se reemplaza el conjunto de cada corte (un corte puede dejar un mercado).
  const ids = cuts.map((c) => `${c.species}_${c.key}`);
  const del = await db.from("cut_markets").delete().in("cut_id", ids);
  if (del.error) throw new Error(`cut_markets: ${del.error.message}`);
  await upsert(
    "cut_markets",
    cuts.flatMap((c) => c.markets.map((market_id) => ({ cut_id: `${c.species}_${c.key}`, market_id }))),
    "cut_id,market_id",
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
  await seedCatalog();
  console.log("Seed completo.");
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
