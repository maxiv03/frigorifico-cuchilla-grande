import { useLocale, useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { company } from "@/data/company";
import { getPriceBoard, type PriceBoard } from "@/lib/data/prices";
import { formatChange, formatFigure, formatPrice } from "@/lib/format";

// Home provisoria de la fase 0: verifica i18n, datos de company.ts y lectura de Supabase.
export default function HomePage() {
  const t = useTranslations("Home");
  const f = useTranslations("Footer");
  const locale = useLocale();
  const { figures, address } = company;

  return (
    <>
      <header className="flex justify-end px-4 py-4 sm:px-8">
        <LocaleSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-8">
        <p className="text-sm font-medium tracking-wide text-[#7a1f2b] uppercase">
          {t("eyebrow", { city: address.city, department: address.department })}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">{t("title")}</h1>
        <p className="text-lg leading-8 text-stone-600">
          {t("lead", {
            cattle: formatFigure(figures.cattlePerDay, locale),
            sheep: formatFigure(figures.sheepPerDay, locale),
            countries: formatFigure(figures.countries, locale),
          })}
        </p>
        <Suspense fallback={<p className="text-sm text-stone-500">{t("pricesLoading")}</p>}>
          <PriceWeek />
        </Suspense>
      </main>
      <footer className="border-t border-stone-200 px-4 py-6 text-sm text-stone-600 sm:px-8">
        <p className="font-medium text-stone-800">{f("disclaimer")}</p>
        <p>{f("mgap", { number: company.mgapNumber })}</p>
      </footer>
    </>
  );
}

async function PriceWeek() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  let board: PriceBoard | null = null;
  try {
    board = await getPriceBoard(locale);
  } catch (error) {
    console.error(error);
  }
  if (!board) return <p className="text-sm text-stone-500">{t("pricesUnavailable")}</p>;
  return (
    <div className="text-sm text-stone-600">
      <p>{t("pricesAsOf", { date: new Date(`${board.weekStart}T12:00:00Z`) })}</p>
      <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {board.rows.map((r) => (
          <li key={r.categoryId} data-category={r.categoryId}>
            {r.name}: <strong className="text-stone-900">{formatPrice(r.price, locale)}</strong>
            {r.changePct !== null && <span className="ml-1 text-stone-500">({formatChange(r.changePct, locale)})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
