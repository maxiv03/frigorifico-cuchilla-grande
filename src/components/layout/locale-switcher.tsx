"use client";

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
 *
 * Usa <a> y no <Link>: cambiar de idioma cambia el layout raíz ([locale] es root param,
 * con su propio <html lang>). La navegación de cliente entre layouts raíz dejaba montadas
 * las dos páginas (ES y EN a la vez); una carga completa de documento lo evita.
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

  // next-intl devuelve la plantilla ("/products/[species]/[cut]") o la ruta interna con
  // valores ("/products/vacuno/lomo") según el caso: se normaliza a plantilla + params.
  const dynamicParams = Object.fromEntries(Object.entries(params).filter(([k]) => k !== "locale"));
  const template = pathname.includes("[") ? { pathname, params: dynamicParams } : matchTemplate(pathname);

  function hrefFor(locale: Locale) {
    if (alternates[locale]) return withQuery(alternates[locale]);
    if (locale === current) {
      // @ts-expect-error -- plantilla y params salen de la ruta actual
      return withQuery(getPathname({ locale, href: template ?? pathname }));
    }
    // Rutas con params de contenido ([species], [cut], [slug]): sus valores son del idioma
    // actual y no sirven en el otro. Hasta que la página declare sus alternates (al hidratar),
    // el link apunta a la página padre estática (p. ej. /en/products), nunca a una URL inválida.
    if (Object.keys(dynamicParams).length > 0) {
      const parent = template ? template.pathname.slice(0, template.pathname.indexOf("/[")) || "/" : "/";
      // @ts-expect-error -- `parent` es un prefijo estático de la ruta actual
      return withQuery(getPathname({ locale, href: parent }));
    }
    // @ts-expect-error -- pathname corresponde a la ruta actual (estática)
    return withQuery(getPathname({ locale, href: pathname }));
  }
  function withQuery(base: string) {
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
            <a
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
            </a>
          </span>
        );
      })}
    </nav>
  );
}

/** "/products/vacuno/lomo" → { pathname: "/products/[species]/[cut]", params: { species, cut } } */
function matchTemplate(internal: string) {
  for (const template of Object.keys(routing.pathnames)) {
    if (!template.includes("[")) continue;
    const names: string[] = [];
    const re = new RegExp(
      `^${template.replace(/\[([^\]]+)\]/g, (_, name: string) => {
        names.push(name);
        return "([^/]+)";
      })}$`,
    );
    const m = internal.match(re);
    if (m) return { pathname: template, params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}
