import { getLocale, getTranslations } from "next-intl/server";
import type { PriceHistory, PriceRow } from "@/lib/data/prices";
import { formatPrice } from "@/lib/format";

/** Trazo por posición dentro de la especie: color + patrón distinto (no depende solo del color). */
const STROKES = [
  { className: "stroke-brand-700", dash: undefined, width: 3 },
  { className: "stroke-earth-600", dash: "8 5", width: 2.5 },
  { className: "stroke-ink", dash: "2 4", width: 2.5 },
] as const;

const W = 720;
const H = 300;
const M = { top: 16, right: 132, bottom: 36, left: 52 };

/**
 * Gráfico de líneas propio (SVG, sin librerías) de las últimas semanas de una especie.
 * Etiquetas directas al final de cada línea; resumen en <desc> y tabla con los datos debajo.
 */
export async function PriceChart({ species, rows, history }: { species: "beef" | "lamb"; rows: PriceRow[]; history: PriceHistory }) {
  const t = await getTranslations("Producers.chart");
  const locale = await getLocale();
  const cats = rows.filter((r) => r.species === species);
  const { weeks } = history;
  const values = cats.flatMap((c) => (history.series[c.categoryId] ?? []).filter((v): v is number => v !== null));
  if (weeks.length < 2 || values.length === 0) return <p className="text-ink-muted">{t("empty")}</p>;

  // Dominio con márgenes "redondos" de 0,10 US$.
  const lo = Math.floor((Math.min(...values) - 0.05) * 10) / 10;
  const hi = Math.ceil((Math.max(...values) + 0.05) * 10) / 10;
  const step = niceStep(hi - lo);
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);

  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const x = (i: number) => M.left + (i / (weeks.length - 1)) * iw;
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * ih;
  const short = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  const date = (w: string) => new Date(`${w}T12:00:00Z`);

  const lines = cats.map((c, i) => {
    const pts = (history.series[c.categoryId] ?? []).map((v, j) => (v === null ? null : ([x(j), y(v)] as const)));
    const d = pts
      .map((p, j) => (p ? `${j === 0 || !pts[j - 1] ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}` : ""))
      .join("");
    const series = (history.series[c.categoryId] ?? []).filter((v): v is number => v !== null);
    return { c, d, stroke: STROKES[i % STROKES.length], first: series[0], last: series.at(-1)!, lastY: y(series.at(-1)!) };
  });

  // Etiquetas finales sin superponerse (mínimo 18 px entre sí).
  const labels = [...lines].sort((a, b) => a.lastY - b.lastY);
  for (let i = 1; i < labels.length; i++) labels[i].lastY = Math.max(labels[i].lastY, labels[i - 1].lastY + 18);

  const titleId = `chart-${species}-title`;
  const descId = `chart-${species}-desc`;
  const summary = lines
    .map((l) => t("summaryLine", { category: l.c.name, from: formatPrice(l.first, locale), to: formatPrice(l.last, locale) }))
    .join(" ");

  return (
    <figure data-chart={species}>
      {/* En pantallas chicas el gráfico conserva un ancho legible y se desplaza dentro de su caja. */}
      <div className="-mx-1 overflow-x-auto px-1">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${titleId} ${descId}`} className="h-auto w-full min-w-[34rem] font-sans">
        <title id={titleId}>{t("title", { species: t(`species.${species}`), weeks: String(weeks.length) })}</title>
        <desc id={descId}>{summary}</desc>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className="stroke-line" />
            <text x={M.left - 8} y={y(v) + 4} textAnchor="end" className="fill-ink-muted text-[12px] tabular-nums">
              {formatPrice(v, locale)}
            </text>
          </g>
        ))}
        {weeks.map((w, i) =>
          i % 3 === (weeks.length - 1) % 3 ? (
            <text key={w} x={x(i)} y={H - 12} textAnchor="middle" className="fill-ink-muted text-[12px]">
              {short.format(date(w))}
            </text>
          ) : null,
        )}
        {lines.map((l) => (
          <path
            key={l.c.categoryId}
            d={l.d}
            fill="none"
            strokeWidth={l.stroke.width}
            strokeDasharray={l.stroke.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={l.stroke.className}
          />
        ))}
        {labels.map((l) => (
          <g key={l.c.categoryId}>
            <line
              x1={W - M.right + 6}
              x2={W - M.right + 22}
              y1={l.lastY}
              y2={l.lastY}
              strokeWidth={l.stroke.width}
              strokeDasharray={l.stroke.dash}
              className={l.stroke.className}
            />
            <text x={W - M.right + 28} y={l.lastY + 4} className="fill-ink text-[13px] font-semibold">
              {l.c.name} <tspan className="font-normal tabular-nums">{formatPrice(l.last, locale)}</tspan>
            </text>
          </g>
        ))}
      </svg>
      </div>
      <figcaption className="mt-2 text-sm text-ink-muted">{t("caption")}</figcaption>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-brand-700">{t("showData")}</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left tabular-nums">
            <caption className="sr-only">{t("title", { species: t(`species.${species}`), weeks: String(weeks.length) })}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-1.5 pr-4 font-semibold">
                  {t("week")}
                </th>
                {cats.map((c) => (
                  <th key={c.categoryId} scope="col" className="py-1.5 pr-4 font-semibold">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((w, i) => (
                <tr key={w} className="border-b border-line/60">
                  <th scope="row" className="py-1.5 pr-4 font-normal">
                    {long.format(date(w))}
                  </th>
                  {cats.map((c) => {
                    const v = history.series[c.categoryId]?.[i];
                    return (
                      <td key={c.categoryId} className="py-1.5 pr-4">
                        {v == null ? "—" : formatPrice(v, locale)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function niceStep(range: number) {
  for (const s of [0.05, 0.1, 0.2, 0.25, 0.5, 1]) if (range / s <= 6) return s;
  return 1;
}
