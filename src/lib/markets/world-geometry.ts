import "server-only";
import { geoEqualEarth, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { HIDDEN_COUNTRIES } from "./countries";

/**
 * Geometría del mapa de mercados, calculada en el servidor (Natural Earth 110m, dominio público,
 * vía world-atlas). Proyección Equal Earth (áreas reales). Al navegador solo llegan los `d` ya
 * proyectados, con precisión de 1 decimal en un lienzo de 960 px de ancho.
 */
export type CountryShape = { id: string; d: string };
export type WorldGeometry = {
  viewBox: string;
  width: number;
  height: number;
  countries: CountryShape[];
  /** Centroide proyectado de un país (para marcar el origen). */
  centroid: (id: string) => [number, number] | null;
};

const WIDTH = 960;
let cached: WorldGeometry | undefined;

export function worldGeometry(): WorldGeometry {
  if (cached) return cached;
  const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
  const all = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
  const visible: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: all.features.filter((f) => f.id !== undefined && !HIDDEN_COUNTRIES.has(String(f.id))),
  };

  const projection = geoEqualEarth().fitWidth(WIDTH, visible);
  const path = geoPath(projection).digits(1);
  const [[x0, y0], [x1, y1]] = path.bounds(visible);
  const height = Math.ceil(y1 - y0);
  const byId = new Map<string, Feature<Geometry>>(visible.features.map((f) => [String(f.id), f]));

  cached = {
    viewBox: `${Math.floor(x0)} ${Math.floor(y0)} ${Math.ceil(x1 - x0)} ${height}`,
    width: Math.ceil(x1 - x0),
    height,
    countries: visible.features.map((f) => ({ id: String(f.id), d: path(f) ?? "" })).filter((c) => c.d),
    centroid: (id) => {
      const f = byId.get(id);
      if (!f) return null;
      const [x, y] = path.centroid(f);
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    },
  };
  return cached;
}
