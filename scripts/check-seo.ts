/**
 * Verificación de SEO técnico sobre todas las URLs del sitemap.
 *   npm run check:seo -- <url-base> [--indexable]
 *
 * Por página: título y descripción presentes y únicos; canonical = la propia URL; hreflang es/en/
 * x-default recíprocos (la otra versión apunta de vuelta); meta robots según SITE_INDEXABLE
 * (noindex,nofollow por defecto; con --indexable, sin noindex); Open Graph y Twitter con imagen que
 * responde 200 image/png; JSON-LD parseable con los campos obligatorios de cada tipo
 * (Organization en todas; BreadcrumbList en cortes y noticias; NewsArticle en noticias).
 * También: robots.txt coherente con el modo y sitemap con alternates.
 */
const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const INDEXABLE = args.includes("--indexable");

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

type Ld = Record<string, unknown>;
const REQUIRED: Record<string, string[]> = {
  Organization: ["@context", "@type", "@id", "name", "url", "logo", "address", "contactPoint"],
  BreadcrumbList: ["@context", "@type", "itemListElement"],
  NewsArticle: ["@context", "@type", "headline", "datePublished", "dateModified", "author", "publisher", "image", "mainEntityOfPage"],
};

const attr = (html: string, re: RegExp) => html.match(re)?.[1]?.replace(/&amp;/g, "&");
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** La URL del sitemap usa NEXT_PUBLIC_SITE_URL; se pide contra `base`. */
const local = (url: string) => base + new URL(url).pathname;

async function main() {
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  if (INDEXABLE ? /Disallow: \/\s*$/m.test(robots) : !/Disallow: \/\s*$/m.test(robots)) fail(`robots.txt no coincide con el modo ${INDEXABLE ? "indexable" : "noindex"}:\n${robots}`);
  if (!/Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(robots)) fail("robots.txt sin Sitemap");

  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const alternatesInSitemap = (sitemap.match(/hreflang="x-default"/g) ?? []).length;
  if (alternatesInSitemap !== urls.length) fail(`sitemap: ${alternatesInSitemap} x-default para ${urls.length} URLs`);

  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const hreflang = new Map<string, Record<string, string>>();
  const imageStatus = new Map<string, string>();
  const ldCount: Record<string, number> = {};

  for (const url of urls) {
    const path = new URL(url).pathname;
    const res = await fetch(local(url), { redirect: "manual" });
    if (res.status !== 200) {
      fail(`${res.status} ${path}`);
      continue;
    }
    const html = await res.text();
    const lang = attr(html, /<html[^>]* lang="([^"]+)"/);
    if (lang !== path.split("/")[1]) fail(`lang="${lang}" en ${path}`);

    // Fechas: inglés británico ("12 October 2026") y español sin meses en inglés.
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";
    if (lang === "en" && new RegExp(`\\b(${MONTHS}) \\d{1,2}, \\d{4}`).test(text)) fail(`fecha con formato estadounidense en ${path}: ${text.match(new RegExp(`\\b(${MONTHS}) \\d{1,2}, \\d{4}`))?.[0]}`);
    if (lang === "es" && new RegExp(`\\b(${MONTHS}) \\d{4}|\\d{1,2} (${MONTHS})\\b`).test(text)) fail(`mes en inglés en ${path}`);

    const title = decode(attr(html, /<title>([^<]*)<\/title>/) ?? "");
    const description = decode(attr(html, /<meta name="description" content="([^"]*)"/) ?? "");
    if (!title) fail(`sin <title>: ${path}`);
    if (!description) fail(`sin description: ${path}`);
    if (titles.has(title)) fail(`título repetido "${title}": ${path} y ${titles.get(title)}`);
    if (descriptions.has(description) && !path.includes("/productos/") && !path.includes("/products/")) {
      fail(`descripción repetida: ${path} y ${descriptions.get(description)}`);
    }
    titles.set(title, path);
    descriptions.set(description, path);

    const robotsMeta = attr(html, /<meta name="robots" content="([^"]*)"/) ?? "";
    if (INDEXABLE ? /noindex/.test(robotsMeta) : robotsMeta !== "noindex, nofollow") fail(`robots "${robotsMeta}" en ${path}`);

    const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
    if (!canonical || new URL(canonical).pathname !== path) fail(`canonical ${canonical} en ${path}`);
    const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], new URL(m[2]).pathname]));
    if (!alts.es || !alts.en || !alts["x-default"]) fail(`hreflang incompleto en ${path}: ${JSON.stringify(alts)}`);
    hreflang.set(path, alts);

    for (const key of ["og:title", "og:description", "og:url", "og:image", "og:locale", "og:site_name"]) {
      if (!new RegExp(`<meta property="${key}" content="[^"]+"`).test(html)) fail(`sin ${key}: ${path}`);
    }
    for (const key of ["twitter:card", "twitter:image"]) {
      if (!new RegExp(`<meta name="${key}" content="[^"]+"`).test(html)) fail(`sin ${key}: ${path}`);
    }
    for (const img of [attr(html, /<meta property="og:image" content="([^"]*)"/), attr(html, /<meta name="twitter:image" content="([^"]*)"/)]) {
      if (!img) continue;
      const key = local(img) + new URL(img).search;
      if (!imageStatus.has(key)) {
        const r = await fetch(key, { redirect: "manual" });
        imageStatus.set(key, `${r.status} ${r.headers.get("content-type")}`);
      }
      if (imageStatus.get(key) !== "200 image/png") fail(`imagen OG ${imageStatus.get(key)}: ${new URL(img).pathname} (en ${path})`);
    }

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const types: string[] = [];
    for (const raw of blocks) {
      let data: Ld;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        fail(`JSON-LD inválido en ${path}: ${(e as Error).message}`);
        continue;
      }
      const type = String(data["@type"]);
      types.push(type);
      ldCount[type] = (ldCount[type] ?? 0) + 1;
      if (data["@context"] !== "https://schema.org") fail(`@context ${data["@context"]} en ${path}`);
      for (const k of REQUIRED[type] ?? []) if (data[k] === undefined || data[k] === "") fail(`${type} sin ${k} en ${path}`);
      if (type === "BreadcrumbList") {
        const items = data.itemListElement as { position: number; name: string; item: string }[];
        items.forEach((it, i) => {
          if (it.position !== i + 1 || !it.name || !/^https?:\/\//.test(it.item)) fail(`BreadcrumbList item ${i + 1} incompleto en ${path}`);
        });
        if (new URL(items.at(-1)!.item).pathname !== path) fail(`BreadcrumbList: el último item no es la página (${path})`);
      }
      if (type === "NewsArticle" && !/^\d{4}-\d{2}-\d{2}/.test(String(data.datePublished))) fail(`NewsArticle datePublished en ${path}`);
    }
    const isCut = /\/(productos\/(vacuno|ovino)|products\/(beef|lamb))\//.test(path);
    const isNews = /\/(noticias|news)\/[^/]+$/.test(path);
    const expected = ["Organization", ...(isCut || isNews ? ["BreadcrumbList"] : []), ...(isNews ? ["NewsArticle"] : [])];
    if (expected.sort().join() !== [...types].sort().join()) fail(`JSON-LD en ${path}: ${types.join(", ")} (esperado ${expected.join(", ")})`);
  }

  // hreflang recíproco: la versión en el otro idioma apunta de vuelta a esta página.
  for (const [path, alts] of hreflang) {
    for (const lang of ["es", "en"]) {
      const other = hreflang.get(alts[lang]);
      if (!other) fail(`hreflang ${lang} de ${path} apunta a ${alts[lang]}, fuera del sitemap`);
      else if (other[path.split("/")[1]] !== path) fail(`hreflang no recíproco: ${path} ↔ ${alts[lang]}`);
    }
  }

  console.log(`Modo: ${INDEXABLE ? "indexable" : "noindex (SITE_INDEXABLE=false)"}`);
  console.log(`${urls.length} URLs del sitemap · ${imageStatus.size} imágenes OG/Twitter · JSON-LD: ${Object.entries(ldCount).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  if (failures.length) {
    console.error(`\n✗ ${failures.length} problemas:`);
    for (const f of failures.slice(0, 60)) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log("✓ Metadata, hreflang, robots, Open Graph/Twitter y JSON-LD sin errores.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
