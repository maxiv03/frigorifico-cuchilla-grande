import { getLocale, getTranslations } from "next-intl/server";
import { IconArrowRight } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { getInstitutional } from "@/lib/data/institutional";
import { formatShare } from "@/lib/format";

/** Adelanto de mercados: los 5 principales con barras simples y link al mapa. */
export async function MarketsPreview() {
  const locale = await getLocale();
  const t = await getTranslations("Home.marketsPreview");
  const { markets } = await getInstitutional(locale);
  const top = [...markets].sort((a, b) => b.sharePct - a.sharePct).slice(0, 5);
  const max = top[0]?.sharePct ?? 100;

  return (
    <Section aria-labelledby="mercados">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeader id="mercados" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
          <ButtonLink href="/markets" variant="secondary" icon={<IconArrowRight />} className="mt-8">
            {t("cta")}
          </ButtonLink>
        </div>
        <ol data-market-preview className="space-y-5 lg:col-span-7">
          {top.map((m) => (
            <li key={m.id}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold text-ink">{m.name}</span>
                <span data-share className="font-serif text-xl font-semibold text-brand-700 tabular-nums">{formatShare(m.sharePct, locale)}</span>
              </div>
              <div aria-hidden="true" className="mt-2 h-3 rounded-full bg-earth-100">
                <div className="h-3 rounded-full bg-brand-700" style={{ width: `${(m.sharePct / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
