import type { MapTiles } from "@/components/markets/markets-map";

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Teselas del mapa de mercados. CARTO Positron (claras) exige una clave gratuita desde 2026:
 * va en CARTO_BASEMAPS_KEY (es pública: viaja en la URL de cada tesela). Sin clave, CARTO
 * devuelve teselas con la marca "API KEY REQUIRED", así que se usan las teselas estándar de
 * OpenStreetMap, con su atribución. Se resuelve en el servidor y se pasa al mapa.
 */
export function mapTiles(): MapTiles {
  const key = process.env.CARTO_BASEMAPS_KEY;
  if (key) {
    return {
      url: `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`,
      attribution: `${OSM} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    };
  }
  return { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: OSM };
}
