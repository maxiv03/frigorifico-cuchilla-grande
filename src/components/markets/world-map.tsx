import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { speciesSlugs } from "@/lib/catalog/species";
import type { Certification, MarketInfo } from "@/lib/data/institutional";
import { formatFigure, formatShare } from "@/lib/format";
import { marketCountries, ORIGIN_COUNTRY, SHARE_BINS, shareBin } from "@/lib/markets/countries";
import { worldGeometry } from "@/lib/markets/world-geometry";
import { MarketsMap } from "./markets-map";

type Props = { markets: MarketInfo[]; certifications: Certification[] };

/**
 * Mapa de mercados en SVG, renderizado en el servidor: países de cada mercado con una escala de
 * bordó según participación, el resto en gris cálido y Uruguay como origen. Un `<g>` enfocable
 * por MERCADO (no por país) agrupa sus países. La interacción vive en <MarketsMap> (cliente).
 */
export async function WorldMap({ markets, certifications }: Props) {
  const t = await getTranslations("Markets");
  const locale = await getLocale();
  const geo = worldGeometry();
  const certName = new Map(certifications.map((c) => [c.id, c.name]));

  const owner = new Map<string, string>();
  for (const m of markets) for (const id of marketCountries[m.id] ?? []) owner.set(id, m.id);
  const others = geo.countries.filter((c) => !owner.has(c.id) && c.id !== ORIGIN_COUNTRY);
  const origin = geo.countries.find((c) => c.id === ORIGIN_COUNTRY);
  const originAt = geo.centroid(ORIGIN_COUNTRY);
  // Mercados chicos al final: quedan por encima y su contorno de foco no queda tapado.
  const drawOrder = [...markets].sort((a, b) => b.sharePct - a.sharePct);

  const svg = (
    <svg viewBox={geo.viewBox} role="group" aria-label={t("map.label")} className="market-map h-auto w-full">
      <g aria-hidden="true">
        {others.map((c) => (
          <path key={c.id} d={c.d} className="country" />
        ))}
      </g>
      {drawOrder.map((m) => (
        <g
          key={m.id}
          data-market={m.id}
          data-share={m.sharePct}
          tabIndex={0}
          role="button"
          aria-controls="market-panel"
          aria-expanded="false"
          aria-label={t("map.marker", { market: m.name, share: formatShare(m.sharePct, locale) })}
          className={shareBin(m.sharePct).fill}
        >
          {geo.countries
            .filter((c) => owner.get(c.id) === m.id)
            .map((c) => (
              <path key={c.id} d={c.d} />
            ))}
        </g>
      ))}
      {origin && originAt && (
        <g aria-hidden="true" className="pointer-events-none">
          <path d={origin.d} className="fill-earth-800" stroke="var(--color-surface)" strokeWidth={0.6} />
          <circle cx={originAt[0]} cy={originAt[1]} r={4.5} className="fill-ink" stroke="white" strokeWidth={1.5} />
          <text
            x={originAt[0] + 9}
            y={originAt[1] + 4}
            className="hidden fill-earth-800 font-sans text-[13px] font-semibold sm:inline"
            stroke="white"
            strokeWidth={3}
            paintOrder="stroke"
          >
            {t("map.originShort")}
          </text>
        </g>
      )}
    </svg>
  );

  const panels = Object.fromEntries(
    markets.map((m) => [
      m.id,
      <div key={m.id} data-popup={m.id}>
        <h3 data-panel-heading tabIndex={-1} className="font-serif text-2xl font-semibold text-ink outline-none">
          {m.name}
        </h3>
        <p className="mt-1 text-ink-muted">
          <span className="font-serif text-3xl font-semibold text-brand-700 tabular-nums">{formatShare(m.sharePct, locale)}</span>{" "}
          {t("map.ofExports")}
        </p>
        <p className="mt-1 text-sm text-ink-muted tabular-nums">
          {t("list.volume")}: {t("list.volumeValue", { tonnes: formatFigure(m.volumeTonnes, locale) })}
        </p>
        <h4 className="mt-5 text-xs font-semibold tracking-[0.12em] text-earth-700 uppercase">{t("topCuts")}</h4>
        <ul className="mt-1.5 space-y-1">
          {m.topCuts.map((c) => (
            <li key={c.id}>
              <Link
                href={{ pathname: "/products/[species]/[cut]", params: { species: speciesSlugs[c.species][locale], cut: c.slug } }}
                className="inline-flex min-h-6 items-center text-brand-700 underline-offset-2 hover:underline"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <h4 className="mt-5 text-xs font-semibold tracking-[0.12em] text-earth-700 uppercase">{t("certifications")}</h4>
        <ul className="mt-1.5 space-y-1">
          {m.certifications.map((id) => (
            <li key={id}>
              <Link href={{ pathname: "/quality", hash: `cert-${id}` }} className="inline-flex min-h-6 items-center text-brand-700 underline-offset-2 hover:underline">
                {certName.get(id) ?? id}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={{ pathname: "/products", query: { market: m.id } }}
          className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-4"
        >
          {t("catalogLink", { market: m.name })}
        </Link>
        <p className="mt-4 text-xs text-ink-subtle">{t("map.escHint")}</p>
      </div>,
    ]),
  );

  const intro = (
    <div>
      <h3 className="font-serif text-xl font-semibold text-ink">{t("map.introTitle")}</h3>
      <p className="mt-2 leading-relaxed text-ink-muted">{t("map.introText")}</p>
    </div>
  );

  const bins = SHARE_BINS.map((b, i) => {
    const upper = i === 0 ? null : SHARE_BINS[i - 1].min - 1;
    const label =
      upper === null
        ? t("map.legend.atLeast", { share: formatShare(b.min, locale) })
        : b.min === 0
          ? t("map.legend.below", { share: formatShare(upper + 1, locale) })
          : t("map.legend.range", { from: formatFigure(b.min, locale), to: formatShare(upper, locale) });
    return { swatch: b.swatch, label };
  });

  return (
    <div>
      <MarketsMap map={svg} panels={panels} intro={intro} panelLabel={t("map.panelLabel")} />
      <div className="mt-5 flex flex-col gap-3 text-sm text-ink-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ul aria-label={t("map.legend.title")} className="flex flex-wrap gap-x-5 gap-y-2">
          {bins.map((b) => (
            <li key={b.swatch} className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-3.5 rounded-sm ${b.swatch}`} />
              {b.label}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3.5 rounded-sm bg-earth-800" />
            {t("map.legend.origin")}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3.5 rounded-sm bg-line ring-1 ring-earth-300 ring-inset" />
            {t("map.legend.others")}
          </li>
        </ul>
        <p data-attribution className="text-xs text-ink-subtle">
          {t("map.attribution")}
        </p>
      </div>
    </div>
  );
}
