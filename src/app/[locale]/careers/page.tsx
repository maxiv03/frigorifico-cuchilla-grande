import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";
import {
  IconBriefcase,
  IconCheck,
  IconClipboard,
  IconFactory,
  IconMail,
  IconShieldCheck,
  IconSnowflake,
  IconTruck,
  IconUsers,
} from "@/components/icons";
import { ButtonAnchor } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { company } from "@/data/company";
import { contactInfo, mailtoUrl } from "@/lib/contact";
import { formatFigure } from "@/lib/format";
import { staticPageMetadata } from "@/lib/metadata";

type IconT = ComponentType<SVGProps<SVGSVGElement>>;

/** Áreas de trabajo de la planta. */
const AREAS = [
  ["production", IconFactory],
  ["quality", IconShieldCheck],
  ["maintenance", IconSnowflake],
  ["livestock", IconUsers],
  ["logistics", IconTruck],
  ["office", IconBriefcase],
] as const satisfies readonly (readonly [string, IconT])[];

const BENEFITS = ["transport", "canteen", "training", "health", "uniform", "internal"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Careers");
  return staticPageMetadata(locale, "/careers", t("metaTitle"), t("metaDescription"));
}

/** Trabajá con nosotros: institucional, áreas, beneficios y mail para postularse (sin subida de CV). */
export default async function CareersPage() {
  const locale = await getLocale();
  const t = await getTranslations("Careers");
  const { email } = contactInfo();
  const employees = formatFigure(company.figures.employees, locale);

  return (
    <>
      <Section tone="muted" className="lg:pt-16 lg:pb-20">
        <SectionHeader eyebrow={t("eyebrow")} as="h1" title={t("title")} lead={t("lead", { employees })} />
      </Section>

      <Section aria-labelledby="areas">
        <SectionHeader id="areas" title={t("areas.title")} lead={t("areas.lead")} />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map(([key, Icon]) => (
            <li key={key} data-area={key} className="rounded-lg bg-surface p-6 shadow-card ring-1 ring-line">
              <span className="inline-flex size-11 items-center justify-center rounded-md bg-earth-100 text-earth-800">
                <Icon width={22} height={22} />
              </span>
              <h3 className="mt-4 font-sans text-lg font-semibold text-ink">{t(`areas.items.${key}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{t(`areas.items.${key}.text`)}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" aria-labelledby="benefits">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeader id="benefits" title={t("benefits.title")} lead={t("benefits.lead")} />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {BENEFITS.map((key) => (
              <li key={key} className="flex gap-3 rounded-lg bg-surface p-5 ring-1 ring-line">
                <IconCheck className="mt-0.5 shrink-0 text-up" />
                <div>
                  <p className="font-semibold text-ink">{t(`benefits.items.${key}.title`)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(`benefits.items.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section aria-labelledby="apply">
        <div className="grid gap-8 rounded-lg bg-brand-800 p-8 text-white sm:p-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <h2 id="apply" className="font-serif text-2xl font-semibold sm:text-3xl">
              {t("apply.title")}
            </h2>
            <p className="mt-3 leading-relaxed text-brand-100">{t("apply.text")}</p>
            <ul className="mt-5 space-y-2 text-brand-100">
              {(["one", "two", "three"] as const).map((k) => (
                <li key={k} className="flex gap-2">
                  <IconClipboard width={18} height={18} className="mt-0.5 shrink-0 text-earth-300" />
                  {t(`apply.steps.${k}`)}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-brand-100">{t("apply.demo")}</p>
          </div>
          <div className="lg:col-span-4 lg:justify-self-end">
            <ButtonAnchor href={mailtoUrl(t("apply.subject"))} variant="earth" icon={<IconMail />} data-apply>
              {t("apply.cta")}
            </ButtonAnchor>
            <p className="mt-3 text-sm break-all text-brand-100">{email}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
