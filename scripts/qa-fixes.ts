/**
 * Capturas y verificaciones de las correcciones de fase 1/2 (revisión de la fase 2):
 * menú móvil sin scroll a 375×667, catálogo móvil (mini-siluetas, drawer de filtros,
 * primer corte visible), diagrama con garrón seleccionado, banda de cifras; filas deslizables en
 * móvil (chips de zonas y pestañas: sin barra, degradado en los bordes, zona elegida a la vista).
 *   npm run qa:fixes -- <url-base>
 * Capturas en screenshots/fixes/.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";
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

// ─── Filas con desplazamiento horizontal en móvil (chips de zonas, pestañas) ──
// Emulación de teléfono (isMobile + hasTouch, 375 px). Dentro de page.evaluate, sin funciones con
// nombre (tsx inyecta __name): por eso los evaluate van como string.
const ROW_STATE = `((sel) => {
  const el = document.querySelector(sel);
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const card = el.closest('.rounded-lg');
  const c = card ? card.getBoundingClientRect() : r;
  const title = card ? card.querySelector('h2').getBoundingClientRect() : r;
  const kids = [...el.children].map((k) => { const b = k.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, height: b.height, font: parseFloat(getComputedStyle(k).fontSize) }; });
  return {
    scrollbarWidth: cs.scrollbarWidth,
    scrollbarSpace: el.offsetHeight - el.clientHeight - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth),
    overflow: el.scrollWidth - el.clientWidth,
    scrollLeft: el.scrollLeft,
    fadeStart: el.hasAttribute('data-fade-start'),
    fadeEnd: el.hasAttribute('data-fade-end'),
    fadeStartWidth: cs.getPropertyValue('--fade-start').trim(),
    fadeEndWidth: cs.getPropertyValue('--fade-end').trim(),
    mask: cs.maskImage || cs.webkitMaskImage || '',
    row: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
    card: { left: c.left, right: c.right, bottom: c.bottom, radius: card ? parseFloat(getComputedStyle(card).borderBottomLeftRadius) : 0 },
    titleLeft: title.left,
    kids,
  };
})`;
type Box = { left: number; right: number; top: number; bottom: number };
type RowState = {
  scrollbarWidth: string;
  scrollbarSpace: number;
  overflow: number;
  scrollLeft: number;
  fadeStart: boolean;
  fadeEnd: boolean;
  fadeStartWidth: string;
  fadeEndWidth: string;
  mask: string;
  row: Box;
  card: { left: number; right: number; bottom: number; radius: number };
  titleLeft: number;
  kids: (Box & { height: number; font: number })[];
};
const rowState = (p: Page, sel: string) => p.evaluate(`${ROW_STATE}(${JSON.stringify(sel)})`) as Promise<RowState>;
const FADE = 24; // 1.5rem: ancho del degradado (utilidad scroll-row de globals.css)

/** Captura de la fila (ancho completo, con el borde inferior de la tarjeta). */
async function rowShot(p: Page, sel: string, file: string) {
  // Solo desplazamiento vertical de la página (scrollIntoView movería también la fila).
  await p.evaluate(
    `window.scrollBy({ top: document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top - 360, behavior: 'instant' })`,
  );
  await p.waitForTimeout(150);
  const s = await rowState(p, sel);
  const top = Math.max(0, s.row.top - 20);
  const bottom = Math.min(s.card.bottom + 16, s.row.bottom + 28);
  await p.screenshot({ path: join(out, file), clip: { x: 0, y: top, width: 375, height: bottom - top } });
}

async function scrollRows(browser: Browser, locale: "es" | "en") {
  const products = locale === "es" ? "/es/productos" : "/en/products";
  const sel = "[data-zone-chips]";
  for (const reduced of [false, true]) {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 740 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    // Headless no anima el scroll suave: se registra el behavior pedido.
    await ctx.addInitScript(`(() => {
      const orig = Element.prototype.scrollBy;
      Element.prototype.scrollBy = function (o) { window.__rowScroll = (o && o.behavior) || 'auto'; return orig.apply(this, arguments); };
    })()`);
    const p = await ctx.newPage();
    await open(p, products);
    // Zona a tocar: la más cercana al final de la fila cuyo polígono se puede tocar en el centro de
    // su caja (garrón y brazuelo son dos piezas separadas: el centro cae entre ellas).
    await p.evaluate(
      `window.scrollBy({ top: document.querySelector('svg[role=group]').getBoundingClientRect().top - 90, behavior: 'instant' })`,
    );
    await p.waitForTimeout(150);
    const pick = (await p.evaluate(`(() => {
      const keys = [...document.querySelectorAll('[data-zone-chips] [data-zone]')].map((c) => c.dataset.zone).reverse();
      for (const key of keys) {
        const b = document.querySelector('svg[role=group] [data-zone="' + key + '"]').getBoundingClientRect();
        const x = b.left + b.width / 2, y = b.top + b.height / 2;
        const hit = document.elementFromPoint(x, y);
        if (hit && hit.closest('[data-zone]') && hit.closest('[data-zone]').dataset.zone === key) return { key, x, y };
      }
      return null;
    })()`)) as { key: string; x: number; y: number } | null;
    const target = pick?.key ?? "";

    if (!reduced) {
      const s0 = await rowState(p, sel);
      check(
        `${locale} chips 375: barra de scroll oculta`,
        s0.scrollbarWidth === "none" && s0.scrollbarSpace === 0,
        `${s0.scrollbarWidth} / ${s0.scrollbarSpace}px`,
      );
      check(
        `${locale} chips 375: 40 px de alto, texto de 15 px, ≥ 8 px entre chips`,
        s0.kids.every((k) => k.height >= 40 && k.height <= 44 && k.font === 15) &&
          s0.kids.slice(1).every((k, i) => k.left - s0.kids[i].right >= 8),
        JSON.stringify(s0.kids.slice(0, 2)),
      );
      check(
        `${locale} chips 375: al inicio, degradado solo a la derecha`,
        s0.overflow > 0 &&
          s0.fadeEnd &&
          !s0.fadeStart &&
          s0.mask.includes("linear-gradient") &&
          s0.fadeStartWidth === "0px" &&
          s0.fadeEndWidth === "1.5rem",
        JSON.stringify({ overflow: s0.overflow, fs: s0.fadeStart, fe: s0.fadeEnd, mask: s0.mask.slice(0, 40) }),
      );
      // Nada recortado por la tarjeta: la fila no se sale de ella ni toca la curva inferior, deja
      // lugar al anillo de foco, el primer chip queda alineado con el título, entran ≥ 3 enteros
      // y el chip que cruza el borde derecho cae dentro del degradado (no un corte seco).
      const crossing = s0.kids.filter((k) => k.left < s0.row.right && k.right > s0.row.right);
      const full = s0.kids.filter((k) => k.right <= s0.row.right - FADE);
      check(
        `${locale} chips 375: ningún chip recortado por la tarjeta al inicio`,
        s0.row.left >= s0.card.left - 0.5 &&
          s0.row.right <= s0.card.right + 0.5 &&
          s0.row.bottom <= s0.card.bottom - s0.card.radius &&
          s0.kids.every((k) => k.top - s0.row.top >= 4 && s0.row.bottom - k.bottom >= 4) &&
          Math.abs(s0.kids[0].left - s0.titleLeft) <= 1 &&
          full.length >= 3 &&
          (crossing.length === 0 || s0.fadeEnd),
        JSON.stringify({ row: s0.row, card: s0.card, first: s0.kids[0].left, title: s0.titleLeft, full: full.length }),
      );
      await rowShot(p, sel, `${locale}_chips-375-inicio.png`);

      await p.evaluate(
        `(() => { const el = document.querySelector('[data-zone-chips]'); el.scrollTo({ left: (el.scrollWidth - el.clientWidth) / 2, behavior: 'instant' }); })()`,
      );
      await p.waitForTimeout(400);
      const s1 = await rowState(p, sel);
      check(
        `${locale} chips 375: a la mitad, degradado en los dos bordes`,
        s1.fadeStart && s1.fadeEnd && s1.fadeStartWidth === "1.5rem" && s1.fadeEndWidth === "1.5rem",
        JSON.stringify({ left: s1.scrollLeft, fs: s1.fadeStart, fe: s1.fadeEnd }),
      );
      await rowShot(p, sel, `${locale}_chips-375-mitad.png`);

      await p.evaluate(
        `(() => { const el = document.querySelector('[data-zone-chips]'); el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }); })()`,
      );
      await p.waitForTimeout(400);
      const s2 = await rowState(p, sel);
      const last = s2.kids.at(-1)!;
      check(
        `${locale} chips 375: al final, sin degradado a la derecha y con aire tras el último chip`,
        !s2.fadeEnd && s2.fadeStart && s2.fadeEndWidth === "0px" && s2.row.right - last.right >= 15,
        JSON.stringify({ fe: s2.fadeEnd, air: Math.round(s2.row.right - last.right) }),
      );
      await rowShot(p, sel, `${locale}_chips-375-final.png`);
      await p.evaluate(`document.querySelector('[data-zone-chips]').scrollTo({ left: 0, behavior: 'instant' })`);
      await p.waitForTimeout(300);
    }

    // Zona elegida tocando el diagrama → su chip queda a la vista (fuera de los degradados), con
    // scroll suave o instantáneo según prefers-reduced-motion.
    const hidden = (await p.evaluate(`(() => {
      const row = document.querySelector('[data-zone-chips]');
      const c = row.querySelector('[data-zone="${target}"]').getBoundingClientRect();
      return c.right > row.getBoundingClientRect().right - ${FADE};
    })()`)) as boolean;
    check(`${locale} chips 375: la zona a tocar (${target}) arranca fuera de la vista`, !!pick && hidden);
    await p.evaluate(
      `window.scrollBy({ top: document.querySelector('svg[role=group]').getBoundingClientRect().top - 90, behavior: 'instant' })`,
    );
    if (pick) await p.touchscreen.tap(pick.x, pick.y);
    await p.waitForTimeout(700);
    const visible = (await p.evaluate(`(() => {
      const row = document.querySelector('[data-zone-chips]');
      const chip = row.querySelector('[data-zone="${target}"]');
      const r = row.getBoundingClientRect(); const c = chip.getBoundingClientRect();
      const fs = row.hasAttribute('data-fade-start') ? ${FADE} : 0;
      const fe = row.hasAttribute('data-fade-end') ? ${FADE} : 0;
      return { zone: '${target}', sl: row.scrollLeft, max: row.scrollWidth - row.clientWidth, c: [Math.round(c.left), Math.round(c.right)], r: [r.left, r.right], fs, fe, pressed: chip.getAttribute('aria-pressed'), ok: c.left >= r.left + fs - 1 && c.right <= r.right - fe + 1, behavior: window.__rowScroll ?? null };
    })()`)) as { pressed: string; ok: boolean; behavior: string | null };
    check(
      `${locale} chips 375${reduced ? " (movimiento reducido)" : ""}: la zona elegida en el diagrama queda visible`,
      visible.pressed === "true" && visible.ok && visible.behavior === (reduced ? "auto" : "smooth"),
      JSON.stringify(visible),
    );
    if (!reduced) await rowShot(p, sel, `${locale}_chips-375-zona-diagrama.png`);

    // Pestañas de sostenibilidad y contacto: mismo tratamiento.
    if (!reduced) {
      const paths = locale === "es" ? ["/es/sostenibilidad", "/es/contacto"] : ["/en/sustainability", "/en/contact"];
      for (const path of paths) {
        await p.goto(`${base}${path}`, { waitUntil: "load" });
        await p.waitForTimeout(400);
        const t = await rowState(p, "[role=tablist]");
        const name = path.split("/").at(-1);
        check(
          `${locale} pestañas ${name} 375: barra oculta, degradado ${t.overflow > 0 ? "a la derecha" : "ausente (entran todas)"}, primera alineada al texto`,
          t.scrollbarWidth === "none" &&
            t.scrollbarSpace === 0 &&
            (t.overflow > 0 ? t.fadeEnd && !t.fadeStart && t.mask.includes("linear-gradient") : !t.fadeEnd && !t.fadeStart) &&
            Math.abs(t.kids[0].left - 16) <= 1,
          JSON.stringify({ overflow: t.overflow, fs: t.fadeStart, fe: t.fadeEnd, first: t.kids[0].left }),
        );
        const shot = { x: 0, y: Math.max(0, t.row.top - 40), width: 375, height: 120 };
        await p.screenshot({ path: join(out, `${locale}_pestanas-${name}-375.png`), clip: shot });
        if (t.overflow > 0) {
          // Elegir la última pestaña la lleva a la vista y apaga el degradado del final.
          await p.locator("[role=tab]").last().tap();
          await p.waitForTimeout(600);
          const t2 = await rowState(p, "[role=tablist]");
          const lastTab = t2.kids.at(-1)!;
          check(
            `${locale} pestañas ${name} 375: la última, elegida, queda visible`,
            !t2.fadeEnd && lastTab.right <= t2.row.right + 1,
            JSON.stringify({ right: lastTab.right, row: t2.row.right, fe: t2.fadeEnd }),
          );
          await p.screenshot({ path: join(out, `${locale}_pestanas-${name}-375-final.png`), clip: shot });
        }
      }
    }
    await ctx.close();
  }
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

    await scrollRows(browser, locale);

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
