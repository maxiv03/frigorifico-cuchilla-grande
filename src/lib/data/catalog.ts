import { cacheLife, cacheTag } from "next/cache";
import { routing, type Locale } from "@/i18n/routing";
import type { Bone, Presentation, Species } from "@/lib/catalog/types";
import { publicDb } from "@/lib/supabase/public";

export type CatalogZone = { key: string; species: Species; name: string };
export type CatalogMarket = { id: string; name: string };
export type CatalogCut = {
  id: string;
  species: Species;
  /** Clave neutra de zona dentro de la especie (sin prefijo). */
  zone: string;
  bone: Bone;
  presentations: Presentation[];
  image: string;
  featured: boolean;
  slug: string;
  name: string;
  alias: string | null;
  description: string;
  markets: string[];
};
export type Catalog = { zones: CatalogZone[]; markets: CatalogMarket[]; cuts: CatalogCut[] };

/** "beef_loin" → "loin" */
const zoneKey = (id: string, species: string) => id.slice(species.length + 1);

/**
 * Catálogo completo en un idioma (36 cortes: se filtra en el cliente, sin ida y vuelta).
 * El contenido solo cambia con `npm run db:seed` + deploy; cacheLife("days") por las dudas.
 */
export async function getCatalog(locale: Locale): Promise<Catalog> {
  "use cache";
  cacheTag("catalog");
  cacheLife("days");

  const db = publicDb();
  const [zones, markets, cuts] = await Promise.all([
    db.from("cut_zones").select("id, species, sort, cut_zone_translations(name)").eq("cut_zone_translations.locale", locale).order("sort"),
    db.from("markets").select("id, sort, market_translations(name)").eq("market_translations.locale", locale).order("sort"),
    db
      .from("cuts")
      .select("id, species, zone_id, bone, presentations, image, featured, sort, cut_translations(slug, name, alias, description), cut_markets(market_id)")
      .eq("cut_translations.locale", locale)
      .order("sort"),
  ]);
  if (zones.error) throw new Error(`cut_zones: ${zones.error.message}`);
  if (markets.error) throw new Error(`markets: ${markets.error.message}`);
  if (cuts.error) throw new Error(`cuts: ${cuts.error.message}`);

  const marketOrder = new Map(markets.data.map((m) => [m.id, m.sort]));

  return {
    zones: zones.data.map((z) => ({
      key: zoneKey(z.id, z.species),
      species: z.species as Species,
      name: z.cut_zone_translations[0]?.name ?? z.id,
    })),
    markets: markets.data.map((m) => ({ id: m.id, name: m.market_translations[0]?.name ?? m.id })),
    cuts: cuts.data.flatMap((c) => {
      const t = c.cut_translations[0];
      if (!t) return [];
      return [
        {
          id: c.id,
          species: c.species as Species,
          zone: zoneKey(c.zone_id, c.species),
          bone: c.bone as Bone,
          presentations: c.presentations as Presentation[],
          image: c.image ?? "",
          featured: c.featured,
          slug: t.slug,
          name: t.name,
          alias: t.alias,
          description: t.description,
          markets: c.cut_markets
            .map((m) => m.market_id)
            .sort((a, b) => (marketOrder.get(a) ?? 0) - (marketOrder.get(b) ?? 0)),
        },
      ];
    }),
  };
}

/** Slugs de cada corte en todos los idiomas: id → { es: "lomo", en: "tenderloin" }. */
export async function getCutSlugs(): Promise<Record<string, Record<Locale, string>>> {
  "use cache";
  cacheTag("catalog");
  cacheLife("days");

  const { data, error } = await publicDb().from("cut_translations").select("cut_id, locale, slug");
  if (error) throw new Error(`cut_translations: ${error.message}`);
  const out: Record<string, Record<Locale, string>> = {};
  for (const row of data) {
    if (!(routing.locales as readonly string[]).includes(row.locale)) continue;
    (out[row.cut_id] ??= {} as Record<Locale, string>)[row.locale as Locale] = row.slug;
  }
  return out;
}
