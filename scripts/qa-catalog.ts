/**
 * QA del catálogo (fase 2): diagrama por teclado, filtros en la URL, cambio de idioma
 * conservando corte y filtros, estado vacío, alternates y layout móvil.
 *   npm run qa:catalog -- <url-base>
 */
import { chromium, type Page } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });
const url = (p: Page) => new URL(p.url());

/** Navega y espera a que React reemplace el fallback estático por el catálogo de la URL. */
async function open(p: Page, path: string) {
  const res = await p.goto(`${base}${path}`, { waitUntil: "load" });
  await p.waitForFunction(() => document.querySelectorAll("#filtro-mercado").length <= 1);
  await p.waitForTimeout(100);
  return res;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // ─── 1. Diagrama por teclado ────────────────────────────────────────────
  await open(page, `/es/productos`);
  const zones = page.locator("section svg[role=group] g[role=button]");
  check("diagrama: 11 zonas vacunas navegables", (await zones.count()) === 11, String(await zones.count()));
  await page.locator('button[aria-pressed]:has-text("Ovino")').focus(); // último control antes del diagrama
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.getAttribute("data-zone"));
  check("diagrama: Tab llega a la primera zona", first === "neck", String(first));
  const label = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  check("diagrama: aria-label con nombre de zona", !!label?.startsWith("Cogote"), String(label));
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  check("diagrama: Enter selecciona (URL)", url(page).searchParams.get("zone") === "chuck", page.url());
  check(
    "diagrama: aria-pressed en la zona elegida",
    (await page.locator('g[data-zone="chuck"]').getAttribute("aria-pressed")) === "true",
  );
  const live = await page.locator('[role=status][aria-live=polite]').textContent();
  check("diagrama: aria-live anuncia los cortes", /Quedan? \d+ cortes?/.test(live ?? ""), String(live));
  const cards = await page.locator("[data-cut]").count();
  check("diagrama: la lista se filtra", cards === 2, String(cards));
  await page.keyboard.press(" ");
  await page.waitForTimeout(150);
  check("diagrama: Espacio sobre la misma zona limpia", !url(page).searchParams.has("zone"), page.url());
  const ring = await page.locator("svg[role=group] path[stroke-dasharray]").count();
  check("diagrama: foco de teclado visible (anillo punteado)", ring > 0, String(ring));
  await page.locator('[role=group][aria-label="Zonas"] button', { hasText: "Pierna" }).click();
  await page.locator('[role=group][aria-label="Zonas"] button', { hasText: "Ver todos" }).click();
  check("chips: 'Ver todos' limpia la zona", !url(page).searchParams.has("zone"));

  // ─── 2. Filtros reflejados en la URL ────────────────────────────────────
  await page.selectOption("#filtro-mercado", "eu");
  await page.locator('fieldset:has(legend:text("Presentación")) button', { hasText: "Enfriado" }).click();
  await page.locator('fieldset:has(legend:text("Hueso")) button', { hasText: "Sin hueso" }).click();
  await page.waitForTimeout(150);
  const sp = url(page).searchParams;
  check(
    "filtros: market/presentation/bone en la URL",
    sp.get("market") === "eu" && sp.get("presentation") === "chilled" && sp.get("bone") === "boneless",
    url(page).search,
  );
  const before = await page.locator("[data-cut]").count();
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => document.querySelectorAll("#filtro-mercado").length <= 1);
  await page.waitForTimeout(300);
  const after = await page.locator("[data-cut]").count();
  check("filtros: al recargar se conserva el resultado", before === after && after > 0, `${before} → ${after}`);
  const chipCount = await page.getByRole("button", { name: /^Quitar filtro/ }).count();
  check("filtros: chips de filtros activos", chipCount === 3, String(chipCount));
  await page.getByRole("button", { name: "Quitar filtro: Sin hueso" }).click();
  check("filtros: quitar un chip actualiza la URL", !url(page).searchParams.has("bone"), url(page).search);
  await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
  check("filtros: 'Limpiar filtros' deja la URL limpia", url(page).search === "", url(page).search);

  // Especie: cambia diagrama y lista, y descarta la zona.
  await open(page, `/es/productos?zone=loin`);
  await page.locator('button[aria-pressed]:has-text("Ovino")').click();
  await page.waitForTimeout(150);
  check(
    "especie: Ovino cambia URL y descarta la zona",
    url(page).searchParams.get("species") === "lamb" && !url(page).searchParams.has("zone"),
    url(page).search,
  );
  const lambCuts = await page.locator("[data-cut^=lamb_]").count();
  const beefCuts = await page.locator("[data-cut^=beef_]").count();
  check("especie: solo cortes ovinos", lambCuts === 10 && beefCuts === 0, `${lambCuts}/${beefCuts}`);

  // ─── 3. Estado vacío ─────────────────────────────────────────────────────
  await open(page, `/es/productos?species=lamb&zone=shank&presentation=chilled`);
  check("vacío: mensaje", await page.getByText("No hay cortes con esta combinación").isVisible());
  const suggest = page.getByRole("button", { name: /^Quitar «/ });
  check("vacío: sugiere quitar un filtro", (await suggest.count()) === 1);
  await suggest.click();
  await page.waitForTimeout(200);
  check("vacío: la sugerencia devuelve resultados", (await page.locator("[data-cut]").count()) > 0);

  // ─── 4. Cambio de idioma conservando corte y filtros ────────────────────
  await open(page, `/es/productos?species=lamb&zone=leg&market=eu`);
  const enHref = await page.locator('a[hreflang="en"]').first().getAttribute("href");
  check("idioma: catálogo conserva filtros", enHref === "/en/products?species=lamb&zone=leg&market=eu", String(enHref));
  await page.locator('a[hreflang="en"]').first().click();
  await page.waitForURL(/\/en\/products/);
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.waitForFunction(() => document.querySelectorAll("#filtro-mercado").length <= 1);
  check("idioma: tras el clic, una sola página (un h1, lang=en)", (await page.locator("h1").count()) === 1);
  check(
    "idioma: en EN se ven los mismos filtros",
    (await page.locator('g[data-zone="leg"]').getAttribute("aria-pressed")) === "true" &&
      (await page.locator("#filtro-mercado").inputValue()) === "eu",
  );

  await open(page, `/es`);
  await page.locator('a[hreflang="en"]').first().click();
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.waitForTimeout(300);
  check("idioma: home ES → EN deja un solo h1", (await page.locator("h1").count()) === 1, String(await page.locator("h1").count()));

  await open(page, `/es/productos/vacuno/tapa-de-cuadril`);
  const cutHref = await page.locator('a[hreflang="en"]').first().getAttribute("href");
  check("idioma: detalle lleva al mismo corte", cutHref === "/en/products/beef/rump-cap", String(cutHref));
  await page.locator('a[hreflang="en"]').first().click();
  await page.waitForURL(/\/en\/products\/beef\/rump-cap/);
  check("idioma: clic en EN abre el corte en inglés", (await page.locator("h1").textContent()) === "Rump Cap" && (await page.locator("h1").count()) === 1);
  await open(page, `/es/productos/vacuno/tapa-de-cuadril`);
  const alternates = await page.$$eval('link[rel=alternate][hreflang]', (ls) =>
    ls.map((l) => `${l.getAttribute("hreflang")}=${new URL(l.getAttribute("href")!).pathname}`).sort(),
  );
  check(
    "detalle: hreflang con slug traducido",
    alternates.includes("en=/en/products/beef/rump-cap") && alternates.includes("es=/es/productos/vacuno/tapa-de-cuadril"),
    alternates.join(" "),
  );
  check("detalle: un solo h1", (await page.locator("h1").count()) === 1);
  check("detalle: breadcrumb", (await page.locator('nav[aria-label="Ruta de navegación"] [aria-current=page]').count()) === 1);
  const mini = await page.locator('svg[role=img] g[data-zone="rump"] path').first().getAttribute("fill");
  check("detalle: mini-diagrama resalta la zona", !!mini?.startsWith("url(#hatch"), String(mini));
  const mailto = await page.locator('a[href^="mailto:"]', { hasText: "Pedir cotización" }).first().getAttribute("href");
  check(
    "detalle: cotización por mail con [Demo] y el corte",
    !!mailto && decodeURIComponent(mailto).includes("[Demo] Cotización: Tapa de cuadril"),
    mailto ? decodeURIComponent(mailto) : "",
  );
  // Con Cache Components no existe dynamicParams=false: el primer pedido a un slug desconocido
  // sale del shell genérico de la ruta (200) con la página 404 y noindex; los siguientes, 404.
  const slug = `no-existe-${Date.now()}`;
  const firstStatus = (await open(page, `/es/productos/vacuno/${slug}`))?.status();
  const notFoundShown = await page.getByText("No encontramos esta página").isVisible();
  const noindex = (await page.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex");
  const secondStatus = (await open(page, `/es/productos/vacuno/${slug}`))?.status();
  check("detalle: corte inexistente muestra la 404 con noindex", notFoundShown && !!noindex);
  console.log(`  · status corte inexistente: 1.er pedido ${firstStatus}, 2.º ${secondStatus}`);

  // ─── 5. Móvil, imágenes ─────────────────────────────────────────────────
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  for (const path of ["/es/productos", "/en/products?species=lamb", "/en/products/lamb/frenched-rack", "/es"]) {
    await open(mobile, `${path}`);
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`móvil 375: sin scroll horizontal ${path}`, overflow <= 0, String(overflow));
    const noAlt = await mobile.$$eval("img", (imgs) => imgs.filter((i) => !i.getAttribute("alt")).length);
    check(`imágenes con alt ${path}`, noAlt === 0, String(noAlt));
  }
  await open(mobile, `/es/productos`);
  const chipH = await mobile
    .locator('[role=group][aria-label="Zonas"] button')
    .first()
    .evaluate((b) => b.getBoundingClientRect().height);
  check("móvil: chips de zona de al menos 44 px", chipH >= 44, String(chipH));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.ok || !r.detail ? "" : ` — ${r.detail}`}`);
  console.log(`\n${results.length - failed.length}/${results.length} verificaciones OK`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
