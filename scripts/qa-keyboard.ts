/**
 * Recorrido completo por teclado (fase 6).
 *   npm run qa:keyboard -- <url-base>
 *
 * En cada componente se recorre con Tab de punta a punta y en cada parada se verifica que el foco
 * sea VISIBLE: algún estilo del elemento o de sus contenedores cercanos (outline, sombra/anillo,
 * trazo, fondo, borde, subrayado) cambia entre enfocado y sin foco. Además:
 * - formularios (oferta de ganado, cotización, productores): orden = orden del DOM de todos los
 *   controles visibles, el honeypot nunca recibe foco, Espacio marca casillas, Enter en el botón
 *   envía y el foco pasa al primer error;
 * - selector de cortes: búsqueda, casillas y "Quitar" por teclado;
 * - diagrama de cortes: zonas enfocables, Enter selecciona;
 * - mapa: mercados enfocables, Enter pasa al panel, Escape vuelve al mercado;
 * - pestañas (contacto y sostenibilidad): flechas, Inicio, Fin;
 * - menú móvil: abre con Enter, foco atrapado en el panel, Escape cierra y devuelve el foco;
 * - salto al contenido: primer Tab, Enter lleva el foco al <main>.
 */
import { chromium, type Page } from "@playwright/test";

const base = (process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

async function open(page: Page, path: string) {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
}

// Funciones de página como texto: tsx envuelve las funciones con nombre (__name) y no existen en el navegador.
const DESCRIBE = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const id = el.id ? "#" + el.id : "";
  const name = el.getAttribute("name") ? "[name=" + el.getAttribute("name") + "]" + (el.type === "checkbox" && el.value !== "on" ? "[value=" + el.value + "]" : "") : "";
  const data = [...el.attributes].filter((a) => a.name.startsWith("data-")).slice(0, 1).map((a) => "[" + a.name + "=" + a.value + "]").join("");
  return el.tagName.toLowerCase() + id + name + data + (el.textContent ? " " + JSON.stringify(el.textContent.trim().slice(0, 24)) : "");
})()`;

const SNAPSHOT = `(() => {
  const props = ["outline-style", "outline-width", "outline-color", "box-shadow", "stroke", "stroke-width", "stroke-dasharray", "background-color", "border-color", "text-decoration-line", "color"];
  const out = [];
  let el = document.activeElement;
  for (let i = 0; el && i < 4; i++, el = el.parentElement) {
    const s = getComputedStyle(el);
    out.push(props.map((p) => s.getPropertyValue(p)).join("|"));
    if (el.tagName === "svg") break;
  }
  const a = document.activeElement;
  for (const child of a ? a.querySelectorAll("path") : []) { const s = getComputedStyle(child); out.push(s.stroke + s.strokeDasharray + s.strokeWidth); }
  return out.join("§");
})()`;

/** ¿El foco actual es visible? Compara estilos enfocado / sin foco y vuelve a enfocar. */
async function focusVisible(page: Page) {
  const focused = await page.evaluate(SNAPSHOT);
  const handle = await page.evaluateHandle(() => document.activeElement);
  // Sin foco: mismo elemento sin :focus ni :focus-visible (blur) y sin hover.
  await page.mouse.move(0, 0);
  await page.evaluate("document.activeElement && document.activeElement.blur()");
  const blurredStyle = await handle.evaluate((el) => {
    const props = ["outline-style", "outline-width", "outline-color", "box-shadow", "stroke", "stroke-width", "stroke-dasharray", "background-color", "border-color", "text-decoration-line", "color"];
    const out: string[] = [];
    let node: Element | null = el as Element;
    for (let i = 0; node && i < 4; i++, node = node.parentElement) {
      const s = getComputedStyle(node);
      out.push(props.map((p) => s.getPropertyValue(p)).join("|"));
      if (node.tagName === "svg") break;
    }
    for (const child of (el as Element).querySelectorAll("path")) {
      const s = getComputedStyle(child);
      out.push(s.stroke + s.strokeDasharray + s.strokeWidth);
    }
    return out.join("§");
  });
  // Volver a enfocar con modalidad de teclado (la última interacción fue Tab).
  await handle.evaluate((el) => (el as HTMLElement).focus());
  await handle.dispose();
  return focused !== blurredStyle;
}

/** Recorre con Tab desde el primer control del contenedor hasta que el foco sale. */
async function walk(page: Page, container: string, max = 80) {
  await page.evaluate((sel) => {
    const first = document.querySelector(sel)?.querySelector<HTMLElement>("a[href], button:not([disabled]), input:not([type=hidden]):not([tabindex='-1']), select, textarea, [tabindex='0']");
    first?.focus();
  }, container);
  const stops: { desc: string; visible: boolean }[] = [];
  for (let i = 0; i < max; i++) {
    const inside = await page.evaluate((sel) => !!document.querySelector(sel)?.contains(document.activeElement), container);
    if (!inside) break;
    const desc = String((await page.evaluate(DESCRIBE)) ?? "body");
    // Un input de fecha recibe varios Tab (día, mes, año): se cuenta una vez y no se vuelve a
    // enfocar (volver a enfocarlo lo regresa al primer segmento).
    if (stops.at(-1)?.desc !== desc) stops.push({ desc, visible: await focusVisible(page) });
    await page.keyboard.press("Tab");
  }
  return stops;
}

/** Controles visibles y enfocables del contenedor, en orden del DOM (lo que el Tab debería recorrer). */
const expectedStops = (page: Page, container: string) =>
  page.evaluate((sel) => {
    const root = document.querySelector(sel)!;
    return [...root.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")]
      .filter((el) => {
        if (el.matches("[disabled], input[type=hidden], [tabindex='-1']") || el.closest("[hidden], [aria-hidden=true]")) return false;
        if (el.getAttribute("tabindex") === null && !el.matches("a[href], button, input, select, textarea")) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .filter((el, i, all) => !(el.matches("input[type=radio]") && all.slice(0, i).some((o) => o.matches(`input[type=radio][name="${(el as HTMLInputElement).name}"]`)))).length;
  }, container);

function report(name: string, stops: { desc: string; visible: boolean }[], expected?: number) {
  const hidden = stops.filter((s) => !s.visible);
  check(`${name}: ${stops.length} paradas con foco visible`, stops.length > 0 && hidden.length === 0, hidden.map((s) => s.desc).slice(0, 4).join(" · "));
  if (expected !== undefined) check(`${name}: el Tab recorre todos los controles en orden (${expected})`, stops.length === expected, `${stops.length} paradas: ${stops.map((s) => s.desc).join(" → ").slice(0, 400)}`);
  check(`${name}: el honeypot nunca recibe foco`, !stops.some((s) => s.desc.includes("website")));
}

async function forms(page: Page, locale: "es" | "en") {
  // Oferta de ganado
  const offerPath = locale === "es" ? "/es/productores" : "/en/producers";
  await open(page, offerPath);
  const offer = "[data-offer-form]";
  const offerStops = await walk(page, offer);
  report(`${locale} oferta de ganado`, offerStops, await expectedStops(page, offer));
  await page.focus(`${offer} #f-privacy`);
  await page.keyboard.press("Space");
  check(`${locale} oferta: Espacio marca la casilla de privacidad`, await page.isChecked(`${offer} #f-privacy`));
  await page.focus(`${offer} button[type="submit"]`);
  await page.keyboard.press("Enter");
  await page.waitForSelector(`${offer} [data-form-alert="error"]`);
  check(`${locale} oferta: Enter envía y el foco va al primer error`, (await page.evaluate(() => document.activeElement?.getAttribute("name"))) === "category");

  // Calculadora: todos sus controles y el botón "Ofrecer este lote"
  const calcStops = await walk(page, "[data-calculator]");
  report(`${locale} calculadora`, calcStops, await expectedStops(page, "[data-calculator]"));

  // Cotización (con el selector de cortes)
  const contact = locale === "es" ? "/es/contacto" : "/en/contact";
  await open(page, `${contact}?cut=beef_tenderloin`);
  const quote = '[data-contact-form="quote"]';
  await page.waitForSelector(`${quote} [data-chip]`);
  const quoteStops = await walk(page, quote, 120);
  report(`${locale} cotización`, quoteStops, await expectedStops(page, quote));
  await page.focus("#f-cutsSearch");
  await page.keyboard.type(locale === "es" ? "pierna" : "leg");
  await page.keyboard.press("Enter");
  check(`${locale} selector de cortes: Enter en la búsqueda no envía el formulario`, (await page.locator(`${quote} [data-form-alert]`).count()) === 0);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  const chips = await page.locator(`${quote} [data-chip]`).count();
  check(`${locale} selector de cortes: Tab + Espacio elige el primer resultado`, chips === 2, `${chips} chips`);
  await page.focus(`${quote} [data-chip] button`);
  await page.keyboard.press("Enter");
  check(`${locale} selector de cortes: "Quitar" con Enter`, (await page.locator(`${quote} [data-chip]`).count()) === 1);

  // Productores
  await page.focus('[role="tab"][data-tab="quote"]');
  await page.keyboard.press("ArrowRight");
  const producer = '[data-contact-form="producer"]';
  const prodStops = await walk(page, producer);
  report(`${locale} consulta de productores`, prodStops, await expectedStops(page, producer));
  await page.focus(`${producer} button[type="submit"]`);
  await page.keyboard.press("Enter");
  await page.waitForSelector(`${producer} [data-form-alert="error"]`);
  check(`${locale} productores: Enter envía y el foco va al primer error`, (await page.evaluate(() => document.activeElement?.getAttribute("name"))) === "name");
}

async function widgets(page: Page, locale: "es" | "en") {
  // Diagrama de cortes
  await open(page, locale === "es" ? "/es/productos" : "/en/products");
  const diagram = 'svg[role="group"]';
  const diagramStops = await walk(page, diagram, 40);
  report(`${locale} diagrama`, diagramStops, await expectedStops(page, diagram));
  await page.focus(`${diagram} [data-zone="loin"]`);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  check(`${locale} diagrama: Enter selecciona la zona (filtro en la URL)`, page.url().includes("zone=loin"), page.url());

  // Mapa de mercados
  await open(page, locale === "es" ? "/es/mercados" : "/en/markets");
  const marketStops = await walk(page, ".market-map", 30);
  report(`${locale} mapa de mercados`, marketStops);
  await page.focus('[data-market="cn"]');
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const inPanel = await page.evaluate(() => !!document.activeElement?.closest("#market-panel"));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const back = await page.evaluate(() => document.activeElement?.getAttribute("data-market"));
  check(`${locale} mapa: Enter pasa al panel y Escape vuelve al mercado`, inPanel && back === "cn", `${inPanel} · ${back}`);

  // Pestañas de sostenibilidad
  await open(page, locale === "es" ? "/es/sostenibilidad" : "/en/sustainability");
  await page.focus('[role="tab"][aria-selected="true"]');
  const tabVisible = await focusVisible(page);
  await page.keyboard.press("ArrowRight");
  const second = await page.evaluate(() => document.activeElement?.getAttribute("data-tab"));
  await page.keyboard.press("End");
  const last = await page.evaluate(() => document.activeElement?.getAttribute("data-tab"));
  await page.keyboard.press("Home");
  const first = await page.evaluate(() => document.activeElement?.getAttribute("data-tab"));
  await page.keyboard.press("Tab");
  const panel = await page.evaluate(() => document.activeElement?.getAttribute("role"));
  check(`${locale} pestañas de sostenibilidad: foco visible, flechas, Inicio, Fin y Tab al panel`, tabVisible && second === "water" && last === "community" && first === "energy" && panel === "tabpanel", `${tabVisible} ${second} ${last} ${first} ${panel}`);
}

async function menuAndSkip(page: Page, locale: "es" | "en") {
  await open(page, `/${locale}`);
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), href: document.activeElement?.getAttribute("href") }));
  const skipVisible = await focusVisible(page);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const onMain = await page.evaluate(() => document.activeElement?.id);
  check(`${locale} salto al contenido: primer Tab, visible, Enter enfoca <main>`, skip.href === "#contenido" && skipVisible && onMain === "contenido", `${JSON.stringify(skip)} · ${skipVisible} · ${onMain}`);

  const button = "header button[aria-expanded]";
  await page.focus(button);
  const buttonVisible = await focusVisible(page);
  await page.keyboard.press("Enter");
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(200);
  const insideDialog = async () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  let trapped = await insideDialog();
  const dialogStops: { desc: string; visible: boolean }[] = [];
  for (let i = 0; i < 30; i++) {
    dialogStops.push({ desc: String((await page.evaluate(DESCRIBE)) ?? "body"), visible: await focusVisible(page) });
    await page.keyboard.press("Tab");
    trapped &&= await insideDialog();
  }
  await page.keyboard.press("Shift+Tab");
  trapped &&= await insideDialog();
  check(`${locale} menú móvil: botón con foco visible, Enter abre y el foco queda atrapado (30 Tab + Shift+Tab)`, buttonVisible && trapped);
  const unique = [...new Map(dialogStops.map((s) => [s.desc, s])).values()];
  report(`${locale} menú móvil`, unique);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const returned = await page.evaluate(() => document.activeElement?.matches("header button[aria-expanded]"));
  check(`${locale} menú móvil: Escape cierra y devuelve el foco al botón`, (await page.locator('[role="dialog"]').count()) === 0 && !!returned);
}

async function main() {
  const browser = await chromium.launch();
  for (const locale of ["es", "en"] as const) {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await forms(desktop, locale);
    await widgets(desktop, locale);
    await desktop.close();
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await menuAndSkip(mobile, locale);
    await mobile.close();
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.ok || !r.detail ? "" : ` — ${r.detail}`}`);
  console.log(`\n${results.length - failed.length}/${results.length} verificaciones OK`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
