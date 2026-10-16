/**
 * QA de las páginas institucionales: la lista de mercados coincide con el mapa SVG, el mapa se
 * recorre con teclado (foco → panel, Enter → panel, Escape → mercado), hover resalta todos los
 * países de un mercado, links al catálogo filtrado, grupos de certificaciones, cifras iguales en
 * home y mercados, sin salto de layout y sin scroll horizontal a 375 px.
 *   npm run qa:institutional -- <url-base>
 * Capturas del mapa con un mercado enfocado en screenshots/institutional/.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { settlePage } from "./settle";

const base = process.argv[2] ?? "http://localhost:3000";
const out = join(process.cwd(), "screenshots", "institutional");
mkdirSync(out, { recursive: true });
const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

const pages = {
  es: { markets: "/es/mercados", quality: "/es/calidad", company: "/es/empresa", products: "/es/productos", home: "/es" },
  en: { markets: "/en/markets", quality: "/en/quality", company: "/en/company", products: "/en/products", home: "/en" },
} as const;

/** Lo que cada mercado tiene que exigir (seed de certificaciones). */
const REQUIRED: Record<string, string[]> = { cn: ["haccp", "china"], uk: ["haccp", "brcgs", "halal", "uk"], me: ["haccp", "halal"], eu: ["haccp", "brcgs", "halal", "eu"] };

const marker = (id: string) => `svg.market-map [data-market="${id}"]`;

async function main() {
  const browser = await chromium.launch();

  for (const [locale, path] of Object.entries(pages)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${base}${path.markets}`, { waitUntil: "load" });
    await page.waitForTimeout(500);

    // ─── 1. El mapa viene en el HTML y coincide con la lista ───────────────
    const html = await (await page.request.get(`${base}${path.markets}`)).text();
    check(`${locale} mapa: SVG renderizado en el servidor (en el HTML)`, html.includes("market-map") && html.includes('data-market="cn"'));
    const markers = await page.$$eval("svg.market-map [data-market]", (els) =>
      els.map((e) => ({ id: e.getAttribute("data-market")!, label: e.getAttribute("aria-label") ?? "", paths: e.querySelectorAll("path").length })),
    );
    const rows = await page.$$eval("[data-market-row]", (els) =>
      els.map((e) => ({
        id: e.getAttribute("data-market-row")!,
        name: e.querySelector("h3")?.textContent?.trim() ?? "",
        share: e.querySelector("[data-share]")?.textContent?.trim() ?? "",
      })),
    );
    check(`${locale} mercados: 9 filas y 9 mercados en el mapa`, rows.length === 9 && markers.length === 9, `${rows.length}/${markers.length}`);
    const mismatches = rows.filter((r) => {
      const m = markers.find((x) => x.id === r.id);
      return !m || !m.label.includes(r.name) || !m.label.includes(r.share);
    });
    check(`${locale} mercados: nombre y porcentaje iguales en lista y mapa`, mismatches.length === 0, JSON.stringify(mismatches));
    const shares = rows.map((r) => parseFloat(r.share.replace(",", ".")));
    check(`${locale} mercados: lista ordenada por participación`, shares.every((s, i) => i === 0 || shares[i - 1] >= s), shares.join(" "));
    const others = (await page.locator("[data-market-row]").last().locator("xpath=ancestor::section").locator("ol + p").textContent()) ?? "";
    check(`${locale} mercados: participaciones del seed (36·17·14·8·5·5·4·4·3 + otros 4)`, shares.join(",") === "36,17,14,8,5,5,4,4,3" && /4\s?%/.test(others), `${shares.join(",")} · ${others}`);
    const eu = markers.find((m) => m.id === "eu");
    const me = markers.find((m) => m.id === "me");
    check(`${locale} mapa: un elemento por mercado (UE y Medio Oriente agrupan varios países)`, (eu?.paths ?? 0) >= 20 && me?.paths === 4, `UE ${eu?.paths} · MO ${me?.paths}`);
    const attribution = (await page.locator("[data-attribution]").textContent()) ?? "";
    check(`${locale} mapa: atribución de Natural Earth visible`, attribution.includes("Natural Earth") && (await page.locator("[data-attribution]").isVisible()), attribution);
    check(`${locale} mapa: sin Leaflet ni teselas`, (await page.locator(".leaflet-container, img.leaflet-tile").count()) === 0);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    check(`${locale} mapa: sin salto de layout (CLS < 0,05)`, cls < 0.05, cls.toFixed(3));

    // ─── 2. Teclado y hover ────────────────────────────────────────────────
    const first = rows[0].id;
    await page.locator(marker(first)).focus();
    await page.waitForTimeout(150);
    check(`${locale} mapa: el mercado recibe foco`, (await page.evaluate(() => document.activeElement?.getAttribute("data-market"))) === first);
    const panel = page.locator("#market-panel");
    check(`${locale} mapa: el foco muestra el mercado en el panel`, (await panel.getAttribute("data-panel")) === first && ((await panel.textContent()) ?? "").includes(rows[0].share));
    check(`${locale} mapa: aria-expanded en el mercado activo`, (await page.locator(marker(first)).getAttribute("aria-expanded")) === "true");
    await page.locator(marker(first)).screenshot({ path: join(out, `${locale}_marker-focus.png`) }).catch(() => {});
    await page.locator("svg.market-map").locator("xpath=ancestor::section").screenshot({ path: join(out, `${locale}_mapa-mercado-enfocado-1440.png`) });

    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    const inPanel = await page.evaluate(() => !!document.activeElement?.closest("#market-panel"));
    check(`${locale} mapa: Enter pasa el foco al panel`, inPanel);
    await page.keyboard.press("Tab");
    const link = await page.evaluate(() => (document.activeElement?.closest("#market-panel") ? document.activeElement?.getAttribute("href") : null));
    check(`${locale} mapa: Tab recorre los links del panel`, !!link, String(link));
    const catalogLink = await panel.locator('a[href*="market="]').getAttribute("href");
    check(`${locale} mapa: el panel enlaza al catálogo filtrado`, catalogLink === `${path.products}?market=${first}`, String(catalogLink));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
    check(`${locale} mapa: Escape devuelve el foco al mercado`, (await page.evaluate(() => document.activeElement?.getAttribute("data-market"))) === first);

    await page.locator(marker("eu")).locator("path").nth(5).hover();
    await page.waitForTimeout(250);
    const euFills = await page.$$eval(`${marker("eu")} path`, (ps) => [...new Set(ps.map((p) => getComputedStyle(p).fill))]);
    const otherFill = await page.$eval(`${marker("us")} path`, (p) => getComputedStyle(p).fill);
    check(`${locale} mapa: hover resalta todos los países de la UE por igual`, euFills.length === 1 && euFills[0] !== otherFill, `${euFills.join(" | ")} vs ${otherFill}`);
    check(`${locale} mapa: hover muestra la UE en el panel`, (await panel.getAttribute("data-panel")) === "eu");

    // ─── 3. Certificaciones requeridas por mercado ─────────────────────────
    for (const [id, certs] of Object.entries(REQUIRED)) {
      const hrefs = await page.$$eval(`[data-market-row="${id}"] a[href*="#cert-"]`, (as) => as.map((a) => a.getAttribute("href")!.split("#cert-")[1]));
      check(`${locale} mercados: ${id} exige ${certs.join(" + ")}`, hrefs.sort().join(",") === [...certs].sort().join(","), hrefs.join(","));
    }
    const listLinks = await page.$$eval("[data-market-row]", (els) =>
      els.map((e) => [e.getAttribute("data-market-row"), e.querySelector('a[href*="market="]')?.getAttribute("href")]),
    );
    const badLinks = listLinks.filter(([id, href]) => href !== `${path.products}?market=${id}`);
    check(`${locale} lista: cada mercado enlaza a su catálogo filtrado`, badLinks.length === 0, JSON.stringify(badLinks));
    for (const id of ["me", "jp"]) {
      await page.goto(`${base}${path.products}?market=${id}`, { waitUntil: "load" });
      await page.waitForFunction(() => document.querySelectorAll("#filtro-mercado").length <= 1);
      await page.waitForTimeout(200);
      const value = await page.locator("#filtro-mercado").inputValue();
      const cards = await page.locator("[data-cut]").count();
      check(`${locale} catálogo ?market=${id}: filtro aplicado y con resultados`, value === id && cards > 0, `${value} · ${cards}`);
    }

    // ─── 4. Calidad: dos grupos ────────────────────────────────────────────
    await page.goto(`${base}${path.quality}`, { waitUntil: "load" });
    const groups = await page.$$eval("[data-cert-group]", (gs) => gs.map((g) => [g.getAttribute("data-cert-group"), [...g.querySelectorAll('[id^="cert-"]')].map((h) => h.id)]));
    check(
      `${locale} calidad: certificaciones (HACCP, BRCGS, Halal, Kosher) y habilitaciones (UE, Reino Unido, USDA, China)`,
      JSON.stringify(groups) === JSON.stringify([["certification", ["cert-haccp", "cert-brcgs", "cert-halal", "cert-kosher"]], ["approval", ["cert-eu", "cert-uk", "cert-usda", "cert-china"]]]),
      JSON.stringify(groups),
    );
    const halal = await page.$$eval('#cert-halal >> xpath=ancestor::li[1] >> a[href*="market="]', (as) => as.map((a) => a.getAttribute("href")!.split("market=")[1]));
    check(`${locale} calidad: Halal vinculada a Medio Oriente, UE, Reino Unido y Canadá`, halal.sort().join(",") === "ca,eu,me,uk", halal.join(","));
    const ukOnEu = await page.$$eval('#cert-eu >> xpath=ancestor::li[1] >> a[href*="market="]', (as) => as.map((a) => a.getAttribute("href")!.split("market=")[1]));
    check(`${locale} calidad: la habilitación UE no incluye al Reino Unido`, ukOnEu.join(",") === "eu", ukOnEu.join(","));
    const label = locale === "es" ? "Mercados" : "Markets";
    const labels = await page.$$eval("[data-cert-group] li p.uppercase", (ps) => [...new Set(ps.map((p) => p.textContent?.trim()))]);
    check(`${locale} calidad: rótulo "${label}"`, labels.length === 1 && labels[0] === label, labels.join(" | "));

    // ─── 5. Home y mercados coinciden ──────────────────────────────────────
    await page.goto(`${base}${path.home}`, { waitUntil: "load" });
    const homeShares = await page.$$eval("[data-market-preview] [data-share]", (els) => els.map((e) => e.textContent?.trim()));
    check(`${locale} home: top 5 de mercados igual a la lista`, homeShares.join(",") === rows.slice(0, 5).map((r) => r.share).join(","), `${homeShares.join(",")} vs ${rows.slice(0, 5).map((r) => r.share).join(",")}`);
    const homeCerts = await page.locator('[aria-labelledby="certificaciones"] li').count();
    check(`${locale} home: franja con las 8 certificaciones y habilitaciones`, homeCerts === 8, String(homeCerts));
    await page.close();

    // ─── 6. Móvil: tocar un mercado lleva a su fila; sin scroll horizontal ─
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
    await mobile.goto(`${base}${path.markets}`, { waitUntil: "load" });
    await mobile.waitForTimeout(300);
    check(`${locale} 375 px: panel lateral oculto (la lista es la vía principal)`, !(await mobile.locator("#market-panel").isVisible()));
    await mobile.locator(marker("cn")).click();
    await mobile.waitForTimeout(900);
    const row = await mobile.evaluate(() => ({ active: document.activeElement?.id, top: document.getElementById("market-cn")?.getBoundingClientRect().top ?? -1 }));
    check(`${locale} 375 px: tocar China lleva a su fila de la lista`, row.active === "market-cn" && row.top >= 0 && row.top < 300, JSON.stringify(row));
    await mobile.evaluate(() => window.scrollTo(0, 0));
    await settlePage(mobile);
    await mobile.locator(marker("eu")).focus();
    await mobile.locator("svg.market-map").locator("xpath=ancestor::section").screenshot({ path: join(out, `${locale}_mapa-mercado-enfocado-375.png`) });
    for (const p of [path.markets, path.quality, path.company, path.home]) {
      await mobile.goto(`${base}${p}`, { waitUntil: "load" });
      await mobile.waitForTimeout(200);
      const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`${locale} 375 px sin scroll horizontal: ${p}`, overflow <= 0, String(overflow));
      check(`${locale} un solo h1: ${p}`, (await mobile.locator("h1").count()) === 1);
    }
    await mobile.close();
  }

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
