/**
 * Datos del despliegue (servidor): URL pública e indexación.
 *
 * SITE_INDEXABLE (por defecto false): la empresa es ficticia y no queremos que aparezca en
 * buscadores ni confunda a productores reales. Con false, todas las páginas llevan
 * `robots: noindex, nofollow`, robots.txt bloquea todo y las respuestas llevan
 * `X-Robots-Tag: noindex, nofollow`. Con "true" el sitio es indexable. El resto del SEO
 * (metadata, OG, sitemap, JSON-LD) se genera igual en los dos casos.
 * Se lee en el build (las páginas son estáticas): cambiarla exige un deploy nuevo.
 */
export function siteIndexable() {
  return process.env.SITE_INDEXABLE === "true";
}

/** URL pública sin barra final: NEXT_PUBLIC_SITE_URL, o la del deploy de Vercel, o localhost. */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && !(process.env.VERCEL_ENV === "preview" && explicit.includes("localhost"))) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const absoluteUrl = (path: string) => new URL(path, `${siteUrl()}/`).toString();
