import type { StaticImageData } from "next/image";
import coldStorage from "../../../public/images/news/ampliacion-frio.jpg";
import foodFair from "../../../public/images/news/feria-alimentos.jpg";
import producersDay from "../../../public/images/news/jornada-productores.jpg";
import solarPark from "../../../public/images/news/parque-solar.jpg";
import portionedBeef from "../../../public/images/news/porcionados-vacunos.jpg";
import port from "../../../public/images/news/puerto-contenedores.jpg";

/**
 * Fotos de noticias (columna `news_posts.image`), 16:10. Alt traducido en `News.images.<clave>`.
 * Créditos en CREDITS.md.
 */
const images = {
  "parque-solar": solarPark,
  "ampliacion-frio": coldStorage,
  "jornada-productores": producersDay,
  "feria-alimentos": foodFair,
  "porcionados-vacunos": portionedBeef,
  "puerto-contenedores": port,
} satisfies Record<string, StaticImageData>;

export type NewsImageKey = keyof typeof images;

export function newsImage(key: string): { key: NewsImageKey; src: StaticImageData } | null {
  if (!(key in images)) return null;
  const k = key as NewsImageKey;
  return { key: k, src: images[k] };
}
