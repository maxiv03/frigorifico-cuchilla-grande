import { getLocale, getTranslations } from "next-intl/server";
import { IconMinus, IconTrendDown, IconTrendUp } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import type { PriceRow } from "@/lib/data/prices";
import { formatChange } from "@/lib/format";

/** Variación semanal de una categoría: ícono + texto (nunca solo color). */
export async function PriceChange({ row, className }: { row: PriceRow; className?: string }) {
  const t = await getTranslations("Home.prices");
  const locale = await getLocale();
  if (row.changePct === null || row.changePct === 0) {
    return (
      <p className={cn("flex items-center gap-1.5 text-sm text-ink-muted", className)}>
        <IconMinus width={16} height={16} />
        {t("noChange")}
      </p>
    );
  }
  const up = row.changePct > 0;
  return (
    <p className={cn("flex items-center gap-1.5 text-sm font-semibold", up ? "text-up" : "text-down", className)}>
      {up ? <IconTrendUp width={16} height={16} /> : <IconTrendDown width={16} height={16} />}
      <span className="sr-only">{up ? t("up") : t("down")}</span>
      {t("change", { change: formatChange(row.changePct, locale) })}
    </p>
  );
}
