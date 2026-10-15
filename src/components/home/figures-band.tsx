import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { company } from "@/data/company";
import { formatFigure } from "@/lib/format";

/** Banda de cifras clave. Todas salen de company.ts (única fuente de verdad). */
export async function FiguresBand() {
  const t = await getTranslations("Home.figures");
  const locale = await getLocale();
  const f = company.figures;

  const items = [
    { key: "cattlePerDay", value: formatFigure(f.cattlePerDay, locale) },
    { key: "sheepPerDay", value: formatFigure(f.sheepPerDay, locale) },
    { key: "countries", value: `${formatFigure(f.countries, locale)}+` },
    { key: "frozenStorage", value: formatFigure(f.frozenStorageTonnes, locale) },
    { key: "siteHectares", value: formatFigure(f.siteHectares, locale) },
    { key: "employees", value: formatFigure(f.employees, locale) },
  ] as const;

  return (
    <section aria-labelledby="cifras" className="border-b border-line bg-surface">
      <Container className="py-12 lg:py-14">
        <h2 id="cifras" className="sr-only">
          {t("title")}
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.key} className="flex flex-col gap-1 border-l-2 border-brand-700 pl-4">
              <dt className="text-sm leading-snug text-ink-muted">{t(item.key)}</dt>
              <dd className="order-first font-serif text-3xl font-semibold text-ink tabular-nums lg:text-4xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
