/**
 * QA de contacto (fase 5): pestañas por teclado y por URL, precarga del corte desde el catálogo
 * (ES y EN), búsqueda de cortes, validaciones de los dos formularios, honeypot, avisos visibles
 * debajo del header a 375 px y un envío real por formulario.
 *   npm run qa:contact -- <url-base> [--real-submit]
 *
 *   --real-submit  un pedido de cotización y una consulta de productor de verdad (ES): los busca en
 *                  la base con la clave secreta, verifica las columnas, los borra y deja el registro en
 *                  screenshots/contact/real-submit.json.
 *
 * Toda fila creada lleva la marca "QA contact <id de corrida>" (contact_name / name) y se borra al
 * final con la clave secreta (solo scripts). Capturas en screenshots/contact/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";
import { adminClient } from "./lib/db";
import { settlePage } from "./settle";

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000";
const REAL_SUBMIT = args.includes("--real-submit");
const run = Date.now().toString(36);
const MARK = `QA contact ${run}`;
const out = join(process.cwd(), "screenshots", "contact");
mkdirSync(out, { recursive: true });

const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });
const db = adminClient();

type L = "es" | "en";
const paths = { es: "/es/contacto", en: "/en/contact" } as const;
const catalogPaths = { es: "/es/productos", en: "/en/products?species=lamb" } as const;
const text = {
  es: { containersRange: "Ingresá un valor entre 1 y 100.", success: "Recibimos tu pedido", producerSuccess: "Recibimos tu consulta", demo: "no llega a ningún vendedor", search: "carre", searchHit: "lamb_frenched_rack" },
  en: { containersRange: "Enter a value between 1 and 100.", success: "We received your quote request", producerSuccess: "We received your enquiry", demo: "does not reach any salesperson", search: "tender", searchHit: "beef_tenderloin" },
} as const;

async function open(page: Page, path: string) {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.waitForSelector('[role="tablist"]');
  await page.waitForTimeout(400);
}

const errorCodes = (page: Page, form: "quote" | "producer") =>
  page.$$eval(`[data-contact-form="${form}"] [data-error]`, (els) =>
    Object.fromEntries(els.map((e) => [e.closest("[data-field]")?.getAttribute("data-field"), e.getAttribute("data-error")])),
  );

async function fillQuote(page: Page, name: string) {
  const f = '[data-contact-form="quote"]';
  await page.fill(`${f} #f-company`, "QA Importadora S.L.");
  await page.fill(`${f} #f-country`, "España");
  await page.fill(`${f} #f-contactName`, name);
  await page.fill(`${f} #f-email`, "qa@example.com");
  await page.fill(`${f} #f-phone`, "+34 600 000 000");
  for (const id of ["beef_tenderloin", "lamb_frenched_rack"]) {
    const box = page.locator(`${f} input[name="cuts"][value="${id}"]`);
    if (!(await box.isChecked())) await box.check();
  }
  await page.selectOption(`${f} #f-presentation`, "chilled");
  await page.fill(`${f} #f-volumeAmount`, "2");
  await page.selectOption(`${f} #f-volumeUnit`, "containers_month");
  await page.selectOption(`${f} #f-incoterm`, "CFR");
  await page.fill(`${f} #f-destinationPort`, "Valencia");
  await page.fill(`${f} #f-message`, "Prueba automática de QA (se borra al terminar).");
  await page.check(`${f} #f-privacy`);
}

async function fillProducer(page: Page, name: string) {
  const f = '[data-contact-form="producer"]';
  await page.fill(`${f} #fp-name`, name);
  await page.fill(`${f} #fp-phone`, "099 000 000");
  await page.selectOption(`${f} #fp-department`, "Florida");
  await page.selectOption(`${f} #fp-reason`, "settlement");
  await page.fill(`${f} #fp-message`, "Prueba automática de QA (se borra al terminar).");
  await page.check(`${f} #fp-privacy`);
}

async function quoteRows() {
  const { data, error } = await db
    .from("quote_requests")
    .select("id, env, created_at, locale, contact_name, cut_ids, cuts_of_interest, volume_amount, volume_unit, volume, incoterm, destination_port, presentation, privacy_accepted")
    .like("contact_name", `${MARK}%`);
  if (error) throw new Error(error.message);
  return data;
}
async function producerRows() {
  const { data, error } = await db.from("producer_contacts").select("id, env, created_at, locale, name, department, reason, privacy_accepted").like("name", `${MARK}%`);
  if (error) throw new Error(error.message);
  return data;
}

/** Aviso y primer campo con error visibles debajo del header, sin desplazar desde el script. */
async function errorGeometry(page: Page, form: "quote" | "producer") {
  return page.evaluate((form) => {
    const header = document.querySelector("header")?.getBoundingClientRect();
    const alert = document.querySelector(`[data-contact-form="${form}"] [data-form-alert="error"]`)?.getBoundingClientRect();
    const active = document.activeElement;
    const field = active?.closest("[data-field]")?.getBoundingClientRect();
    return { headerBottom: header?.bottom ?? 0, alertTop: alert?.top, alertBottom: alert?.bottom, fieldTop: field?.top, fieldBottom: field?.bottom, focused: active?.getAttribute("name") ?? active?.id, vh: innerHeight };
  }, form);
}
const visibleBelowHeader = (g: Awaited<ReturnType<typeof errorGeometry>>, top?: number, bottom?: number) =>
  top !== undefined && bottom !== undefined && top >= g.headerBottom && bottom <= g.vh;

async function tabsAndUrl(browser: Browser, locale: L) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(page, paths[locale]);
  const selected = () => page.getAttribute('[role="tab"][aria-selected="true"]', "data-tab");
  check(`${locale} pestañas: cotización por defecto`, (await selected()) === "quote" && (await page.locator('[data-tab-panel="producer"]').isHidden()));
  const roles = await page.evaluate(() => ({
    tablist: !!document.querySelector('[role="tablist"][aria-label]'),
    tabs: document.querySelectorAll('[role="tab"][aria-controls]').length,
    panels: document.querySelectorAll('[role="tabpanel"][aria-labelledby]').length,
    roving: [...document.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("tabindex")).join(","),
  }));
  check(`${locale} pestañas: roles tablist/tab/tabpanel y tabindex itinerante`, roles.tablist && roles.tabs === 2 && roles.panels === 2 && roles.roving === "0,-1", JSON.stringify(roles));

  await page.focus('[role="tab"][data-tab="quote"]');
  await page.keyboard.press("ArrowRight");
  const afterRight = { tab: await selected(), focus: await page.evaluate(() => document.activeElement?.getAttribute("data-tab")), url: new URL(page.url()).searchParams.get("tab") };
  check(
    `${locale} teclado: → activa Productores, le pasa el foco y actualiza ?tab=producer`,
    afterRight.tab === "producer" && afterRight.focus === "producer" && afterRight.url === "producer" && (await page.locator('[data-tab-panel="producer"]').isVisible()),
    JSON.stringify(afterRight),
  );
  await page.keyboard.press("ArrowRight");
  check(`${locale} teclado: → en la última vuelve a la primera`, (await selected()) === "quote");
  await page.keyboard.press("End");
  check(`${locale} teclado: Fin → última pestaña`, (await selected()) === "producer");
  await page.keyboard.press("Home");
  check(`${locale} teclado: Inicio → primera pestaña`, (await selected()) === "quote" && new URL(page.url()).searchParams.get("tab") === "quote");
  await page.keyboard.press("ArrowLeft");
  check(`${locale} teclado: ← en la primera va a la última`, (await selected()) === "producer");
  await page.keyboard.press("Tab");
  const intoPanel = await page.evaluate(() => document.activeElement?.closest('[role="tabpanel"]')?.getAttribute("data-tab-panel"));
  check(`${locale} teclado: Tab entra al panel activo`, intoPanel === "producer", String(intoPanel));
  await page.close();

  const byUrl = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(byUrl, `${paths[locale]}?tab=producer`);
  check(
    `${locale} URL: ?tab=producer abre Productores`,
    (await byUrl.getAttribute('[role="tab"][aria-selected="true"]', "data-tab")) === "producer" &&
      (await byUrl.locator('[data-tab-panel="producer"]').isVisible()) &&
      (await byUrl.locator('[data-tab-panel="quote"]').isHidden()),
  );
  const offer = await byUrl.locator("[data-offer-link] a").getAttribute("href");
  check(`${locale} productores: link visible a "Ofrecer ganado" del portal`, (await byUrl.locator("[data-offer-link] a").isVisible()) && offer === (locale === "es" ? "/es/productores#offer" : "/en/producers#offer"), String(offer));
  await open(byUrl, `${paths[locale]}?tab=otra`);
  check(`${locale} URL: valor desconocido → cotización`, (await byUrl.getAttribute('[role="tab"][aria-selected="true"]', "data-tab")) === "quote");
  await byUrl.close();
}

async function prefill(browser: Browser, locale: L) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}${catalogPaths[locale]}`, { waitUntil: "load" });
  // El HTML estático trae el catálogo vacuno; con ?species=lamb se espera a que lo reemplace el
  // filtrado, si no se lee un link y se hace clic en otro.
  const prefix = locale === "es" ? "beef_" : "lamb_";
  await page.waitForSelector(`[data-quote-link^="${prefix}"]`);
  const link = page.locator(`[data-quote-link^="${prefix}"]`).first();
  const cut = (await link.getAttribute("data-quote-link"))!;
  const href = await link.getAttribute("href");
  check(`${locale} catálogo: "Pedir cotización" → /contacto con id neutro`, href === `${paths[locale]}?tab=quote&cut=${cut}`, String(href));
  await link.click();
  await page.waitForURL(`**${paths[locale]}?tab=quote&cut=${cut}`);
  await page.waitForSelector(`[data-chip="${cut}"]`, { timeout: 15_000 });
  const checked = await page.locator(`[data-contact-form="quote"] input[name="cuts"][value="${cut}"]`).isChecked();
  check(`${locale} precarga desde el catálogo: ${cut} elegido (casilla y chip)`, checked && (await page.locator("[data-chip]").count()) === 1);
  await settlePage(page);
  await page.screenshot({ path: join(out, `${locale}_contacto-corte-precargado-1440.png`), fullPage: true });
  await page.close();

  // URL directa con el id del otro idioma (ids neutros) y un id inexistente.
  const direct = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const known = locale === "es" ? "lamb_frenched_rack" : "beef_tenderloin";
  await open(direct, `${paths[locale]}?cut=${known}&cut=beef_no_existe`);
  await direct.waitForSelector(`[data-chip="${known}"]`);
  check(`${locale} precarga por URL: id válido elegido, id desconocido ignorado`, (await direct.locator("[data-chip]").count()) === 1);
  await settlePage(direct);
  await direct.screenshot({ path: join(out, `${locale}_contacto-corte-precargado-375.png`), fullPage: true });
  await direct.close();
}

async function validation(browser: Browser, locale: L) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(page, paths[locale]);
  const q = '[data-contact-form="quote"]';

  // Búsqueda de cortes
  await page.fill("#f-cutsSearch", text[locale].search);
  const shown = await page.$$eval(`${q} [data-cut-options] li:not([hidden]) input[name="cuts"]`, (els) => els.map((e) => (e as HTMLInputElement).value));
  check(`${locale} búsqueda de cortes: "${text[locale].search}" filtra (sin acentos)`, shown.includes(text[locale].searchHit) && shown.length < 10, shown.join(","));
  await page.fill("#f-cutsSearch", "");
  check(`${locale} búsqueda vacía: los 36 cortes`, (await page.locator(`${q} [data-cut-options] li:not([hidden])`).count()) === 36);

  // Envío vacío
  await page.click(`${q} button[type="submit"]`);
  await page.waitForSelector(`${q} [data-form-alert="error"]`);
  const codes = await errorCodes(page, "quote");
  const required = { company: "required", country: "required", contactName: "required", email: "required", cuts: "selectOne", presentation: "option", volumeAmount: "required", privacy: "privacy" };
  check(`${locale} cotización: obligatorios marcados con su código`, Object.entries(required).every(([k, c]) => codes[k] === c), JSON.stringify(codes));
  check(`${locale} cotización: opcionales sin error (teléfono, incoterm, puerto, mensaje)`, !codes.phone && !codes.incoterm && !codes.destinationPort && !codes.message);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("name"));
  check(`${locale} cotización: foco en el primer campo con error`, focused === "company", String(focused));

  // Errores de formato y rango (volumen según la unidad)
  await fillQuote(page, MARK);
  await page.fill(`${q} #f-email`, "no-es-un-mail");
  await page.fill(`${q} #f-phone`, "abc");
  await page.fill(`${q} #f-volumeAmount`, "500");
  await page.uncheck(`${q} #f-privacy`);
  await page.click(`${q} button[type="submit"]`);
  await page.waitForSelector(`${q} [data-field="email"] [data-error="email"]`);
  const codes2 = await errorCodes(page, "quote");
  check(`${locale} cotización: email, teléfono, volumen por unidad y privacidad`, codes2.email === "email" && codes2.phone === "phone" && codes2.volumeAmount === "range" && codes2.privacy === "privacy" && !codes2.cuts, JSON.stringify(codes2));
  const volText = (await page.textContent(`${q} [data-field="volumeAmount"] [data-error]`)) ?? "";
  check(`${locale} cotización: mensaje de rango traducido (contenedores 1–100)`, volText.includes(text[locale].containersRange), volText);
  check(`${locale} cotización: conserva lo escrito y los cortes elegidos`, (await page.inputValue(`${q} #f-contactName`)) === MARK && (await page.locator(`${q} [data-chip]`).count()) === 2);
  await page.locator(q).screenshot({ path: join(out, `${locale}_cotizacion-errores-1440.png`) });

  // Productores
  await page.click('[role="tab"][data-tab="producer"]');
  const p = '[data-contact-form="producer"]';
  await page.click(`${p} button[type="submit"]`);
  await page.waitForSelector(`${p} [data-form-alert="error"]`);
  const pc = await errorCodes(page, "producer");
  const preq = { name: "required", phone: "required", department: "option", reason: "option", message: "required", privacy: "privacy" };
  check(`${locale} productores: obligatorios marcados con su código`, Object.entries(preq).every(([k, c]) => pc[k] === c), JSON.stringify(pc));
  await fillProducer(page, MARK);
  await page.fill(`${p} #fp-phone`, "12");
  await page.click(`${p} button[type="submit"]`);
  await page.waitForFunction((sel) => document.querySelectorAll(`${sel} [data-error]`).length === 1, p);
  const pc2 = await errorCodes(page, "producer");
  check(`${locale} productores: teléfono inválido es el único error`, Object.keys(pc2).length === 1 && pc2.phone === "phone", JSON.stringify(pc2));
  await page.locator(p).screenshot({ path: join(out, `${locale}_productores-errores-1440.png`) });
  await page.close();

  // 375 px: aviso y primer campo visibles debajo del header (los dos formularios)
  for (const form of ["quote", "producer"] as const) {
    const m = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
    await open(m, `${paths[locale]}?tab=${form}`);
    await m.click(`[data-contact-form="${form}"] button[type="submit"]`);
    await m.waitForSelector(`[data-contact-form="${form}"] [data-form-alert="error"]`);
    await m.waitForTimeout(400);
    const g = await errorGeometry(m, form);
    check(`${locale} 375 px ${form}: aviso de errores visible debajo del header`, visibleBelowHeader(g, g.alertTop, g.alertBottom), JSON.stringify(g));
    check(`${locale} 375 px ${form}: primer campo con error (con foco) visible`, visibleBelowHeader(g, g.fieldTop, g.fieldBottom), JSON.stringify(g));
    await m.screenshot({ path: join(out, `${locale}_${form === "quote" ? "cotizacion" : "productores"}-errores-375-vista.png`) });
    await m.close();
  }
}

/** Honeypot: responde éxito (con el aviso de demo) y no guarda nada. Capturas de éxito. */
async function honeypot(browser: Browser, locale: L) {
  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    for (const form of ["quote", "producer"] as const) {
      const page = await browser.newPage({ viewport: vp, deviceScaleFactor: vp.width < 640 ? 2 : 1 });
      await open(page, `${paths[locale]}?tab=${form}`);
      const name = `${MARK} honeypot ${locale} ${form} ${vp.width}`;
      if (form === "quote") await fillQuote(page, name);
      else await fillProducer(page, name);
      await page.evaluate((form) => {
        (document.querySelector(`[data-contact-form="${form}"] input[name="website"]`) as HTMLInputElement).value = "https://spam.example";
      }, form);
      await page.click(`[data-contact-form="${form}"] button[type="submit"]`);
      await page.waitForSelector("[data-form-success]");
      const msg = (await page.textContent("[data-form-success]")) ?? "";
      if (vp.width === 1440) {
        check(
          `${locale} honeypot ${form}: éxito con aviso de sitio demo`,
          msg.includes(form === "quote" ? text[locale].success : text[locale].producerSuccess) && msg.includes(text[locale].demo),
          msg.slice(0, 120),
        );
      }
      const label = form === "quote" ? "cotizacion" : "productores";
      await page.locator("[data-form-success]").screenshot({ path: join(out, `${locale}_${label}-exito-${vp.width}.png`) });
      await page.close();
    }
  }
  const rows = [...(await quoteRows()), ...(await producerRows())].filter((r) => ("contact_name" in r ? r.contact_name : r.name).includes("honeypot"));
  check(`${locale} honeypot: ninguna fila guardada`, rows.length === 0, `${rows.length} filas`);
}

async function captures(browser: Browser, locale: L) {
  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
    for (const tab of ["quote", "producer"] as const) {
      const page = await browser.newPage({ viewport: vp, deviceScaleFactor: vp.width < 640 ? 2 : 1 });
      await open(page, `${paths[locale]}?tab=${tab}`);
      await settlePage(page);
      if (tab === "quote") {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(`${locale} ${vp.width} px: sin scroll horizontal`, overflow <= 0, String(overflow));
        check(`${locale} ${vp.width} px: un solo h1 y mapa de ubicación`, (await page.locator("h1").count()) === 1 && (await page.locator("[data-location-map] svg").isVisible()));
      }
      await page.screenshot({ path: join(out, `${locale}_contacto-${tab === "quote" ? "cotizacion" : "productores"}-${vp.width}.png`), fullPage: true });
      await page.close();
    }
  }
}

async function realSubmit(browser: Browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(page, paths.es);
  await fillQuote(page, `${MARK} real cotizacion`);
  await page.click('[data-contact-form="quote"] button[type="submit"]');
  await page.waitForSelector("[data-form-success]", { timeout: 20_000 });
  const qMsg = (await page.textContent("[data-form-success]")) ?? "";
  check("envío real cotización: mensaje de éxito con aviso de demo", qMsg.includes(text.es.success) && qMsg.includes(text.es.demo), qMsg.slice(0, 100));

  await open(page, `${paths.es}?tab=producer`);
  await fillProducer(page, `${MARK} real productor`);
  await page.click('[data-contact-form="producer"] button[type="submit"]');
  await page.waitForSelector("[data-form-success]", { timeout: 20_000 });
  const pMsg = (await page.textContent("[data-form-success]")) ?? "";
  check("envío real productores: mensaje de éxito", pMsg.includes(text.es.producerSuccess), pMsg.slice(0, 100));
  await page.close();

  const quotes = (await quoteRows()).filter((r) => r.contact_name.includes(" real "));
  const producers = (await producerRows()).filter((r) => r.name.includes(" real "));
  check("envío real: 1 fila en quote_requests y 1 en producer_contacts", quotes.length === 1 && producers.length === 1, `${quotes.length} / ${producers.length}`);
  const qr = quotes[0];
  check(
    "envío real cotización: columnas estructuradas (cortes, volumen, incoterm, puerto, privacidad)",
    !!qr && JSON.stringify(qr.cut_ids) === JSON.stringify(["beef_tenderloin", "lamb_frenched_rack"]) && Number(qr.volume_amount) === 2 && qr.volume_unit === "containers_month" && qr.incoterm === "CFR" && qr.destination_port === "Valencia" && qr.presentation === "chilled" && qr.privacy_accepted === true,
    JSON.stringify(qr),
  );
  check("envío real productores: departamento, motivo y privacidad", producers[0]?.department === "Florida" && producers[0]?.reason === "settlement" && producers[0]?.privacy_accepted === true, JSON.stringify(producers[0]));
  if (!base.includes("localhost")) {
    check("envío real: columna env = production (las dos filas)", qr?.env === "production" && producers[0]?.env === "production", `${qr?.env} / ${producers[0]?.env}`);
  }
  const delQ = await db.from("quote_requests").delete({ count: "exact" }).in("id", quotes.map((r) => r.id));
  const delP = await db.from("producer_contacts").delete({ count: "exact" }).in("id", producers.map((r) => r.id));
  check("envío real: filas borradas con la clave secreta", !delQ.error && !delP.error && delQ.count === quotes.length && delP.count === producers.length, `${delQ.count} + ${delP.count}`);
  const left = [...(await quoteRows()), ...(await producerRows())].filter((r) => ("contact_name" in r ? r.contact_name : r.name).includes(" real "));
  check("envío real: ya no están en la base", left.length === 0);
  const record = {
    base,
    run,
    quote_requests: quotes,
    producer_contacts: producers,
    deleted: { quote_requests: delQ.count, producer_contacts: delP.count },
    checkedAfterDelete: left.length,
    at: new Date().toISOString(),
  };
  writeFileSync(join(out, "real-submit.json"), `${JSON.stringify(record, null, 2)}\n`);
  console.log("Registro de los envíos reales:", JSON.stringify(record));
}

async function main() {
  const browser = await chromium.launch();
  for (const locale of ["es", "en"] as const) {
    await tabsAndUrl(browser, locale);
    await prefill(browser, locale);
    await validation(browser, locale);
    await honeypot(browser, locale);
    await captures(browser, locale);
  }
  if (REAL_SUBMIT) await realSubmit(browser);
  await browser.close();

  // Limpieza: cualquier fila de esta corrida.
  const leftQ = await quoteRows();
  const leftP = await producerRows();
  if (leftQ.length) await db.from("quote_requests").delete().like("contact_name", `${MARK}%`);
  if (leftP.length) await db.from("producer_contacts").delete().like("name", `${MARK}%`);
  if (leftQ.length + leftP.length) console.log(`Limpieza: ${leftQ.length + leftP.length} filas de prueba borradas.`);

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.ok || !r.detail ? "" : ` — ${r.detail}`}`);
  console.log(`\n${results.length - failed.length}/${results.length} verificaciones OK`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
