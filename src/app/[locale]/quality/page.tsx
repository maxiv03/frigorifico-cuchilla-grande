import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";
import {
  IconBarcode,
  IconClipboard,
  IconCuts,
  IconDatabase,
  IconEarTag,
  IconFactory,
  IconFlask,
  IconHand,
  IconShieldCheck,
  IconStethoscope,
  IconThermometer,
  IconTruck,
  IconWater,
} from "@/components/icons";
import { CertBadge } from "@/components/quality/cert-badge";
import { Section, SectionHeader } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { getInstitutional } from "@/lib/data/institutional";
import { staticPageMetadata } from "@/lib/metadata";

type IconT = ComponentType<SVGProps<SVGSVGElement>>;

const STEPS = [
  ["field", IconEarTag],
  ["registry", IconDatabase],
  ["reception", IconTruck],
  ["slaughter", IconFactory],
  ["boning", IconCuts],
  ["box", IconBarcode],
] as const satisfies readonly (readonly [string, IconT])[];
const WELFARE = [
  ["transport", IconTruck],
  ["rest", IconWater],
  ["handling", IconHand],
  ["stunning", IconShieldCheck],
  ["audits", IconClipboard],
] as const satisfies readonly (readonly [string, IconT])[];
const CONTROL = [
  ["vet", IconStethoscope],
  ["lab", IconFlask],
  ["cold", IconThermometer],
] as const satisfies readonly (readonly [string, IconT])[];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Quality");
  return staticPageMetadata(locale, "/quality", t("metaTitle"), t("metaDescription"));
}

export default async function QualityPage() {
  const locale = await getLocale();
  const t = await getTranslations("Quality");
  const { certifications, markets } = await getInstitutional(locale);
  const marketName = new Map(markets.map((m) => [m.id, m.name]));
  const groups = (["certification", "approval"] as const).map((kind) => ({
    kind,
    items: certifications.filter((c) => c.kind === kind),
  }));

  const sections = [
    ["certifications", t("certs.title")],
    ["traceability", t("trace.title")],
    ["welfare", t("welfare.title")],
    ["quality-control", t("control.title")],
  ] as const;

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

      {/* Certificaciones y habilitaciones sanitarias por mercado: dos grupos */}
      <Section aria-labelledby="certifications">
        <SectionHeader id="certifications" title={t("certs.title")} lead={t("certs.lead")} />
        {groups.map(({ kind, items }) => (
          <div key={kind} data-cert-group={kind} className="mt-12">
            <h3 className="font-sans text-xl font-semibold text-ink">{t(`certs.groups.${kind}.title`)}</h3>
            <p className="mt-1 max-w-3xl text-ink-muted">{t(`certs.groups.${kind}.lead`)}</p>
            <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {items.map((c) => (
                <li key={c.id} className="flex flex-col rounded-lg bg-surface p-6 shadow-card ring-1 ring-line">
                  <div className="flex items-center gap-4">
                    <CertBadge icon={c.icon} />
                    <h4 id={`cert-${c.id}`} className="text-xl leading-snug font-semibold text-ink">
                      {c.name}
                    </h4>
                  </div>
                  <p className="mt-4 leading-relaxed text-ink-muted">{c.summary}</p>
                  <div className="mt-auto pt-5">
                    <p className="text-xs font-semibold tracking-[0.12em] text-earth-700 uppercase">{t("certs.markets")}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {c.markets.map((m) => (
                        <li key={m}>
                          <Link
                            href={{ pathname: "/products", query: { market: m } }}
                            aria-label={t("certs.marketLink", { market: marketName.get(m) ?? m })}
                            className="inline-flex min-h-9 items-center rounded-full bg-brand-50 px-3 text-sm font-semibold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100"
                          >
                            {marketName.get(m) ?? m}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      {/* Trazabilidad: paso a paso */}
      <Section tone="muted" aria-labelledby="traceability">
        <SectionHeader id="traceability" title={t("trace.title")} lead={t("trace.lead")} />
        <ol className="relative mt-12 grid gap-8 lg:grid-cols-6 lg:gap-5">
          {/* Línea que une los pasos: vertical en móvil, horizontal desde lg */}
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-6 w-0.5 bg-earth-300 lg:top-6 lg:right-[8%] lg:bottom-auto lg:left-[8%] lg:h-0.5 lg:w-auto" />
          {STEPS.map(([key, Icon], i) => (
            <li key={key} className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-4 lg:text-center">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white ring-4 ring-surface-muted">
                <Icon width={24} height={24} />
                <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-surface font-sans text-xs font-bold text-brand-800 ring-1 ring-brand-200">
                  {i + 1}
                </span>
              </span>
              <div>
                <h3 className="font-sans text-lg font-semibold text-ink">{t(`trace.steps.${key}.title`)}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-muted">{t(`trace.steps.${key}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Bienestar animal */}
      <Section aria-labelledby="welfare">
        <SectionHeader id="welfare" title={t("welfare.title")} lead={t("welfare.lead")} />
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {WELFARE.map(([key, Icon]) => (
            <li key={key} className="rounded-lg bg-surface-muted p-6 ring-1 ring-line">
              <Icon width={28} height={28} className="text-earth-700" />
              <h3 className="mt-4 font-sans text-lg font-semibold text-ink">{t(`welfare.items.${key}.title`)}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">{t(`welfare.items.${key}.text`)}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Control de calidad */}
      <Section tone="muted" aria-labelledby="quality-control">
        <SectionHeader id="quality-control" title={t("control.title")} lead={t("control.lead")} />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {CONTROL.map(([key, Icon]) => (
            <li key={key} className="rounded-lg bg-surface p-6 shadow-card ring-1 ring-line">
              <span className="flex size-12 items-center justify-center rounded-md bg-earth-100 text-earth-800">
                <Icon width={26} height={26} />
              </span>
              <h3 className="mt-4 font-sans text-lg font-semibold text-ink">{t(`control.items.${key}.title`)}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{t(`control.items.${key}.text`)}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

