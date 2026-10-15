"use client";

import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/components/ui/cn";
import { useAlternates } from "@/components/i18n/alternates";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Props = { className?: string; tone?: "dark" | "light" };

/**
 * Selector de idioma: lleva a la página equivalente (slug traducido si la página
 * declaró alternates) y conserva los filtros de la URL (?species=…).
 */
export function LocaleSwitcher(props: Props) {
  // useSearchParams requiere Suspense con Cache Components; el fallback no conserva query.
  return (
    <Suspense fallback={<Links {...props} query="" />}>
      <LinksWithQuery {...props} />
    </Suspense>
  );
}

function LinksWithQuery(props: Props) {
  const query = useSearchParams().toString();
  return <Links {...props} query={query} />;
}

function Links({ className, tone = "dark", query }: Props & { query: string }) {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const alternates = useAlternates();

  function hrefFor(locale: Locale) {
    const base =
      alternates[locale] ??
      // @ts-expect-error -- pathname y params corresponden a la ruta actual
      getPathname({ locale, href: { pathname, params } });
    return query ? `${base}?${query}` : base;
  }

  return (
    <nav aria-label={t("label")} className={cn("flex items-center gap-1 text-sm", className)}>
      {routing.locales.map((locale, i) => {
        const active = locale === current;
        return (
          <span key={locale} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className={tone === "light" ? "text-white/40" : "text-line"}>
                |
              </span>
            )}
            <NextLink
              href={hrefFor(locale)}
              hrefLang={locale}
              lang={locale}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-sm px-1.5 py-1 font-semibold uppercase tracking-wide",
                tone === "light"
                  ? active
                    ? "text-white"
                    : "text-white/75 hover:text-white"
                  : active
                    ? "text-brand-700"
                    : "text-ink-muted hover:text-ink",
              )}
            >
              <span aria-hidden="true">{locale}</span>
              <span className="sr-only">{t(locale)}</span>
            </NextLink>
          </span>
        );
      })}
    </nav>
  );
}
