import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CatalogFromUrl, CatalogStatic, type CatalogProps } from "@/components/cuts/catalog";
import { PresentationSpecs } from "@/components/cuts/presentation-specs";
import { Section, SectionHeader } from "@/components/ui/section";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCatalog } from "@/lib/data/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Products");
  const languages = Object.fromEntries(routing.locales.map((l) => [l, getPathname({ locale: l, href: "/products" })]));
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: languages[locale], languages: { ...languages, "x-default": languages[routing.defaultLocale] } },
  };
}

export default async function ProductsPage({ searchParams }: PageProps<"/[locale]/products">) {
  const locale = await getLocale();
  const t = await getTranslations("Products");
  const catalog = await getCatalog(locale);
  const zoneNames = new Map(catalog.zones.map((z) => [`${z.species}:${z.key}`, z.name]));

  const props: CatalogProps = {
    cuts: catalog.cuts.map((c) => ({
      id: c.id,
      species: c.species,
      zone: c.zone,
      zoneName: zoneNames.get(`${c.species}:${c.zone}`) ?? c.zone,
      bone: c.bone,
      presentations: c.presentations,
      image: c.image,
      slug: c.slug,
      name: c.name,
      alias: c.alias,
      markets: c.markets,
    })),
    zones: catalog.zones,
    markets: catalog.markets,
    aside: <PresentationSpecs />,
    asideCollapsed: <PresentationSpecs collapsible />,
  };

  return (
    <Section tone="muted" className="lg:pt-16">
      <SectionHeader eyebrow={t("eyebrow")} as="h1" title={t("title")} lead={t("lead")} />
      <div className="mt-10">
        {/* Los filtros viven en la URL. El fallback (shell estático) es el catálogo vacuno sin
            filtros, así el HTML cacheado ya trae todos los cortes; el límite dinámico renderiza
            en el servidor la vista filtrada de cada URL (?species=lamb&zone=leg…). */}
        <Suspense fallback={<CatalogStatic {...props} />}>
          <FilteredCatalog searchParams={searchParams} {...props} />
        </Suspense>
      </div>
    </Section>
  );
}

/** Espera los searchParams (render por request) y delega en el catálogo del cliente, que
 *  desde ahí lee y actualiza la URL con useSearchParams + History API. */
async function FilteredCatalog({ searchParams, ...props }: CatalogProps & { searchParams: Promise<unknown> }) {
  await searchParams;
  return <CatalogFromUrl {...props} />;
}
