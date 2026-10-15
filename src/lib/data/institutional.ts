import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { publicDb } from "@/lib/supabase/public";
import { getCatalog } from "./catalog";

export type Certification = {
  id: string;
  icon: string;
  name: string;
  summary: string;
  /** Mercados que la exigen o la piden, en el orden de los mercados. */
  markets: string[];
};

export type MarketInfo = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  sharePct: number;
  volumeTonnes: number;
  /** Certificaciones requeridas (ids, en el orden de las certificaciones). */
  certifications: string[];
  /** Cortes principales: destacados primero, luego por orden del catálogo. */
  topCuts: { id: string; name: string; species: "beef" | "lamb"; slug: string }[];
};

/**
 * Certificaciones y mercados con sus relaciones, en un idioma. Lecturas con la clave
 * publicable. El contenido solo cambia con `npm run db:seed` + deploy.
 */
export async function getInstitutional(locale: Locale): Promise<{ certifications: Certification[]; markets: MarketInfo[] }> {
  "use cache";
  cacheTag("catalog");
  cacheLife("days");

  const db = publicDb();
  const [certs, markets, links, catalog] = await Promise.all([
    db.from("certifications").select("id, icon, sort, certification_translations(name, summary)").eq("certification_translations.locale", locale).order("sort"),
    db
      .from("markets")
      .select("id, lat, lng, share_pct, volume_tonnes, sort, market_translations(name, description)")
      .eq("market_translations.locale", locale)
      .order("sort"),
    db.from("market_certifications").select("market_id, certification_id"),
    getCatalog(locale),
  ]);
  if (certs.error) throw new Error(`certifications: ${certs.error.message}`);
  if (markets.error) throw new Error(`markets: ${markets.error.message}`);
  if (links.error) throw new Error(`market_certifications: ${links.error.message}`);

  const marketOrder = markets.data.map((m) => m.id);
  const certOrder = certs.data.map((c) => c.id);
  const byOrder = (order: string[]) => (a: string, b: string) => order.indexOf(a) - order.indexOf(b);

  return {
    certifications: certs.data.map((c) => ({
      id: c.id,
      icon: c.icon,
      name: c.certification_translations[0]?.name ?? c.id,
      summary: c.certification_translations[0]?.summary ?? "",
      markets: links.data
        .filter((l) => l.certification_id === c.id)
        .map((l) => l.market_id)
        .sort(byOrder(marketOrder)),
    })),
    markets: markets.data.map((m) => ({
      id: m.id,
      name: m.market_translations[0]?.name ?? m.id,
      description: m.market_translations[0]?.description ?? "",
      lat: m.lat,
      lng: m.lng,
      sharePct: Number(m.share_pct),
      volumeTonnes: m.volume_tonnes,
      certifications: links.data
        .filter((l) => l.market_id === m.id)
        .map((l) => l.certification_id)
        .sort(byOrder(certOrder)),
      topCuts: catalog.cuts
        .filter((c) => c.markets.includes(m.id))
        .sort((a, b) => Number(b.featured) - Number(a.featured))
        .slice(0, 3)
        .map((c) => ({ id: c.id, name: c.name, species: c.species, slug: c.slug })),
    })),
  };
}
