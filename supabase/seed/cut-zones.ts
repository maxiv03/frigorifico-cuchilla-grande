import type { CutZoneSeed } from "./types";

/** Zonas del diagrama. Las claves coinciden con src/components/cuts/diagram-geometry.ts. */
export const cutZones: CutZoneSeed[] = [
  // Vacuno, de adelante hacia atrás
  { key: "neck", species: "beef", sort: 1, name: { es: "Cogote", en: "Neck" } },
  { key: "chuck", species: "beef", sort: 2, name: { es: "Aguja", en: "Chuck" } },
  { key: "blade", species: "beef", sort: 3, name: { es: "Paleta", en: "Blade" } },
  { key: "brisket", species: "beef", sort: 4, name: { es: "Pecho", en: "Brisket" } },
  { key: "rib", species: "beef", sort: 5, name: { es: "Bife ancho", en: "Rib" } },
  { key: "plate", species: "beef", sort: 6, name: { es: "Asado y entrañas", en: "Plate and skirts" } },
  { key: "loin", species: "beef", sort: 7, name: { es: "Lomo y bife angosto", en: "Loin" } },
  { key: "flank", species: "beef", sort: 8, name: { es: "Vacío", en: "Flank" } },
  { key: "rump", species: "beef", sort: 9, name: { es: "Cuadril", en: "Rump" } },
  { key: "round", species: "beef", sort: 10, name: { es: "Pierna", en: "Round" } },
  { key: "shank", species: "beef", sort: 11, name: { es: "Garrón y brazuelo", en: "Shank and shin" } },
  // Ovino
  { key: "neck", species: "lamb", sort: 1, name: { es: "Cogote", en: "Neck" } },
  { key: "shoulder", species: "lamb", sort: 2, name: { es: "Paleta", en: "Shoulder" } },
  { key: "rack", species: "lamb", sort: 3, name: { es: "Costillar", en: "Rack" } },
  { key: "loin", species: "lamb", sort: 4, name: { es: "Lomo", en: "Loin" } },
  { key: "breast", species: "lamb", sort: 5, name: { es: "Pecho", en: "Breast" } },
  { key: "leg", species: "lamb", sort: 6, name: { es: "Pierna", en: "Leg" } },
  { key: "shank", species: "lamb", sort: 7, name: { es: "Garrón", en: "Shank" } },
];
