"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Fase 0: cambia de idioma conservando la ruta. Los slugs de contenido traducidos
// (cortes, noticias) se resuelven en la fase 1.
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale();
  const pathname = usePathname();
  const params = useParams();

  return (
    <nav aria-label={t("label")} className="flex gap-3 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          // @ts-expect-error -- params coinciden con la ruta actual
          href={{ pathname, params }}
          locale={locale}
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
          className={locale === current ? "font-semibold text-stone-900" : "text-stone-500 hover:text-stone-900"}
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
