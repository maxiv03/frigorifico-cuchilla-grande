import { getLocale, getTranslations } from "next-intl/server";
import { PriceChange } from "@/components/prices/price-change";
import type { PriceBoard } from "@/lib/data/prices";
import { formatPrice } from "@/lib/format";

/** Pizarra completa: las 6 categorías agrupadas por especie, con precio y variación semanal. */
export async function FullBoard({ board }: { board: PriceBoard }) {
  const t = await getTranslations("Producers.board");
  const th = await getTranslations("Home.prices");
  const tp = await getTranslations("Producers");
  const locale = await getLocale();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {(["beef", "lamb"] as const).map((species) => (
        <div key={species}>
          <h3 className="font-sans text-sm font-semibold tracking-[0.14em] text-earth-700 uppercase">{tp(`species.${species}`)}</h3>
          <ul className="mt-3 divide-y divide-line rounded-lg bg-surface shadow-card ring-1 ring-line">
            {board.rows
              .filter((r) => r.species === species)
              .map((r) => (
                <li key={r.categoryId} data-category={r.categoryId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
                  <div>
                    <p className="font-semibold text-ink">{r.name}</p>
                    <PriceChange row={r} className="mt-1" />
                  </div>
                  <p className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-semibold text-ink tabular-nums" data-price={r.price}>
                      {formatPrice(r.price, locale)}
                    </span>
                    <span className="text-sm text-ink-muted">{th("unit")}</span>
                  </p>
                </li>
              ))}
          </ul>
        </div>
      ))}
      <p className="text-sm text-ink-muted lg:col-span-2">{t("previous")}</p>
    </div>
  );
}
