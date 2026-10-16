import { cutOgImage } from "@/lib/og/detail";
import { OG_ALT, ogLocale } from "@/lib/og/pages";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/render";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Imagen para redes (plantilla de corte). */
export default async function Image({ params }: { params: Promise<{ locale: string; species: string; cut: string }> }) {
  const { species, cut } = await params;
  return cutOgImage(await ogLocale(params), species, cut);
}
