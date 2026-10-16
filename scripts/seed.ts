/**
 * Carga idempotente del contenido (upsert). Usa la clave secreta.
 * Orden en la base compartida: migración aditiva → este seed → deploy.
 *   npm run db:seed
 */
import { company } from "@/data/company";
import type { Locale } from "@/i18n/routing";
import { addWeeks, mondayOf, orderViolations, quotesBetween } from "@/lib/prices/rotation";
import { slugify } from "@/lib/catalog/slug";
import { LIMITS } from "@/lib/producers/livestock";
import { certifications, cutZones, cuts, locales, markets, news, priceCategories, sustainabilityGoals } from "../supabase/seed";
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
  // El rendimiento por defecto de cada categoría tiene que estar dentro del rango de su especie
  // (la calculadora lo usa como valor inicial y valida contra ese rango).
  for (const c of priceCategories) {
    const { min, max } = LIMITS[c.species].yield;
    if (c.yieldPct < min || c.yieldPct > max) throw new Error(`${c.id}: rendimiento ${c.yieldPct} fuera de ${min}–${max}`);
  }
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

  // El precio es función de (categoría, lunes), así que regenerar es idempotente: se reescriben
  // todas las semanas desde la más antigua cargada (como mínimo las últimas 12) hasta la vigente.
  const { data: first, error } = await db
    .from("price_quotes")
    .select("week_start")
    .order("week_start", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`price_quotes: ${error.message}`);
  const current = mondayOf(new Date());
  const window = addWeeks(current, -(HISTORY_WEEKS - 1));
  const from = first && first.week_start < window ? first.week_start : window;
  const quotes = quotesBetween(priceCategories, from, current);
  const violations = orderViolations(priceCategories, quotes);
  if (violations.length) throw new Error(`orden de la pizarra: ${violations.join("; ")}`);
  await upsert(
    "price_quotes",
    quotes.map((q) => ({ category_id: q.categoryId, week_start: q.weekStart, price_usd_kg: q.price })),
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
    "certifications",
    certifications.map((c) => ({ id: c.id, kind: c.kind, icon: c.icon, sort: c.sort })),
    "id",
  );
  await upsert(
    "certification_translations",
    certifications.flatMap((c) =>
      localeCodes.map((locale) => ({ certification_id: c.id, locale, name: c.name[locale], summary: c.summary[locale] })),
    ),
    "certification_id,locale",
  );
  // market_certifications: se reemplaza el conjunto completo (una certificación puede dejar un mercado).
  const delMc = await db.from("market_certifications").delete().in("certification_id", certifications.map((c) => c.id));
  if (delMc.error) throw new Error(`market_certifications: ${delMc.error.message}`);
  await upsert(
    "market_certifications",
    certifications.flatMap((c) => c.markets.map((market_id) => ({ market_id, certification_id: c.id }))),
    "market_id,certification_id",
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
      image: c.image ?? null,
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

async function seedEditorial() {
  await upsert(
    "sustainability_goals",
    sustainabilityGoals.map((g) => ({
      id: g.id,
      topic: g.topic,
      pillar: g.pillar,
      unit: g.unit,
      baseline: g.baseline,
      baseline_year: g.baselineYear,
      target: g.target,
      current: g.current,
      target_year: g.targetYear,
      status: g.status,
      sort: g.sort,
    })),
    "id",
  );
  await upsert(
    "sustainability_goal_translations",
    sustainabilityGoals.flatMap((g) =>
      localeCodes.map((locale) => ({ goal_id: g.id, locale, title: g.title[locale], description: g.description[locale] })),
    ),
    "goal_id,locale",
  );
  await upsert(
    "news_posts",
    news.map((n) => ({ id: n.id, published_at: n.publishedAt, image: n.image, featured: n.featured ?? false })),
    "id",
  );
  await upsert(
    "news_translations",
    news.flatMap((n) =>
      localeCodes.map((locale) => ({
        post_id: n.id,
        locale,
        slug: slugify(n.title[locale]),
        title: n.title[locale],
        excerpt: n.excerpt[locale],
        body_md: n.body[locale],
      })),
    ),
    "post_id,locale",
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
  await seedEditorial();
  console.log("Seed completo.");
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
