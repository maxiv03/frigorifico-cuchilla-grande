import "server-only";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-50m.json";
import { company } from "@/data/company";

/**
 * Mapa simple de ubicación (contacto): Uruguay y el borde de sus vecinos (Natural Earth 50m vía
 * world-atlas), proyectado en el servidor. Sin teselas ni servicios externos.
 */
const URUGUAY = "858";
const NEIGHBORS = ["032", "076"]; // Argentina, Brasil
const WIDTH = 360;
const HEIGHT = 340;
const PAD = 40;

/** Montevideo (puerto de salida de las exportaciones). */
const MONTEVIDEO: [number, number] = [-56.1913, -34.9058];

export type LocationGeometry = {
  viewBox: string;
  uruguay: string;
  neighbors: string[];
  plant: [number, number];
  port: [number, number];
};

let cached: LocationGeometry | undefined;

export function locationGeometry(): LocationGeometry {
  if (cached) return cached;
  const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
  const all = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
  const byId = (id: string) => all.features.find((f) => String(f.id) === id) as Feature<Geometry>;
  const uruguay = byId(URUGUAY);

  const projection = geoMercator()
    .fitExtent(
      [
        [PAD, PAD],
        [WIDTH - PAD, HEIGHT - PAD],
      ],
      uruguay,
    )
    .clipExtent([
      [0, 0],
      [WIDTH, HEIGHT],
    ]);
  const path = geoPath(projection).digits(1);
  const point = (lngLat: [number, number]) => {
    const [x, y] = projection(lngLat) ?? [0, 0];
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number];
  };
  const { lat, lng } = company.address.coordinates;

  cached = {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    uruguay: path(uruguay) ?? "",
    neighbors: NEIGHBORS.map((id) => path(byId(id)) ?? "").filter(Boolean),
    plant: point([lng, lat]),
    port: point(MONTEVIDEO),
  };
  return cached;
}
