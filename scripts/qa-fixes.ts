/**
 * Capturas y verificaciones de las correcciones de fase 1/2 (revisión de la fase 2):
 * menú móvil sin scroll a 375×667, catálogo móvil (mini-siluetas, drawer de filtros,
 * primer corte visible), diagrama con garrón seleccionado, banda de cifras.
 *   npm run qa:fixes -- <url-base>
 * Capturas en screenshots/fixes/.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";
import { settlePage } from "./settle";

const base = process.argv[2] ?? "http://localhost:3000";
const out = join(process.cwd(), "screenshots", "fixes");
mkdirSync(out, { recursive: true });
const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) =>
  results.push({ name, ok, detail });

async function open(p: Page, path: string) {
  await p.goto(`${base}${path}`, { waitUntil: "load" });
  await p.waitForFunction(
    () => document.querySelectorAll("#filtro-mercado").length <= 1,
  );
  await p.waitForTimeout(300);
}

async function main() {
  const browser = await chromium.launch();
  for (const locale of ["es", "en"] as const) {
    const products = locale === "es" ? "/es/productos" : "/en/products";

    // ─── Menú móvil a 375×667: todo visible sin scroll ─────────────────────
    const small = await browser.newPage({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    await open(small, `/${locale}`);
    await small.locator("header button[aria-expanded]").last().click();
    await small.waitForTimeout(300);
    const menu = await small.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const scroller = dialog?.querySelector(
        ".overflow-y-auto",
      ) as HTMLElement | null;
      const last = [...(dialog?.querySelectorAll("a") ?? [])]
        .at(-1)
        ?.getBoundingClientRect();
      return {
        overflow: scroller ? scroller.scrollHeight - scroller.clientHeight : -1,
        lastBottom: last?.bottom ?? 0,
      };
    });
    check(
      `${locale} menú 375×667: sin scroll`,
      menu.overflow <= 0 && menu.lastBottom <= 667,
      JSON.stringify(menu),
    );
    await small.screenshot({ path: join(out, `${locale}_menu-375x667.png`) });

    // ─── Catálogo móvil: primer corte cerca del diagrama ───────────────────
    await open(small, products);
    const layout = await small.evaluate(() => {
      const svg = document
        .querySelector("section svg[role=group]")!
        .getBoundingClientRect();
      const card = document
        .querySelector("[data-cut]")!
        .getBoundingClientRect();
      return {
        diagramBottom: Math.round(svg.bottom + scrollY),
        cardTop: Math.round(card.top + scrollY),
      };
    });
    const gap = layout.cardTop - layout.diagramBottom;
    check(
      `${locale} catálogo 375: primer corte a ≤ 260 px del diagrama`,
      gap <= 260,
      `${gap} px`,
    );
    const cardSvg = await small.locator("[data-cut] svg[role=img]").count();
    const cardImg = await small.locator("[data-cut] img").count();
    check(
      `${locale} catálogo: tarjetas con mini-silueta y sin foto`,
      cardSvg > 0 && cardImg === 0,
      `${cardSvg} svg / ${cardImg} img`,
    );
    const label = await small
      .locator("[data-cut] svg[role=img]")
      .first()
      .getAttribute("aria-label");
    check(
      `${locale} catálogo: mini-silueta con nombre accesible`,
      !!label && label.length > 10,
      String(label),
    );
    const specsDetails = await small.locator("details:visible").count();
    check(
      `${locale} catálogo 375: presentaciones plegadas`,
      specsDetails === 1,
    );
    await settlePage(small);
    await small.screenshot({
      path: join(out, `${locale}_catalogo-375.png`),
      fullPage: true,
    });
    await small.screenshot({
      path: join(out, `${locale}_catalogo-375-pantalla.png`),
    });

    // ─── Drawer de filtros ──────────────────────────────────────────────────
    const trigger = small.locator("button[aria-controls][aria-expanded]", {
      hasText: locale === "es" ? "Filtros" : "Filters",
    });
    await trigger.click();
    await small.waitForTimeout(200);
    const dialog = small.locator('[role="dialog"][aria-modal="true"]');
    check(
      `${locale} drawer: abre como diálogo modal`,
      (await dialog.count()) === 1,
    );
    const focusInside = await small.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    );
    check(`${locale} drawer: el foco entra al panel`, focusInside);
    await small.selectOption("#filtro-mercado", "eu");
    await small.waitForTimeout(150);
    await small.screenshot({ path: join(out, `${locale}_drawer-375.png`) });
    await small.keyboard.press("Escape");
    await small.waitForTimeout(150);
    check(`${locale} drawer: Escape cierra`, (await dialog.count()) === 0);
    const backFocus = await small.evaluate(
      () => document.activeElement?.getAttribute("aria-controls") !== null,
    );
    check(`${locale} drawer: el foco vuelve al botón`, backFocus);
    check(
      `${locale} drawer: el botón cuenta los filtros`,
      /\(1\)/.test((await trigger.textContent()) ?? ""),
      String(await trigger.textContent()),
    );
    check(
      `${locale} drawer: filtro aplicado en la URL`,
      new URL(small.url()).searchParams.get("market") === "eu",
      small.url(),
    );
    await small.close();

    // ─── Catálogo vacuno completo a 375 px: tarjetas compactas horizontales ──
    const phone = await browser.newPage({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
    });
    await open(phone, `${products}?species=beef`);
    await settlePage(phone);
    const compact = await phone.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>("[data-cut]")];
      const horizontal = cards.every((c) => {
        const svg = c.querySelector("svg[role=img]")!.getBoundingClientRect();
        const h = c.querySelector("h2, h3")!.getBoundingClientRect();
        return svg.right <= h.left && svg.width <= 120;
      });
      const heights = cards.map((c) => c.getBoundingClientRect().height);
      const list = cards[0].closest("ul")!.getBoundingClientRect().height;
      return {
        count: cards.length,
        horizontal,
        maxHeight: Math.round(Math.max(...heights)),
        list: Math.round(list),
      };
    });
    check(
      `${locale} catálogo vacuno 375: 26 cortes`,
      compact.count === 26,
      String(compact.count),
    );
    check(
      `${locale} catálogo vacuno 375: tarjetas horizontales con silueta a la izquierda`,
      compact.horizontal,
    );
    check(
      `${locale} catálogo vacuno 375: tarjetas compactas (≤ 170 px)`,
      compact.maxHeight <= 170,
      `${compact.maxHeight} px`,
    );
    check(
      `${locale} catálogo vacuno 375: listado ≤ 4.500 px`,
      compact.list <= 4500,
      `${compact.list} px`,
    );
    await phone.screenshot({
      path: join(out, `${locale}_catalogo-vacuno-375.png`),
      fullPage: true,
    });
    await phone
      .locator('[data-cut="beef_brisket"]')
      .screenshot({ path: join(out, `${locale}_tarjeta-pecho-375.png`) });

    // ─── Home a 375 px: todas las fotos cargadas (bloque de origen incluido) ──
    await open(phone, `/${locale}`);
    await settlePage(phone);
    const origin = await phone
      .locator("#origen")
      .locator("xpath=ancestor::section")
      .locator("img")
      .evaluate((img: HTMLImageElement) => ({
        loaded: img.complete && img.naturalWidth > 0,
        // next/image (componente) saca el blur en onLoad: si sigue, la foto no terminó.
        blur: img.style.backgroundImage.includes("data:"),
        width: img.naturalWidth,
      }));
    check(
      `${locale} home 375: foto de origen cargada y sin blur`,
      origin.loaded && !origin.blur,
      JSON.stringify(origin),
    );
    await phone.close();

    // ─── Escritorio: diagrama con garrón seleccionado, catálogo ─────────────
    const desk = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await open(desk, `${products}?zone=shank`);
    const pills = await desk
      .locator("svg[role=group] rect.fill-brand-900")
      .count();
    check(
      `${locale} diagrama: etiquetas seleccionadas con pastilla (brazuelo y garrón)`,
      pills === 2,
      String(pills),
    );
    const strokeText = await desk.evaluate(() =>
      [...document.querySelectorAll("svg[role=group] text.fill-white")].some(
        (t) =>
          getComputedStyle(t).strokeWidth !== "0px" &&
          getComputedStyle(t).stroke !== "none",
      ),
    );
    check(`${locale} diagrama: texto seleccionado sin contorno`, !strokeText);
    await desk
      .locator("svg[role=group]")
      .screenshot({ path: join(out, `${locale}_diagrama-garron.png`) });
    await open(desk, `${products}?species=lamb&zone=shank`);
    await desk
      .locator("svg[role=group]")
      .screenshot({ path: join(out, `${locale}_diagrama-ovino-garron.png`) });
    await open(desk, products);
    await settlePage(desk);
    const deskCard = await desk
      .locator("[data-cut]")
      .first()
      .evaluate((el) => getComputedStyle(el).flexDirection);
    check(
      `${locale} catálogo 1440: tarjeta vertical como antes`,
      deskCard === "column",
      deskCard,
    );
    await desk.screenshot({
      path: join(out, `${locale}_catalogo-1440.png`),
      fullPage: true,
    });

    // ─── Banda de cifras: rótulos ≥ 14 px y contraste ──────────────────────
    await open(desk, `/${locale}`);
    const dt = await desk
      .locator("#cifras ~ dl dt")
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { size: parseFloat(cs.fontSize), color: cs.color };
      });
    check(
      `${locale} cifras: rótulos ≥ 14 px`,
      dt.size >= 14,
      JSON.stringify(dt),
    );
    await desk
      .locator("#cifras")
      .locator("..")
      .screenshot({ path: join(out, `${locale}_cifras-1440.png`) });
    await desk.close();
  }
  await browser.close();

  const failed = results.filter((r) => !r.ok);
  for (const r of results)
    console.log(
      `${r.ok ? "✓" : "✗"} ${r.name}${r.ok || !r.detail ? "" : ` — ${r.detail}`}`,
    );
  console.log(
    `\n${results.length - failed.length}/${results.length} verificaciones OK`,
  );
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
