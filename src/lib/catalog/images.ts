import type { StaticImageData } from "next/image";
import beefBraise from "../../../public/images/cuts/vacuno-coccion-lenta.jpg";
import beefFlank from "../../../public/images/cuts/vacuno-vacio.jpg";
import beefRibs from "../../../public/images/cuts/vacuno-asado-tira.jpg";
import beefRoast from "../../../public/images/cuts/vacuno-asado-al-horno.jpg";
import beefSteak from "../../../public/images/cuts/vacuno-bifes.jpg";
import lambChops from "../../../public/images/cuts/ovino-chuletas-lomo.jpg";
import lambCuts from "../../../public/images/cuts/ovino-cortes.jpg";
import lambRack from "../../../public/images/cuts/ovino-carre.jpg";
import type { Species } from "./types";

/**
 * Fotos por categoría (columna `cuts.image`). Cada una es de SU especie: las claves
 * `beef-*` solo muestran vacuno y las `lamb-*` solo ovino. Créditos en CREDITS.md.
 */
const images = {
  "beef-steak": beefSteak,
  "beef-roast": beefRoast,
  "beef-ribs": beefRibs,
  "beef-braise": beefBraise,
  "beef-flank": beefFlank,
  "lamb-rack": lambRack,
  "lamb-chops": lambChops,
  "lamb-cuts": lambCuts,
} satisfies Record<string, StaticImageData>;

export type CutImageKey = keyof typeof images;

const fallback: Record<Species, CutImageKey> = { beef: "beef-steak", lamb: "lamb-cuts" };

/**
 * Foto del corte y su clave (para el alt traducido: Products.images.<clave>). Si la clave
 * no existe o no es de la especie del corte, usa la genérica de la especie.
 */
export function cutImage(key: string, species: Species): { key: CutImageKey; src: StaticImageData } {
  const k = key in images && key.startsWith(`${species}-`) ? (key as CutImageKey) : fallback[species];
  return { key: k, src: images[k] };
}
