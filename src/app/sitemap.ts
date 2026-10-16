import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type StaticPathname } from "@/i18n/routing";
import { speciesSlugs } from "@/lib/catalog/species";
import { getCatalog, getCutSlugs } from "@/lib/data/catalog";
import { getNews, getNewsSlugs } from "@/lib/data/editorial";
import { absoluteUrl } from "@/lib/site";

/** Páginas estáticas del sitio (todas las de la navegación más la privacidad). */
const STATIC: { href: StaticPathname; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { href: "/", priority: 1, changeFrequency: "weekly" },
  { href: "/products", priority: 0.9, changeFrequency: "monthly" },
  { href: "/markets", priority: 0.7, changeFrequency: "monthly" },
  { href: "/quality", priority: 0.7, changeFrequency: "monthly" },
  { href: "/company", priority: 0.6, changeFrequency: "yearly" },
  { href: "/producers", priority: 0.8, changeFrequency: "weekly" },
  { href: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { href: "/news", priority: 0.6, changeFrequency: "weekly" },
  { href: "/sustainability", priority: 0.5, changeFrequency: "yearly" },
  { href: "/careers", priority: 0.4, changeFrequency: "yearly" },
  { href: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

type Entry = MetadataRoute.Sitemap[number];

/** Una entrada por idioma, cada una con los alternates de todos los idiomas (y x-default). */
function entries(paths: Record<Locale, string>, extra: Omit<Entry, "url" | "alternates">): Entry[] {
  const languages = Object.fromEntries([
    ...routing.locales.map((l) => [l, absoluteUrl(paths[l])]),
    ["x-default", absoluteUrl(paths[routing.defaultLocale])],
  ]);
  return routing.locales.map((l) => ({ url: absoluteUrl(paths[l]), alternates: { languages }, ...extra }));
}

/** sitemap.xml: páginas estáticas, los cortes y las noticias, con slugs traducidos y alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [];
  for (const { href, priority, changeFrequency } of STATIC) {
    const paths = Object.fromEntries(routing.locales.map((l) => [l, getPathname({ locale: l, href })])) as Record<Locale, string>;
    out.push(...entries(paths, { priority, changeFrequency }));
  }

  const [catalog, cutSlugs] = await Promise.all([getCatalog(routing.defaultLocale), getCutSlugs()]);
  for (const cut of catalog.cuts) {
    const slugs = cutSlugs[cut.id];
    if (!slugs) continue;
    const paths = Object.fromEntries(
      routing.locales.map((l) => [
        l,
        getPathname({ locale: l, href: { pathname: "/products/[species]/[cut]", params: { species: speciesSlugs[cut.species][l], cut: slugs[l] } } }),
      ]),
    ) as Record<Locale, string>;
    out.push(...entries(paths, { priority: 0.6, changeFrequency: "monthly" }));
  }

  const [news, newsSlugs] = await Promise.all([getNews(routing.defaultLocale), getNewsSlugs()]);
  for (const post of news) {
    const slugs = newsSlugs[post.id];
    if (!slugs) continue;
    const paths = Object.fromEntries(
      routing.locales.map((l) => [l, getPathname({ locale: l, href: { pathname: "/news/[slug]", params: { slug: slugs[l] } } })]),
    ) as Record<Locale, string>;
    out.push(...entries(paths, { priority: 0.5, changeFrequency: "yearly", lastModified: post.publishedAt }));
  }
  return out;
}
