import type { StaticImageData } from "next/image";
import beefRibeye from "../../../public/images/cuts/vacuno-bife-ancho.jpg";
import beefStriploin from "../../../public/images/cuts/vacuno-bife-angosto.jpg";
import beefRibs from "../../../public/images/cuts/vacuno-asado-tira.jpg";
import beefShank from "../../../public/images/cuts/vacuno-garron.jpg";
import beefTenderloin from "../../../public/images/cuts/vacuno-lomo.jpg";
import beefRumpCap from "../../../public/images/cuts/vacuno-tapa-de-cuadril.jpg";
import beefFlank from "../../../public/images/cuts/vacuno-vacio.jpg";
import lambRack from "../../../public/images/cuts/ovino-carre.jpg";
import lambChops from "../../../public/images/cuts/ovino-chuletas-lomo.jpg";
import lambLeg from "../../../public/images/cuts/ovino-pierna.jpg";
import type { Species } from "./types";

/**
 * Fotos por tipo de pieza (columna `cuts.image`). Cada una muestra ESA pieza y es de SU
 * especie: las claves `beef-*` solo se usan en vacunos y las `lamb-*` en ovinos. Un corte
 * sin foto adecuada no tiene clave y se ilustra con el diagrama de su zona. Créditos en
 * CREDITS.md.
 */
const images = {
  "beef-tenderloin": beefTenderloin,
  "beef-striploin": beefStriploin,
  "beef-rump-cap": beefRumpCap,
  "beef-ribeye": beefRibeye,
  "beef-ribs": beefRibs,
  "beef-flank": beefFlank,
  "beef-shank": beefShank,
  "lamb-rack": lambRack,
  "lamb-leg": lambLeg,
  "lamb-chops": lambChops,
} satisfies Record<string, StaticImageData>;

export type CutImageKey = keyof typeof images;

/**
 * Foto del corte y su clave (para el alt traducido: Products.images.<clave>), o `null` si
 * el corte no tiene foto propia o la clave no es de su especie.
 */
export function cutImage(key: string | null | undefined, species: Species): { key: CutImageKey; src: StaticImageData } | null {
  if (!key || !(key in images) || !key.startsWith(`${species}-`)) return null;
  const k = key as CutImageKey;
  return { key: k, src: images[k] };
}
