import { getTranslations } from "next-intl/server";
import { locationGeometry } from "@/lib/location-geometry";

/** Mapa estático de ubicación: Uruguay, la planta (Sarandí del Yí) y el puerto de Montevideo. */
export async function LocationMap() {
  const t = await getTranslations("Contact.location");
  const g = locationGeometry();
  const [px, py] = g.plant;
  const [mx, my] = g.port;
  return (
    <figure data-location-map>
      <svg viewBox={g.viewBox} role="img" aria-labelledby="location-title location-desc" className="h-auto w-full rounded-md bg-surface-muted ring-1 ring-line">
        <title id="location-title">{t("mapTitle")}</title>
        <desc id="location-desc">{t("mapDesc")}</desc>
        {g.neighbors.map((d, i) => (
          <path key={i} d={d} className="fill-line stroke-ink-subtle" strokeWidth={0.8} />
        ))}
        <path d={g.uruguay} className="fill-earth-100 stroke-earth-600" strokeWidth={1.4} />
        {/* Ruta de la planta al puerto (línea recta indicativa) */}
        <line x1={px} y1={py} x2={mx} y2={my} className="stroke-earth-700" strokeWidth={1.5} strokeDasharray="4 4" />
        <circle cx={mx} cy={my} r={5} className="fill-ink" />
        <text x={mx + 9} y={my + 4} className="fill-ink text-[12px] font-semibold">
          {t("port")}
        </text>
        <circle cx={px} cy={py} r={9} className="fill-brand-700/25" />
        <circle cx={px} cy={py} r={5.5} className="fill-brand-700 stroke-white" strokeWidth={1.5} />
        <text x={px + 12} y={py - 6} className="fill-ink text-[13px] font-semibold">
          {t("plant")}
        </text>
        <text x={px + 12} y={py + 9} className="fill-ink-muted text-[11px]">
          {t("plantPlace")}
        </text>
      </svg>
      <figcaption className="mt-2 text-xs text-ink-muted">{t("attribution")}</figcaption>
    </figure>
  );
}
