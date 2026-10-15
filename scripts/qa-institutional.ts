/**
 * QA de las páginas institucionales (fase 3): la lista de mercados coincide con el mapa,
 * los links al catálogo filtrado funcionan, los popups se abren con teclado, sin salto de
 * layout al cargar el mapa y sin scroll horizontal a 375 px.
 *   npm run qa:institutional -- <url-base>
 */
import { chromium, type Page } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

const pages = {
  es: { markets: "/es/mercados", quality: "/es/calidad", company: "/es/empresa", products: "/es/productos" },
  en: { markets: "/en/markets", quality: "/en/quality", company: "/en/company", products: "/en/products" },
} as const;

async function waitMap(p: Page) {
  await p.waitForSelector("[data-market]", { timeout: 20_000 });
  await p.waitForTimeout(300);
}

async function main() {
  const browser = await chromium.launch();

  for (const [locale, path] of Object.entries(pages)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    // Salto de layout acumulado durante la carga del mapa.
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${base}${path.markets}`, { waitUntil: "load" });
    await waitMap(page);

    // ─── 1. La lista coincide con el mapa ───────────────────────────────
    const markers = await page.$$eval("[data-market]", (els) =>
      els.map((e) => ({ id: e.getAttribute("data-market")!, label: e.getAttribute("aria-label") ?? "" })),
    );
    const rows = await page.$$eval("[data-market-row]", (els) =>
      els.map((e) => ({
        id: e.getAttribute("data-market-row")!,
        name: e.querySelector("h3")?.textContent?.trim() ?? "",
        share: e.querySelector("[data-share]")?.textContent?.trim() ?? "",
      })),
    );
    check(`${locale} mercados: 8 filas y 8 marcadores`, rows.length === 8 && markers.length === 8, `${rows.length}/${markers.length}`);
    const mismatches = rows.filter((r) => {
      const m = markers.find((x) => x.id === r.id);
      return !m || !m.label.includes(r.name) || !m.label.includes(r.share);
    });
    check(`${locale} mercados: nombre y porcentaje iguales en lista y mapa`, mismatches.length === 0, JSON.stringify(mismatches));
    const shares = rows.map((r) => parseFloat(r.share.replace(",", ".")));
    check(`${locale} mercados: lista ordenada por participación`, shares.every((s, i) => i === 0 || shares[i - 1] >= s), shares.join(" "));
    const attribution = (await page.locator(".leaflet-control-attribution").textContent()) ?? "";
    check(`${locale} mapa: atribución de OpenStreetMap visible`, attribution.includes("OpenStreetMap"), attribution);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    check(`${locale} mapa: sin salto de layout al cargar (CLS < 0,05)`, cls < 0.05, cls.toFixed(3));

    // ─── 2. Popups con teclado ──────────────────────────────────────────
    const first = rows[0].id;
    await page.locator(`[data-market="${first}"]`).focus();
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-market"));
    check(`${locale} mapa: el marcador recibe foco`, focused === first, String(focused));
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const popup = page.locator(`[data-popup="${first}"]`);
    check(`${locale} mapa: Enter abre el popup`, await popup.isVisible());
    const popupText = (await popup.textContent()) ?? "";
    check(`${locale} mapa: popup con porcentaje`, popupText.includes(rows[0].share), popupText.slice(0, 80));
    const popupLink = await popup.locator('a[href*="market="]').getAttribute("href");
    check(`${locale} mapa: popup enlaza al catálogo filtrado`, popupLink === `${path.products}?market=${first}`, String(popupLink));
    const inPopup = await page.evaluate(() => !!document.activeElement?.closest(".leaflet-popup"));
    check(`${locale} mapa: al abrir, el foco pasa al popup`, inPopup);
    await page.keyboard.press("Tab");
    const stillInPopup = await page.evaluate(() => !!document.activeElement?.closest(".leaflet-popup"));
    check(`${locale} mapa: Tab recorre los links del popup`, stillInPopup);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const back = await page.evaluate(() => document.activeElement?.getAttribute("data-market"));
    check(`${locale} mapa: Escape cierra y devuelve el foco al marcador`, back === first && !(await popup.isVisible()), String(back));
    // Tab hasta otro marcador y Enter abre su popup
    await page.locator(`[data-market="${rows[1].id}"]`).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    check(`${locale} mapa: otro marcador abre su popup`, await page.locator(`[data-popup="${rows[1].id}"]`).isVisible());

    // ─── 3. Links al catálogo filtrado ──────────────────────────────────
    const listLinks = await page.$$eval("[data-market-row]", (els) =>
      els.map((e) => [e.getAttribute("data-market-row"), e.querySelector('a[href*="market="]')?.getAttribute("href")]),
    );
    const badLinks = listLinks.filter(([id, href]) => href !== `${path.products}?market=${id}`);
    check(`${locale} lista: cada mercado enlaza a su catálogo filtrado`, badLinks.length === 0, JSON.stringify(badLinks));
    for (const id of ["jp", "il"]) {
      await page.goto(`${base}${path.products}?market=${id}`, { waitUntil: "load" });
      await page.waitForFunction(() => document.querySelectorAll("#filtro-mercado").length <= 1);
      await page.waitForTimeout(200);
      const value = await page.locator("#filtro-mercado").inputValue();
      const cards = await page.locator("[data-cut]").count();
      check(`${locale} catálogo ?market=${id}: filtro aplicado y con resultados`, value === id && cards > 0, `${value} · ${cards}`);
    }
    await page.goto(`${base}${path.quality}`, { waitUntil: "load" });
    const certLinks = await page.$$eval('section[aria-labelledby="certifications"] a[href*="market="]', (as) => as.map((a) => a.getAttribute("href")));
    const okCert = certLinks.length > 0 && certLinks.every((h) => /\?market=(cn|eu|us|il|br|uk|ca|jp)$/.test(h ?? "") && h!.startsWith(path.products));
    check(`${locale} calidad: mercados de cada certificación enlazan al catálogo`, okCert, `${certLinks.length} links`);
    const certs = await page.locator('[id^="cert-"]').count();
    check(`${locale} calidad: 6 certificaciones con ancla propia`, certs === 6, String(certs));
    await page.close();

    // ─── 4. Sin scroll horizontal a 375 px ──────────────────────────────
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
    for (const p of [path.markets, path.quality, path.company, `/${locale}`]) {
      await mobile.goto(`${base}${p}`, { waitUntil: "load" });
      if (p === path.markets) await waitMap(mobile);
      await mobile.waitForTimeout(200);
      const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`${locale} 375 px sin scroll horizontal: ${p}`, overflow <= 0, String(overflow));
      const h1 = await mobile.locator("h1").count();
      check(`${locale} un solo h1: ${p}`, h1 === 1, String(h1));
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
