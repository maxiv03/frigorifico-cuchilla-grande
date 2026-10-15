import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { company } from "@/data/company";
import { getCurrentPriceWeek } from "@/lib/data/prices";

// Home provisoria de la fase 0: verifica i18n, datos de company.ts y lectura de Supabase.
export default function HomePage() {
  const t = useTranslations("Home");
  const f = useTranslations("Footer");
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
          {t("lead", { cattle: figures.cattlePerDay, sheep: figures.sheepPerDay, countries: figures.countries })}
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
  let week: string | null = null;
  try {
    week = await getCurrentPriceWeek();
  } catch (error) {
    console.error(error);
  }
  if (!week) return <p className="text-sm text-stone-500">{t("pricesUnavailable")}</p>;
  return (
    <p className="text-sm text-stone-500">{t("pricesAsOf", { date: new Date(`${week}T12:00:00Z`) })}</p>
  );
}
