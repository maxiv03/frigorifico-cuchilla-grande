import "server-only";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { speciesFromSlug } from "@/lib/catalog/species";
import { getCatalog } from "@/lib/data/catalog";
import { getNews } from "@/lib/data/editorial";
import { formatDate } from "@/lib/format";
import { ogBrand } from "./pages";
import { renderCut, renderNews } from "./render";

/** Imagen OG de un corte (plantilla de corte: silueta con la zona resaltada). */
export async function cutOgImage(locale: Locale, speciesSlug: string, slug: string) {
  const species = speciesFromSlug(locale, speciesSlug);
  if (!species) notFound();
  const catalog = await getCatalog(locale);
  const cut = catalog.cuts.find((c) => c.species === species && c.slug === slug);
  if (!cut) notFound();
  const t = await getTranslations({ locale, namespace: "Products" });
  const zone = catalog.zones.find((z) => z.species === species && z.key === cut.zone);
  return renderCut({
    brand: await ogBrand(locale),
    species,
    speciesLabel: t(`species.${species}`),
    zoneId: cut.zone,
    zoneLabel: zone?.name ?? cut.zone,
    name: cut.name,
    alias: cut.alias,
  });
}

/** Imagen OG de una noticia (plantilla de noticia: foto, fecha y título). */
export async function newsOgImage(locale: Locale, slug: string) {
  const post = (await getNews(locale)).find((p) => p.slug === slug);
  if (!post) notFound();
  const t = await getTranslations({ locale, namespace: "News" });
  return renderNews({
    brand: await ogBrand(locale),
    kicker: t("eyebrow"),
    date: formatDate(post.publishedAt, locale),
    title: post.title,
    image: post.image || null,
  });
}
