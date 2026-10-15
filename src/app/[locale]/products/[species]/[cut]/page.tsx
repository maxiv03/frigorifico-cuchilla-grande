import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CutCard } from "@/components/cuts/cut-card";
import { CutDiagram } from "@/components/cuts/cut-diagram";
import { PresentationSpecs } from "@/components/cuts/presentation-specs";
import { SetAlternates } from "@/components/i18n/alternates";
import { IconMail } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getPathname, Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cutImage } from "@/lib/catalog/images";
import { speciesFromSlug, speciesSlugs } from "@/lib/catalog/species";
import type { Species } from "@/lib/catalog/types";
import { contactInfo, mailtoUrl } from "@/lib/contact";
import { getCatalog, getCutSlugs, type CatalogCut } from "@/lib/data/catalog";

type Params = { locale: string; species: string; cut: string };

/**
 * La página lee `params` fuera de <Suspense> a propósito: todos los cortes se prerenderizan
 * (generateStaticParams) y así el contenido queda dentro del HTML estático. Con Suspense,
 * React lo movería al final del documento (ver CLAUDE.md, "progressiveChunkSize"). La
 * navegación espera el payload estático del corte, que es chico.
 */
export const instant = false;

/** Todos los cortes en todos los idiomas, prerenderizados en el build. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const { cuts } = await getCatalog(locale);
  return cuts.map((c) => ({ species: speciesSlugs[c.species][locale], cut: c.slug }));
}

async function load(params: Promise<Params>) {
  const { locale: l, species: speciesSlug, cut: slug } = await params;
  const locale = l as Locale;
  const species = speciesFromSlug(locale, speciesSlug);
  if (!species) notFound();
  const catalog = await getCatalog(locale);
  const cut = catalog.cuts.find((c) => c.species === species && c.slug === slug);
  if (!cut) notFound();
  const slugs = (await getCutSlugs())[cut.id];
  // Ruta del mismo corte en cada idioma (slug y especie traducidos).
  const hrefs = Object.fromEntries(
    routing.locales.map((other) => [
      other,
      getPathname({
        locale: other,
        href: { pathname: "/products/[species]/[cut]", params: { species: speciesSlugs[species][other], cut: slugs?.[other] ?? slug } },
      }),
    ]),
  ) as Record<Locale, string>;
  return { locale, species, cut, catalog, hrefs };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, species, cut, hrefs } = await load(params);
  const t = await getTranslations({ locale, namespace: "Products" });
  const image = cutImage(cut.image, species);
  const title = t("detail.metaTitle", { cut: cut.alias ? `${cut.name} (${cut.alias})` : cut.name, species: t(`species.${species}`) });
  return {
    title,
    description: cut.description,
    alternates: { canonical: hrefs[locale], languages: { ...hrefs, "x-default": hrefs[routing.defaultLocale] } },
    openGraph: { title, description: cut.description, images: image ? [image.src.src] : undefined },
  };
}

export default async function CutPage({ params }: { params: Promise<Params> }) {
  const { locale, species, cut, catalog, hrefs } = await load(params);
  const t = await getTranslations({ locale, namespace: "Products" });
  const tNav = await getTranslations({ locale, namespace: "Nav" });
  const zone = catalog.zones.find((z) => z.species === species && z.key === cut.zone);
  const zoneName = zone?.name ?? cut.zone;
  const marketNames = new Map(catalog.markets.map((m) => [m.id, m.name]));
  const image = cutImage(cut.image, species);
  const { email } = contactInfo();
  const sameZone = catalog.cuts.filter((c) => c.species === species && c.zone === cut.zone && c.id !== cut.id);
  const speciesName = t(`species.${species}`);
  const toCard = (c: CatalogCut) => ({ ...c, zoneName });
  const diagramLabel = t("detail.diagramLabel", { species: t(`detail.speciesInline.${species}`), zone: zoneName });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: tNav("home"), path: getPathname({ locale, href: "/" }) },
      { name: tNav("products"), path: getPathname({ locale, href: "/products" }) },
      { name: cut.name, path: hrefs[locale] },
    ].map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: new URL(item.path, site).toString() })),
  };

  return (
    <>
      <SetAlternates hrefs={hrefs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="border-b border-line bg-surface-muted">
        <Container>
          <nav aria-label={t("detail.breadcrumb")} className="py-4 text-sm">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
              <li>
                <Link href="/" className="hover:text-brand-700 hover:underline">
                  {tNav("home")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/products" className="hover:text-brand-700 hover:underline">
                  {tNav("products")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={{ pathname: "/products", query: species === "beef" ? {} : { species } }}
                  className="hover:text-brand-700 hover:underline"
                >
                  {speciesName}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-semibold text-ink">
                {cut.name}
              </li>
            </ol>
          </nav>
        </Container>
      </div>

      <Section className="lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            {/* Foto de la pieza si hay una adecuada; si no, la ilustración grande de la zona. */}
            {image ? (
              <>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-raised">
                  <Image
                    src={image.src}
                    alt={t(`images.${image.key}`)}
                    fill
                    placeholder="blur"
                    loading="eager"
                    fetchPriority="high"
                    sizes="(min-width: 1216px) 560px, (min-width: 1024px) 46vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-6 rounded-lg bg-surface-muted p-4 ring-1 ring-line sm:p-6">
                  <DetailDiagram
                    species={species}
                    zone={cut.zone}
                    zones={catalog.zones.filter((z) => z.species === species)}
                    label={diagramLabel}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-surface-muted px-4 py-8 ring-1 ring-line sm:px-8 sm:py-12">
                <DetailDiagram
                  species={species}
                  zone={cut.zone}
                  zones={catalog.zones.filter((z) => z.species === species)}
                  label={diagramLabel}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-6">
            <p className="text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">
              {speciesName} · {zoneName}
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold text-ink sm:text-5xl">{cut.name}</h1>
            {cut.alias && <p className="mt-2 text-lg text-ink-muted">{t("detail.alias", { alias: cut.alias })}</p>}
            <p className="mt-6 text-lg leading-relaxed text-ink-muted">{cut.description}</p>

            <h2 className="mt-10 font-serif text-xl font-semibold text-ink">{t("detail.dataTitle")}</h2>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              <Row label={t("detail.zone")}>{zoneName}</Row>
              <Row label={t("detail.bone")}>
                <Badge tone="neutral">{t(`bone.${cut.bone}`)}</Badge>
              </Row>
              <Row label={t("detail.presentations")}>
                <span className="flex flex-wrap gap-1.5">
                  {cut.presentations.map((p) => (
                    <Badge key={p} tone="earth">
                      {t(`presentation.${p}`)}
                    </Badge>
                  ))}
                </span>
              </Row>
              <Row label={t("detail.markets")}>{cut.markets.map((m) => marketNames.get(m) ?? m).join(" · ")}</Row>
            </dl>

            <PresentationSpecs only={cut.presentations} className="mt-6" />

            <div className="mt-8 rounded-lg bg-brand-800 p-6 text-white">
              <h2 className="font-serif text-xl font-semibold">{t("detail.quoteTitle")}</h2>
              <p className="mt-2 text-brand-100">{t("detail.quoteText")}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <ButtonAnchor
                  href={mailtoUrl(t("card.quoteSubject", { cut: cut.name, species: speciesName }))}
                  variant="earth"
                  icon={<IconMail />}
                >
                  {t("card.quote")}
                </ButtonAnchor>
                <ButtonLink
                  href={{ pathname: "/products", query: species === "beef" ? {} : { species } }}
                  variant="outlineLight"
                >
                  {t("detail.back")}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {sameZone.length > 0 && (
        <Section tone="muted" aria-labelledby="misma-zona">
          <h2 id="misma-zona" className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            {t("detail.sameZone", { zone: zoneName })}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sameZone.map((c) => (
              <li key={c.id} className="flex">
                <CutCard cut={toCard(c)} email={email} className="w-full" />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm font-semibold text-ink">{label}</dt>
      <dd className="col-span-2 text-ink-muted">{children}</dd>
    </div>
  );
}

function DetailDiagram({
  species,
  zone,
  zones,
  label,
}: {
  species: Species;
  zone: string;
  zones: { key: string; name: string }[];
  label: string;
}) {
  return (
    <CutDiagram
      species={species}
      selected={zone}
      label={label}
      zones={zones.map((z) => ({ key: z.key, name: z.name, label: z.name }))}
      showLabels="selected"
    />
  );
}
