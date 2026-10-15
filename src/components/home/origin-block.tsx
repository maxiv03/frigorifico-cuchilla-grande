import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Section, SectionHeader } from "@/components/ui/section";
import { company } from "@/data/company";
import { formatFigure } from "@/lib/format";
import campo from "../../../public/images/home/campo-angus-eucaliptos.jpg";

/** Bloque institucional "Desde Sarandí del Yí al mundo": texto + foto. */
export async function OriginBlock() {
  const t = await getTranslations("Home.origin");
  const locale = await getLocale();
  const { founded, foundingFamily, figures } = company;

  return (
    <Section tone="muted" aria-labelledby="origen">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <SectionHeader id="origen" eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink-muted">
            <p>
              {t("p1", {
                founded: String(founded),
                family: foundingFamily,
                hectares: formatFigure(figures.siteHectares, locale),
                employees: formatFigure(figures.employees, locale),
              })}
            </p>
            <p>{t("p2")}</p>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-raised sm:aspect-[4/3] lg:aspect-[4/5]">
            <Image
              src={campo}
              alt={t("imageAlt")}
              fill
              placeholder="blur"
              sizes="(min-width: 1216px) 560px, (min-width: 1024px) 46vw, 100vw"
              className="object-cover object-[50%_60%]"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
