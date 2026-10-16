import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/render";
import { OG_ALT, generalOgImage, ogLocale } from "@/lib/og/pages";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Imagen para redes (plantilla general). */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  return generalOgImage(await ogLocale(params), "sustainability");
}
