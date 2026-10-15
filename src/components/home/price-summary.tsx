import { getLocale, getTranslations } from "next-intl/server";
import { IconArrowRight, IconMinus, IconTrendDown, IconTrendUp } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Section, SectionHeader } from "@/components/ui/section";
import { isEnabled } from "@/config/navigation";
import { getPriceBoard, type PriceRow } from "@/lib/data/prices";
import { formatChange, formatPrice } from "@/lib/format";

/** Categorías que muestra el resumen de la home (la pizarra completa llega en la fase 4). */
const HOME_CATEGORIES = ["steer", "heifer", "cow", "heavy_lamb"];

export async function PriceSummary() {
  const t = await getTranslations("Home.prices");
  return (
    <Section aria-labelledby="pizarra">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader id="pizarra" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <Badge tone="earth" className="self-start lg:self-auto">
          {t("fictitious")}
        </Badge>
      </div>
      {/* Sin <Suspense>: getPriceBoard está en 'use cache', así que la pizarra queda dentro del
          HTML estático. Con Suspense, React la "outlinea" al final del documento (el shell supera
          progressiveChunkSize, 12,8 KB) y el HTML inicial solo trae el fallback. */}
      <Board />
    </Section>
  );
}

async function Board() {
  const t = await getTranslations("Home.prices");
  const locale = await getLocale();
  let board = null;
  try {
    board = await getPriceBoard(locale);
  } catch (error) {
    console.error(error);
  }
  if (!board) return <p className="mt-10 text-ink-muted">{t("unavailable")}</p>;

  const rows = HOME_CATEGORIES.map((id) => board.rows.find((r) => r.categoryId === id)).filter(
    (r): r is PriceRow => !!r,
  );

  return (
    <div className="mt-10">
      <p className="text-sm font-semibold text-ink-muted">
        {t("asOf", { date: new Date(`${board.weekStart}T12:00:00Z`) })}
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => (
          <li key={r.categoryId} data-category={r.categoryId} className="rounded-lg bg-surface p-5 shadow-card ring-1 ring-line">
            <p className="font-semibold text-ink">{r.name}</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-4xl font-semibold text-ink tabular-nums">{formatPrice(r.price, locale)}</span>
              <span className="text-sm text-ink-muted">{t("unit")}</span>
            </p>
            <Change row={r} locale={locale} />
          </li>
        ))}
      </ul>
      {isEnabled("producers") && (
        <div className="mt-8">
          <ButtonLink href="/producers" variant="secondary" icon={<IconArrowRight />}>
            {t("seeFull")}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

async function Change({ row, locale }: { row: PriceRow; locale: Parameters<typeof formatChange>[1] }) {
  const t = await getTranslations("Home.prices");
  if (row.changePct === null || row.changePct === 0) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted">
        <IconMinus width={16} height={16} />
        {t("noChange")}
      </p>
    );
  }
  const up = row.changePct > 0;
  return (
    <p className={cn("mt-3 flex items-center gap-1.5 text-sm font-semibold", up ? "text-up" : "text-down")}>
      {up ? <IconTrendUp width={16} height={16} /> : <IconTrendDown width={16} height={16} />}
      <span className="sr-only">{up ? t("up") : t("down")}</span>
      {t("change", { change: formatChange(row.changePct, locale) })}
    </p>
  );
}
