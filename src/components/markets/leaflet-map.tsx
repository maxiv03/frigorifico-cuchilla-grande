"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { MapMarket, MapTiles } from "./markets-map";

/** Diámetro en px: el ÁREA del círculo es proporcional al porcentaje (más chico en móvil). */
export const diameter = (pct: number, scale = 1) => Math.round((10 + Math.sqrt(pct) * 9.5) * scale);

type Props = {
  markets: MapMarket[];
  tiles: MapTiles;
  origin: { lat: number; lng: number; label: string };
  /** Textos ya traducidos (el mapa no lee mensajes). */
  text: { mapLabel: string; markerLabel: (m: MapMarket) => string };
  renderPopup: (m: MapMarket) => React.ReactNode;
};

/**
 * Mapa Leaflet. Cada mercado es un Marker con ícono propio (círculo proporcional): Leaflet
 * los hace enfocables con Tab (`keyboard`) y Enter abre el popup. Escape lo cierra.
 */
export default function LeafletMap({ markets, tiles, origin, text, renderPopup }: Props) {
  // Solo se monta en el cliente: window existe. En pantallas chicas el mundo entra a zoom < 1.
  const [scale] = useState(() => (window.matchMedia("(min-width: 640px)").matches ? 1 : 0.6));
  const icons = useMemo(
    () =>
      new Map(
        markets.map((m) => {
          const d = diameter(m.sharePct, scale);
          return [
            m.id,
            L.divIcon({
              className: "market-marker",
              html: `<span style="width:${d}px;height:${d}px"></span>`,
              iconSize: [d, d],
              iconAnchor: [d / 2, d / 2],
              popupAnchor: [0, -d / 2],
            }),
          ];
        }),
      ),
    [markets, scale],
  );
  const originIcon = useMemo(
    () => L.divIcon({ className: "origin-marker", html: "<span></span>", iconSize: [14, 14], iconAnchor: [7, 7] }),
    [],
  );

  return (
    <MapContainer
      center={[15, 0]}
      zoom={2}
      minZoom={0}
      zoomSnap={0.25}
      maxZoom={6}
      scrollWheelZoom={false}
      worldCopyJump
      className="h-full w-full"
      attributionControl
    >
      <Labels mapLabel={text.mapLabel} />
      <FitMarkets markets={markets} origin={origin} />
      <TileLayer url={tiles.url} attribution={tiles.attribution} />
      <Marker
        position={[origin.lat, origin.lng]}
        icon={originIcon}
        keyboard={false}
        interactive={false}
        title={origin.label}
      />
      {markets.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={icons.get(m.id)!}
          title={text.markerLabel(m)}
          alt={text.markerLabel(m)}
          riseOnHover
          eventHandlers={{
            add: (e) => {
              const el = (e.target as L.Marker).getElement();
              el?.setAttribute("data-market", m.id);
              el?.setAttribute("aria-label", text.markerLabel(m));
              el?.setAttribute("aria-haspopup", "dialog");
            },
            // Teclado: al abrir, el foco pasa al primer link del popup; al cerrar (Escape o ×)
            // vuelve al marcador, para no perder el lugar.
            popupopen: (e) => {
              const el = e.popup.getElement();
              el?.setAttribute("aria-label", m.name);
              // React monta el contenido del popup después del evento: enfocar en el próximo cuadro.
              requestAnimationFrame(() => el?.querySelector<HTMLElement>(".leaflet-popup-content a")?.focus({ preventScroll: true }));
            },
            popupclose: (e) => {
              const marker = (e.target as L.Marker).getElement();
              const popupEl = e.popup.getElement();
              const hadFocus = !!popupEl?.contains(document.activeElement);
              // El popup se desmonta después del evento: devolver el foco en el próximo cuadro si
              // estaba adentro o quedó en <body>.
              requestAnimationFrame(() => {
                const active = document.activeElement;
                if (hadFocus || !active || active === document.body) marker?.focus({ preventScroll: true });
              });
            },
          }}
        >
          <Popup>
            <div data-popup={m.id}>{renderPopup(m)}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

/** Nombre accesible del contenedor del mapa y Escape dentro de los popups. */
function Labels({ mapLabel }: { mapLabel: string }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    el.setAttribute("aria-label", mapLabel);
    el.setAttribute("role", "region");
    // Leaflet solo atiende Escape con el foco en el contenedor del mapa: también desde el popup.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (e.target as HTMLElement).closest(".leaflet-popup")) {
        e.preventDefault();
        map.closePopup();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [map, mapLabel]);
  return null;
}

/** Encuadra todos los mercados y el origen. */
function FitMarkets({ markets, origin }: { markets: MapMarket[]; origin: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([[origin.lat, origin.lng], ...markets.map((m) => [m.lat, m.lng] as [number, number])]);
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, markets, origin]);
  return null;
}
