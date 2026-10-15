import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";
import { FiguresBand } from "@/components/home/figures-band";
import { IconCuts, IconFactory, IconShip, IconSnowflake, IconTruck } from "@/components/icons";
import { Section, SectionHeader } from "@/components/ui/section";
import { company } from "@/data/company";
import { formatFigure } from "@/lib/format";
import { staticPageMetadata } from "@/lib/metadata";

type IconT = ComponentType<SVGProps<SVGSVGElement>>;

/** Recorrido de la planta. "Faena" se ilustra con el edificio (instalaciones), nada explícito. */
const STAGES = [
  ["reception", IconTruck],
  ["slaughter", IconFactory],
  ["boning", IconCuts],
  ["cold", IconSnowflake],
  ["shipping", IconShip],
] as const satisfies readonly (readonly [string, IconT])[];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Company");
  return staticPageMetadata(locale, "/company", t("metaTitle"), t("metaDescription", { founded: String(company.founded) }));
}

export default async function CompanyPage() {
  const locale = await getLocale();
  const t = await getTranslations("Company");
  const { founded, foundingFamily, figures, timeline, people } = company;
  const team = [people.ceo, people.commercial, ...people.livestockBuyers];

  return (
    <>
      <Section tone="muted" className="lg:pt-16 lg:pb-20">
        <SectionHeader
          eyebrow={t("eyebrow")}
          as="h1"
          title={t("title")}
          lead={t("lead", {
            founded: String(founded),
            family: foundingFamily,
            countries: formatFigure(figures.countries, locale),
            employees: formatFigure(figures.employees, locale),
          })}
        />
      </Section>

      <FiguresBand />

      {/* Historia */}
      <Section aria-labelledby="historia">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <SectionHeader id="historia" title={t("history.title")} lead={t("history.lead")} className="lg:col-span-4" />
          <ol className="relative border-l-2 border-earth-300 lg:col-span-8">
            {timeline.map((item) => (
              <li key={item.year} className="relative pb-9 pl-8 last:pb-0">
                <span aria-hidden="true" className="absolute top-1.5 -left-[9px] size-4 rounded-full border-2 border-surface bg-brand-700" />
                <p className="font-serif text-2xl font-semibold text-brand-700 tabular-nums">{item.year}</p>
                <h3 className="mt-1 font-sans text-lg font-semibold text-ink">{item.title[locale]}</h3>
                <p className="mt-1 max-w-2xl leading-relaxed text-ink-muted">{item.text[locale]}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Recorrido por la planta */}
      <Section tone="muted" aria-labelledby="planta">
        <SectionHeader id="planta" title={t("plant.title")} lead={t("plant.lead")} />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map(([key, Icon], i) => (
            <li key={key} className="relative flex flex-col rounded-lg bg-surface p-6 shadow-card ring-1 ring-line">
              <div className="flex items-center justify-between">
                <span className="flex size-14 items-center justify-center rounded-full bg-earth-100 text-earth-800">
                  <Icon width={30} height={30} />
                </span>
                <span className="font-serif text-4xl font-semibold text-earth-300 tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-sans text-lg font-semibold text-ink">
                <span className="sr-only">{t("plant.stageLabel", { n: String(i + 1), total: String(STAGES.length) })}: </span>
                {t(`plant.stages.${key}.title`)}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
                {t(`plant.stages.${key}.text`, { tonnes: formatFigure(figures.frozenStorageTonnes, locale) })}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Equipo */}
      <Section aria-labelledby="equipo">
        <SectionHeader id="equipo" title={t("team.title")} lead={t("team.lead")} />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((person) => (
            <li key={person.name} className="rounded-lg bg-surface-muted p-6 ring-1 ring-line">
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-full bg-brand-700 font-serif text-xl font-semibold text-white"
              >
                {initials(person.name)}
              </span>
              <h3 className="mt-5 font-sans text-lg font-semibold text-ink">{person.name}</h3>
              <p className="text-sm font-semibold text-earth-700">{person.role[locale]}</p>
              <p className="mt-3 leading-relaxed text-ink-muted">{person.bio[locale]}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-subtle">{t("team.note")}</p>
      </Section>
    </>
  );
}

/** "Lucía Iturralde" → "LI" */
function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
