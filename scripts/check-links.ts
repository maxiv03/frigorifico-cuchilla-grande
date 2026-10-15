/**
 * Recorre el sitio desde las home de cada idioma y verifica que ningún link interno
 * devuelva error (regla: nunca un link a una página 404 en producción).
 *   npm run check:links -- <url-base>
 * Sigue links internos hasta 3 niveles; anclas (#) se validan contra ids de la página.
 */
import { routing } from "@/i18n/routing";

const base = process.argv[2];
if (!base) {
  console.error("Uso: npm run check:links -- <url-base>");
  process.exit(1);
}
const origin = new URL(base).origin;
const seen = new Map<string, number>();
const failures: string[] = [];

async function visit(path: string, from: string, depth: number) {
  const url = new URL(path, origin);
  const key = url.pathname + url.search;
  if (seen.has(key)) return;
  const res = await fetch(url, { redirect: "follow" });
  seen.set(key, res.status);
  if (!res.ok) {
    failures.push(`${res.status} ${key}  (desde ${from})`);
    return;
  }
  if (!res.headers.get("content-type")?.includes("text/html")) return;
  const html = await res.text();
  // Con Cache Components, el 1.er pedido a un slug inexistente puede salir 200 con la página
  // 404 (noindex). Se cuenta como roto igual.
  if (/<meta name="robots" content="noindex"/.test(html)) {
    seen.set(key, 404);
    failures.push(`404 (soft) ${key}  (desde ${from})`);
    return;
  }
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, href] of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    const h = href.replace(/&amp;/g, "&");
    if (h.startsWith("#")) {
      if (h.length > 1 && !ids.has(decodeURIComponent(h.slice(1)))) failures.push(`ancla rota ${h}  (en ${key})`);
      continue;
    }
    if (/^(mailto:|tel:|https?:\/\/(?!localhost))/.test(h) && !h.startsWith(origin)) continue;
    const next = new URL(h, url);
    if (next.origin !== origin || next.pathname.startsWith("/_next")) continue;
    if (depth < 3) await visit(next.pathname + next.search, key, depth + 1);
  }
}

async function main() {
  for (const locale of routing.locales) await visit(`/${locale}`, "inicio", 0);
  for (const [path, status] of seen) console.log(`  ${status} ${path}`);
  if (failures.length) {
    console.error(`\n✗ ${failures.length} problemas:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`\n✓ ${seen.size} URLs internas sin errores.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
