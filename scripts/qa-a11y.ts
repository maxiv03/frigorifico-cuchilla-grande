/**
 * Accesibilidad (fase 6).
 *   npm run qa:a11y -- <url-base>
 *
 * 1. axe (WCAG 2.0/2.1/2.2 A y AA + buenas prácticas) en todos los tipos de página y en estados
 *    interactivos (errores y éxito de formularios, menú móvil, filtros, panel del mapa, pestañas),
 *    ES y EN, 1440 y 375 px. Falla con cualquier violación seria o crítica; lista las demás.
 * 2. lang del documento = idioma de la URL.
 * 3. Zoom al 200 %: (a) zoom de página (1280 px → viewport de 640 CSS px) y (b) solo texto
 *    (font-size raíz al 200 % a 1280 px): sin scroll horizontal y sin texto recortado.
 * 4. prefers-reduced-motion: sin transiciones ni animaciones y desplazamiento instantáneo.
 * Informe en screenshots/a11y/axe.json.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, type Browser, type Page } from "@playwright/test";

const base = (process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const out = join(process.cwd(), "screenshots", "a11y");
mkdirSync(out, { recursive: true });

type L = "es" | "en";
type State = { name: string; path: Record<L, string>; prepare?: (page: Page, locale: L) => Promise<void> };

const fill = async (page: Page, sel: string) => {
  await page.click(`${sel} button[type="submit"]`);
  await page.waitForSelector(`${sel} [data-form-alert="error"]`);
};
const honeypotSuccess = async (page: Page, form: string) => {
  await page.evaluate((form) => {
    const f = document.querySelector(form)!;
    (f.querySelector('input[name="website"]') as HTMLInputElement).value = "x";
    f.querySelectorAll<HTMLInputElement>("input:not([type=hidden]):not([type=checkbox]):not([name=website])").forEach((i) => {
      if (!i.value) i.value = i.type === "email" ? "a@b.co" : i.type === "date" ? "2030-01-01" : "12";
    });
  }, form);
  await page.click(`${form} button[type="submit"]`);
  await page.waitForSelector("[data-form-success]");
};

const STATES: State[] = [
  { name: "home", path: { es: "/es", en: "/en" } },
  { name: "catálogo", path: { es: "/es/productos", en: "/en/products" } },
  { name: "catálogo ovino filtrado", path: { es: "/es/productos?species=lamb&zone=leg", en: "/en/products?species=lamb&zone=leg" } },
  { name: "corte con foto", path: { es: "/es/productos/vacuno/lomo", en: "/en/products/beef/tenderloin" } },
  { name: "corte sin foto", path: { es: "/es/productos/ovino/cogote", en: "/en/products/lamb/neck" } },
  { name: "mercados", path: { es: "/es/mercados", en: "/en/markets" } },
  {
    name: "mercados: panel de un mercado",
    path: { es: "/es/mercados", en: "/en/markets" },
    prepare: async (page) => {
      if ((page.viewportSize()?.width ?? 0) < 1024) return;
      await page.focus('[data-market="cn"]');
    },
  },
  { name: "calidad", path: { es: "/es/calidad", en: "/en/quality" } },
  { name: "empresa", path: { es: "/es/empresa", en: "/en/company" } },
  { name: "productores", path: { es: "/es/productores", en: "/en/producers" } },
  {
    name: "productores: gráfico ovino y tabla",
    path: { es: "/es/productores", en: "/en/producers" },
    prepare: async (page) => {
      await page.click('button[data-species="lamb"]');
      await page.click('[data-chart="lamb"] details summary');
    },
  },
  { name: "productores: errores del formulario", path: { es: "/es/productores", en: "/en/producers" }, prepare: (page) => fill(page, "[data-offer-form]") },
  { name: "productores: éxito (honeypot)", path: { es: "/es/productores", en: "/en/producers" }, prepare: (page) => honeypotSuccess(page, "[data-offer-form]") },
  { name: "contacto: cotización con corte", path: { es: "/es/contacto?cut=beef_tenderloin", en: "/en/contact?cut=beef_tenderloin" } },
  { name: "contacto: errores de cotización", path: { es: "/es/contacto", en: "/en/contact" }, prepare: (page) => fill(page, '[data-contact-form="quote"]') },
  { name: "contacto: productores", path: { es: "/es/contacto?tab=producer", en: "/en/contact?tab=producer" } },
  { name: "contacto: errores de productores", path: { es: "/es/contacto?tab=producer", en: "/en/contact?tab=producer" }, prepare: (page) => fill(page, '[data-contact-form="producer"]') },
  { name: "sostenibilidad", path: { es: "/es/sostenibilidad", en: "/en/sustainability" } },
  {
    name: "sostenibilidad: otra pestaña",
    path: { es: "/es/sostenibilidad", en: "/en/sustainability" },
    prepare: async (page) => {
      await page.click('[role="tab"][data-tab="emissions"]');
    },
  },
  { name: "noticias", path: { es: "/es/noticias", en: "/en/news" } },
  { name: "noticia", path: { es: "/es/noticias/entra-en-operacion-el-parque-solar-de-la-planta", en: "/en/news/the-plant-s-solar-park-goes-into-operation" } },
  { name: "trabajá con nosotros", path: { es: "/es/trabaja-con-nosotros", en: "/en/careers" } },
  { name: "privacidad", path: { es: "/es/privacidad", en: "/en/privacy" } },
  { name: "404", path: { es: "/es/no-existe", en: "/en/not-here" } },
];

const MOBILE_ONLY: State[] = [
  {
    name: "menú móvil abierto",
    path: { es: "/es", en: "/en" },
    prepare: async (page) => {
      await page.click('header button[aria-expanded]');
      await page.waitForSelector('[role="dialog"]');
    },
  },
  {
    name: "catálogo: panel de filtros",
    path: { es: "/es/productos", en: "/en/products" },
    prepare: async (page, locale) => {
      await page.locator("button[aria-controls][aria-expanded]", { hasText: locale === "es" ? "Filtros" : "Filters" }).click();
      await page.waitForSelector('[role="dialog"]');
    },
  },
];

type Row = { state: string; locale: L; width: number; path: string; serious: string[]; other: string[] };
const rows: Row[] = [];
const extra: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => extra.push({ name, ok, detail });

async function open(page: Page, path: string) {
  const res = await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  return res?.status() ?? 0;
}

async function runAxe(browser: Browser, state: State, locale: L, width: number) {
  // axe pide un contexto propio por página (browser.newContext).
  const context = await browser.newContext({ viewport: { width, height: width < 640 ? 812 : 900 } });
  const page = await context.newPage();
  await open(page, state.path[locale]);
  try {
    await state.prepare?.(page, locale);
  } catch (e) {
    rows.push({ state: state.name, locale, width, path: state.path[locale], serious: [`no se pudo preparar el estado: ${(e as Error).message.split("\n")[0]}`], other: [] });
    await page.close();
    return;
  }
  await page.waitForTimeout(300);
  const lang = await page.getAttribute("html", "lang");
  if (lang !== locale) check(`lang en ${state.path[locale]}`, false, String(lang));
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  const fmt = (v: (typeof result.violations)[number]) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`;
  rows.push({
    state: state.name,
    locale,
    width,
    path: state.path[locale],
    serious: result.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map(fmt),
    other: result.violations.filter((v) => v.impact !== "serious" && v.impact !== "critical").map(fmt),
  });
  await context.close();
}

/** Elementos con texto recortado (overflow hidden/clip con contenido más ancho), salvo los visualmente ocultos. */
const clippedText = (page: Page) =>
  page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const s = getComputedStyle(el);
      if (!/(hidden|clip)/.test(s.overflowX + s.overflow) || el.closest(".sr-only,[aria-hidden=true],svg,[hidden]")) continue;
      if (el.clientWidth <= 2 || el.clientHeight <= 2) continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (hasText && el.scrollWidth > el.clientWidth + 2) out.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")} "${el.textContent!.trim().slice(0, 30)}"`);
    }
    return out;
  });

async function zoomAndMotion(browser: Browser) {
  const pages = ["/es", "/es/productos", "/es/productos/vacuno/lomo", "/es/mercados", "/es/productores", "/es/contacto", "/en/sustainability", "/en/news/the-plant-s-solar-park-goes-into-operation"];
  for (const path of pages) {
    // (a) zoom de página 200 % a 1280 px = 640 CSS px con DPR 2
    const zoomed = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
    await open(zoomed, path);
    const overflowA = await zoomed.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`zoom de página 200 %: sin scroll horizontal en ${path}`, overflowA <= 0, `${overflowA}px`);
    await zoomed.close();

    // (b) solo texto al 200 % a 1280 px: tamaño de fuente del navegador a 32 px (como la
    // configuración "Tamaño de fuente" de Chrome). Los rem y los breakpoints en rem responden.
    const text = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const cdp = await text.context().newCDPSession(text);
    await cdp.send("Page.enable");
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
    await open(text, path);
    await text.waitForTimeout(300);
    const overflowB = await text.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const clipped = await clippedText(text);
    check(`texto al 200 %: sin scroll horizontal ni texto recortado en ${path}`, overflowB <= 0 && clipped.length === 0, `${overflowB}px · ${clipped.slice(0, 3).join(" · ")}`);
    if (path === "/es/productores") await text.screenshot({ path: join(out, "texto-200-productores.png"), fullPage: true });
    await text.close();
  }

  // prefers-reduced-motion
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await open(page, "/es/productos");
  const motion = await page.evaluate(() => {
    const card = document.querySelector("[data-cut] a");
    const zone = document.querySelector("[data-zone] path");
    return {
      scroll: getComputedStyle(document.documentElement).scrollBehavior,
      zoneTransition: zone ? getComputedStyle(zone).transitionDuration : undefined,
      cardTransition: card ? getComputedStyle(card).transitionDuration : undefined,
    };
  });
  check(
    "movimiento reducido: sin desplazamiento suave ni transiciones",
    motion.scroll === "auto" && [motion.zoneTransition, motion.cardTransition].every((d) => !d || parseFloat(d) < 0.001 || d === "1e-05s"),
    JSON.stringify(motion),
  );
  // "Ofrecer este lote": se registra el `behavior` que pide el código al desplazar (Chromium headless
  // no anima el desplazamiento, así que no sirve medir posiciones).
  const scrollRequest = async (p: Page) => {
    await p.evaluate(`(() => {
      window.__behaviors = [];
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (arg) { window.__behaviors.push(arg && arg.behavior); return original.call(this, arg); };
    })()`);
    await p.click("[data-calculator] button");
    await p.waitForTimeout(400);
    return p.evaluate(() => (window as unknown as { __behaviors: string[] }).__behaviors);
  };
  await open(page, "/es/productores");
  const reduced = await scrollRequest(page);
  check("movimiento reducido: \"Ofrecer este lote\" desplaza sin animación (behavior auto)", reduced.length > 0 && reduced.every((b) => b === "auto"), reduced.join(","));
  await page.click('[data-offer-form] button[type="submit"]');
  await page.waitForSelector('[data-form-alert="error"]');
  await ctx.close();

  const ctx2 = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await open(p2, "/es/productores");
  const smooth = await scrollRequest(p2);
  check("sin preferencia: desplazamiento suave (behavior smooth)", smooth.length > 0 && smooth.every((b) => b === "smooth"), smooth.join(","));
  await ctx2.close();
}

async function main() {
  const browser = await chromium.launch();
  for (const locale of ["es", "en"] as const) {
    for (const width of [1440, 375]) {
      for (const state of [...STATES, ...(width < 640 ? MOBILE_ONLY : [])]) await runAxe(browser, state, locale, width);
    }
  }
  await zoomAndMotion(browser);
  await browser.close();

  writeFileSync(join(out, "axe.json"), `${JSON.stringify(rows, null, 2)}\n`);
  const serious = rows.filter((r) => r.serious.length);
  const minor = rows.filter((r) => r.other.length);
  console.log(`axe: ${rows.length} combinaciones (página/estado × idioma × ancho)`);
  for (const r of serious) console.log(`✗ ${r.state} · ${r.locale} · ${r.width}px\n    ${r.serious.join("\n    ")}`);
  const otherIds = new Map<string, number>();
  for (const r of minor) for (const o of r.other) otherIds.set(o.split(" (")[0], (otherIds.get(o.split(" (")[0]) ?? 0) + 1);
  console.log(`  violaciones serias o críticas: ${serious.reduce((n, r) => n + r.serious.length, 0)}`);
  console.log(`  moderadas o menores: ${[...otherIds].map(([k, v]) => `${k} ×${v}`).join(", ") || "ninguna"}`);
  for (const e of extra) console.log(`${e.ok ? "✓" : "✗"} ${e.name}${e.ok || !e.detail ? "" : ` — ${e.detail}`}`);
  const failed = serious.length + extra.filter((e) => !e.ok).length;
  console.log(`\n${failed === 0 ? "✓ Sin problemas" : `✗ ${failed} problemas`}`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
