import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";
import { IconDocument, IconFactory, IconHandshake, IconPhone, IconTruck, IconUserCheck, IconWhatsApp } from "@/components/icons";
import { Calculator, type CalculatorCategory } from "@/components/producers/calculator";
import { FullBoard } from "@/components/producers/full-board";
import { OfferProvider } from "@/components/producers/offer-context";
import { OfferForm } from "@/components/producers/offer-form";
import { PriceChart } from "@/components/producers/price-chart";
import { SpeciesToggle } from "@/components/producers/species-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { company } from "@/data/company";
import { whatsappUrl } from "@/lib/contact";
import { getPriceBoard, getPriceHistory } from "@/lib/data/prices";
import { staticPageMetadata } from "@/lib/metadata";

type IconT = ComponentType<SVGProps<SVGSVGElement>>;

/** Cómo venderle al frigorífico: cinco pasos. */
const STEPS = [
  ["offer", IconPhone],
  ["visit", IconUserCheck],
  ["agreement", IconHandshake],
  ["transport", IconTruck],
  ["settlement", IconFactory],
] as const satisfies readonly (readonly [string, IconT])[];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Producers");
  return staticPageMetadata(locale, "/producers", t("metaTitle"), t("metaDescription"));
}

/**
 * Portal de productores. Pizarra y gráfico en el HTML estático (datos en 'use cache', fuera de
 * <Suspense>); calculadora y formulario en el cliente, unidos por <OfferProvider>.
 */
export default async function ProducersPage() {
  const locale = await getLocale();
  const t = await getTranslations("Producers");
  const th = await getTranslations("Home.prices");
  let board = null;
  let history = null;
  try {
    [board, history] = await Promise.all([getPriceBoard(locale), getPriceHistory(12)]);
  } catch (error) {
    console.error(error);
  }

  const sections = [
    ["board", t("board.title")],
    ["calculator", t("calculator.title")],
    ["how-to-sell", t("steps.title")],
    ["buyers", t("buyers.title")],
    ["offer", t("form.title")],
  ] as const;

  const categories: CalculatorCategory[] = (board?.rows ?? []).map((r) => ({
    id: r.categoryId,
    name: r.name,
    species: r.species,
    price: r.price,
    yieldPct: r.yieldPct,
  }));

  return (
    <>
      <Section tone="muted" className="lg:pt-16 lg:pb-20">
        <SectionHeader eyebrow={t("eyebrow")} as="h1" title={t("title")} lead={t("lead")} />
        <nav aria-label={t("sectionsLabel")} className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {sections.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-earth-50 hover:ring-earth-300"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      {/* Pizarra completa + gráfico de 12 semanas */}
      <Section aria-labelledby="board">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader id="board" title={t("board.title")} lead={t("board.lead")} />
          <Badge tone="earth" className="self-start text-sm lg:self-auto" data-fictitious>
            {th("fictitious")}
          </Badge>
        </div>
        {board && history ? (
          <>
            <p className="mt-8 text-sm font-semibold text-ink-muted">{th("asOf", { date: new Date(`${board.weekStart}T12:00:00Z`) })}</p>
            <div className="mt-4">
              <FullBoard board={board} />
            </div>
            <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-12">
              {/* min-w-0: el gráfico tiene ancho mínimo y se desplaza dentro de su caja, sin estirar la grilla */}
              <div className="min-w-0 lg:col-span-8">
                <h3 className="font-sans text-xl font-semibold text-ink">{t("chart.heading")}</h3>
                <div className="mt-4">
                  <SpeciesToggle
                    groupLabel={t("chart.toggleLabel")}
                    labels={{ beef: t("chart.species.beef"), lamb: t("chart.species.lamb") }}
                    panels={{
                      beef: <PriceChart species="beef" rows={board.rows} history={history} />,
                      lamb: <PriceChart species="lamb" rows={board.rows} history={history} />,
                    }}
                  />
                </div>
              </div>
              <aside aria-labelledby="unit-title" className="self-start rounded-lg bg-earth-50 p-6 ring-1 ring-earth-200 lg:col-span-4">
                <h3 id="unit-title" className="font-sans text-lg font-semibold text-ink">
                  {t("board.unitTitle")}
                </h3>
                <p className="mt-2 leading-relaxed text-ink-muted">{t("board.unitText")}</p>
                <p className="mt-3 leading-relaxed text-ink-muted">{t("board.finalPrice")}</p>
              </aside>
            </div>
          </>
        ) : (
          <p className="mt-10 text-ink-muted">{th("unavailable")}</p>
        )}
      </Section>

      <OfferProvider>
        {/* Calculadora */}
        <Section tone="muted" aria-labelledby="calculator">
          <SectionHeader id="calculator" title={t("calculator.title")} lead={t("calculator.lead")} />
          <div className="mt-10">
            {board ? <Calculator categories={categories} weekStart={board.weekStart} /> : <p className="text-ink-muted">{th("unavailable")}</p>}
          </div>
        </Section>

        {/* Cómo venderle al frigorífico */}
        <Section aria-labelledby="how-to-sell">
          <SectionHeader id="how-to-sell" title={t("steps.title")} lead={t("steps.lead")} />
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(([key, Icon], i) => (
              <li key={key} className="flex flex-col rounded-lg bg-surface-muted p-6 ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-full bg-earth-700 text-white">
                    <Icon width={24} height={24} />
                  </span>
                  <span aria-hidden="true" className="font-serif text-4xl font-semibold text-earth-300 tabular-nums">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-sans text-lg font-semibold text-ink">
                  <span className="sr-only">{t("steps.stepLabel", { n: String(i + 1), total: String(STEPS.length) })}: </span>
                  {t(`steps.items.${key}.title`)}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">{t(`steps.items.${key}.text`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-start gap-2 text-sm text-ink-muted">
            <IconDocument width={18} height={18} className="mt-0.5 shrink-0 text-earth-700" />
            {t("steps.note")}
          </p>
        </Section>

        {/* Compradores de hacienda */}
        <Section tone="muted" aria-labelledby="buyers">
          <SectionHeader id="buyers" title={t("buyers.title")} lead={t("buyers.lead")} />
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {company.people.livestockBuyers.map((b) => (
              <li key={b.name} data-buyer className="flex flex-col gap-5 rounded-lg bg-surface p-6 shadow-card ring-1 ring-line sm:flex-row sm:items-start">
                <span
                  aria-hidden="true"
                  className="flex size-16 shrink-0 items-center justify-center rounded-full bg-earth-700 font-serif text-xl font-semibold text-white"
                >
                  {initials(b.name)}
                </span>
                <div className="flex-1">
                  <h3 className="font-sans text-lg font-semibold text-ink">{b.name}</h3>
                  <p className="text-sm font-semibold text-earth-700">{b.role[locale]}</p>
                  <p className="mt-3 text-ink-muted">
                    <span className="font-semibold text-ink">{t("buyers.zone")}:</span> {b.zone[locale]}
                  </p>
                  <p className="mt-1 text-ink-muted">{b.bio[locale]}</p>
                  <a
                    href={whatsappUrl(t("buyers.whatsappMessage", { buyer: b.name }))}
                    target="_blank"
                    rel="noopener"
                    className={buttonClasses({ variant: "earth" }, "mt-5")}
                  >
                    <IconWhatsApp />
                    {t("buyers.whatsapp", { buyer: b.name.split(" ")[0] })}
                    <span className="sr-only"> {t("buyers.whatsappHint")}</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-subtle">{t("buyers.note")}</p>
        </Section>

        {/* Formulario "Ofrecer ganado" */}
        <Section aria-labelledby="offer">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <header className="lg:col-span-4">
              <h2 id="offer" tabIndex={-1} className="text-3xl leading-tight font-semibold text-ink outline-none sm:text-4xl">
                {t("form.title")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-muted">{t("form.lead")}</p>
            </header>
            <div className="lg:col-span-8">
              <OfferForm categories={categories.map(({ id, name, species }) => ({ id, name, species }))} />
            </div>
          </div>
        </Section>
      </OfferProvider>
    </>
  );
}

/** "Andrés Píriz" → "AP" */
function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
