import { newsOgImage } from "@/lib/og/detail";
import { OG_ALT, ogLocale } from "@/lib/og/pages";
import { OG_NEWS_CONTENT_TYPE, OG_SIZE } from "@/lib/og/render";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_NEWS_CONTENT_TYPE;

/** Imagen para redes (plantilla de noticia). */
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return newsOgImage(await ogLocale(params), slug);
}
