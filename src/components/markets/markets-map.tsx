"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";

export type MapMarket = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sharePct: number;
  /** Porcentaje ya formateado ("38 %" / "38%"). */
  share: string;
  topCuts: { id: string; name: string; href: { species: string; cut: string } }[];
  certifications: { id: string; name: string }[];
};

export type MapTiles = { url: string; attribution: string };

type Props = { markets: MapMarket[]; tiles: MapTiles; origin: { lat: number; lng: number; label: string } };

/** Mismo tamaño para el mapa y su reserva: sin salto de layout al cargar. */
export const MAP_BOX = "h-[18rem] sm:h-[28rem] lg:h-[32rem]";

export function MapFallback() {
  const t = useTranslations("Markets.map");
  return (
    <div className={`${MAP_BOX} flex items-center justify-center bg-surface-muted`}>
      <p className="text-sm text-ink-muted">{t("loading")}</p>
    </div>
  );
}

// Leaflet usa `window`: solo en el cliente. La página lo envuelve además en <Suspense>.
const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false, loading: () => <MapFallback /> });

export function MarketsMap({ markets, tiles, origin }: Props) {
  const t = useTranslations("Markets");
  return (
    <div className={MAP_BOX}>
      <LeafletMap
        markets={markets}
        tiles={tiles}
        origin={origin}
        text={{
          mapLabel: t("map.label"),
          markerLabel: (m) => t("map.marker", { market: m.name, share: m.share }),
        }}
        renderPopup={(m) => (
          <div className="min-w-52 font-sans text-ink">
            <p className="font-serif text-lg leading-tight font-semibold">{m.name}</p>
            <p className="mt-1 text-sm">
              <span className="font-semibold tabular-nums">{m.share}</span> {t("map.ofExports")}
            </p>
            <p className="mt-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">{t("topCuts")}</p>
            <ul className="mt-1 text-sm">
              {m.topCuts.map((c) => (
                <li key={c.id}>
                  <Link href={{ pathname: "/products/[species]/[cut]", params: c.href }} className="text-brand-700 underline-offset-2 hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">{t("certifications")}</p>
            <p className="mt-1 text-sm">{m.certifications.map((c) => c.name).join(" · ")}</p>
            <Link
              href={{ pathname: "/products", query: { market: m.id } }}
              className="mt-3 inline-block text-sm font-semibold text-brand-700 underline underline-offset-2"
            >
              {t("catalogLink", { market: m.name })}
            </Link>
          </div>
        )}
      />
    </div>
  );
}
