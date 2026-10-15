import { getLocale, getTranslations } from "next-intl/server";
import { CutCard } from "@/components/cuts/cut-card";
import { IconArrowRight } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { contactInfo } from "@/lib/contact";
import { getCatalog } from "@/lib/data/catalog";

/** Cortes destacados (flag `featured` en el seed) con link al catálogo. */
export async function FeaturedCuts() {
  const locale = await getLocale();
  const t = await getTranslations("Featured");
  const catalog = await getCatalog(locale);
  const zoneNames = new Map(catalog.zones.map((z) => [`${z.species}:${z.key}`, z.name]));
  const featured = catalog.cuts.filter((c) => c.featured).slice(0, 6);
  const { email } = contactInfo();
  if (featured.length === 0) return null;

  return (
    <Section aria-labelledby="destacados">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader id="destacados" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ButtonLink href="/products" variant="secondary" icon={<IconArrowRight />} className="self-start lg:self-auto">
          {t("cta")}
        </ButtonLink>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((c) => (
          <li key={c.id} className="flex">
            <CutCard
              cut={{ ...c, zoneName: zoneNames.get(`${c.species}:${c.zone}`) ?? c.zone }}
              email={email}
              visual="photo"
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
