import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { WorldMap } from "@/components/markets/world-map";
import { Section, SectionHeader } from "@/components/ui/section";
import { company } from "@/data/company";
import { Link } from "@/i18n/navigation";
import { speciesSlugs } from "@/lib/catalog/species";
import { getInstitutional } from "@/lib/data/institutional";
import { formatFigure, formatShare } from "@/lib/format";
import { staticPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Markets");
  return staticPageMetadata(locale, "/markets", t("metaTitle"), t("metaDescription"));
}

export default async function MarketsPage() {
  const locale = await getLocale();
  const t = await getTranslations("Markets");
  const { markets, certifications } = await getInstitutional(locale);
  const certName = new Map(certifications.map((c) => [c.id, c.name]));
  const { figures } = company;
  const sorted = [...markets].sort((a, b) => b.sharePct - a.sharePct);
  const othersPct = 100 - markets.reduce((sum, m) => sum + m.sharePct, 0);
  const maxPct = sorted[0]?.sharePct ?? 100;

  return (
    <>
      <Section tone="muted" className="lg:pt-16 lg:pb-16">
        <SectionHeader
          eyebrow={t("eyebrow")}
          as="h1"
          title={t("title", { countries: formatFigure(figures.countries, locale) })}
          lead={t("lead", { share: formatShare(figures.exportSharePct, locale) })}
        />
      </Section>

      <Section aria-labelledby="mapa" className="lg:pt-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="mapa" className="text-2xl font-semibold text-ink sm:text-3xl">
            {t("map.title")}
          </h2>
        </div>
        <p className="mt-2 max-w-3xl text-ink-muted">{t("map.hint")}</p>
        <div className="mt-8">
          {/* SVG renderizado en el servidor: sin reserva ni salto de layout; el cliente solo agrega la interacción. */}
          <WorldMap markets={sorted} certifications={certifications} />
        </div>
      </Section>

      {/* Vía accesible principal: la misma información que el mapa, en una lista */}
      <Section tone="muted" aria-labelledby="destinos">
        <SectionHeader id="destinos" title={t("list.title")} lead={t("list.lead")} />
        <ol className="mt-10 grid gap-5 lg:grid-cols-2">
          {sorted.map((m) => (
            <li
              key={m.id}
              id={`market-${m.id}`}
              tabIndex={-1}
              data-market-row={m.id}
              className="rounded-lg bg-surface p-6 shadow-card ring-1 ring-line outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-semibold text-ink">{m.name}</h3>
                <p className="font-serif text-3xl font-semibold text-brand-700 tabular-nums">
                  <span className="sr-only">{t("list.share")}: </span>
                  <span data-share>{formatShare(m.sharePct, locale)}</span>
                </p>
              </div>
              <div aria-hidden="true" className="mt-3 h-2 rounded-full bg-earth-100">
                <div className="h-2 rounded-full bg-brand-700" style={{ width: `${(m.sharePct / maxPct) * 100}%` }} />
              </div>
              <p className="mt-4 leading-relaxed text-ink-muted">{m.description}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-ink">{t("list.volume")}</dt>
                  <dd className="text-ink-muted tabular-nums">{t("list.volumeValue", { tonnes: formatFigure(m.volumeTonnes, locale) })}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">{t("topCuts")}</dt>
                  <dd>
                    <ul>
                      {m.topCuts.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={{ pathname: "/products/[species]/[cut]", params: { species: speciesSlugs[c.species][locale], cut: c.slug } }}
                            className="text-brand-700 underline-offset-2 hover:underline"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">{t("certifications")}</dt>
                  <dd>
                    <ul>
                      {m.certifications.map((id) => (
                        <li key={id}>
                          <Link href={{ pathname: "/quality", hash: `cert-${id}` }} className="text-brand-700 underline-offset-2 hover:underline">
                            {certName.get(id) ?? id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
              <Link
                href={{ pathname: "/products", query: { market: m.id } }}
                className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-4"
              >
                {t("catalogLink", { market: m.name })}
              </Link>
            </li>
          ))}
        </ol>
        {othersPct > 0 && (
          <p className="mt-6 text-ink-muted">
            {t("list.others", { countries: formatFigure(figures.countries, locale), share: formatShare(othersPct, locale) })}
          </p>
        )}
      </Section>
    </>
  );
}
