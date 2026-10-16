/**
 * Recorre el sitio desde las home de cada idioma y verifica que ningún link interno
 * devuelva error (regla: nunca un link a una página 404 en producción).
 *   npm run check:links -- <url-base>
 * Recorrido en anchura hasta 4 niveles (cada página se explora desde su menor profundidad, así
 * la cobertura no depende del orden de los links). Las anclas se validan contra los ids de la
 * página de destino, también entre páginas (/es/calidad#cert-halal).
 * Cotizaciones: falla si queda algún mailto de "Pedir cotización" (asunto con cotización/quote) y
 * verifica los links "Pedir cotización" (data-quote-link) a /contacto?tab=quote&cut=<id>.
 */
import { routing } from "@/i18n/routing";

const base = process.argv[2];
if (!base) {
  console.error("Uso: npm run check:links -- <url-base>");
  process.exit(1);
}
const MAX_DEPTH = 4;
const origin = new URL(base).origin;
const seen = new Map<string, number>();
const idsByPage = new Map<string, Set<string>>();
const anchors: { page: string; id: string; from: string }[] = [];
const failures: string[] = [];
const QUOTE_MAILTO = /cotizaci|quot/i;
let quoteLinks = 0;
let mailtos = 0;

/** Visita una página; devuelve los links internos encontrados. */
async function visit(key: string, from: string): Promise<string[]> {
  const res = await fetch(new URL(key, origin), { redirect: "follow" });
  seen.set(key, res.status);
  if (!res.ok) {
    failures.push(`${res.status} ${key}  (desde ${from})`);
    return [];
  }
  if (!res.headers.get("content-type")?.includes("text/html")) return [];
  const html = await res.text();
  // Con Cache Components, el 1.er pedido a un slug inexistente puede salir 200 con la página
  // 404 (noindex). Se cuenta como roto igual.
  if (/<meta name="robots" content="noindex"/.test(html)) {
    seen.set(key, 404);
    failures.push(`404 (soft) ${key}  (desde ${from})`);
    return [];
  }
  idsByPage.set(key, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  const links: string[] = [];
  for (const [tag] of html.matchAll(/<a\s[^>]*>/g)) {
    const quoteCut = tag.match(/data-quote-link="([^"]+)"/)?.[1];
    if (!quoteCut) continue;
    const href = (tag.match(/href="([^"]+)"/)?.[1] ?? "").replace(/&amp;/g, "&");
    const url = new URL(href, origin);
    quoteLinks++;
    if (!/^\/(es\/contacto|en\/contact)$/.test(url.pathname) || url.searchParams.get("tab") !== "quote" || url.searchParams.get("cut") !== quoteCut) {
      failures.push(`link de cotización mal formado ${href}  (en ${key})`);
    }
  }
  for (const [, href] of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    const h = href.replace(/&amp;/g, "&");
    if (h.startsWith("mailto:")) {
      mailtos++;
      const subject = new URL(h).searchParams.get("subject") ?? "";
      if (QUOTE_MAILTO.test(subject)) failures.push(`mailto de cotización (debe ir a /contacto) "${subject}"  (en ${key})`);
    }
    if (/^(mailto:|tel:|https?:\/\/(?!localhost))/.test(h) && !h.startsWith(origin)) continue;
    const next = new URL(h, new URL(key, origin));
    if (next.origin !== origin || next.pathname.startsWith("/_next")) continue;
    const target = next.pathname + next.search;
    if (next.hash.length > 1) anchors.push({ page: target, id: decodeURIComponent(next.hash.slice(1)), from: key });
    links.push(target);
  }
  return links;
}

async function main() {
  let level = routing.locales.map((l) => ({ key: `/${l}`, from: "inicio" }));
  for (let depth = 0; depth <= MAX_DEPTH && level.length; depth++) {
    const next: typeof level = [];
    for (const { key, from } of level) {
      if (seen.has(key)) continue;
      for (const link of await visit(key, from)) if (!seen.has(link)) next.push({ key: link, from: key });
    }
    level = next;
  }
  for (const { page, id, from } of anchors) {
    const ids = idsByPage.get(page);
    if (ids && !ids.has(id)) failures.push(`ancla rota ${page}#${id}  (en ${from})`);
    if (!ids && seen.get(page) === undefined) failures.push(`ancla sin verificar (página fuera de alcance) ${page}#${id}  (en ${from})`);
  }
  for (const [path, status] of seen) console.log(`  ${status} ${path}`);
  if (failures.length) {
    console.error(`\n✗ ${failures.length} problemas:`);
    for (const f of [...new Set(failures)]) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`\n✓ ${seen.size} URLs internas y ${new Set(anchors.map((a) => `${a.page}#${a.id}`)).size} anclas sin errores.`);
  console.log(`✓ Ningún mailto de cotización (${mailtos} mailto revisados); ${quoteLinks} links "Pedir cotización" a /contacto con el corte.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
