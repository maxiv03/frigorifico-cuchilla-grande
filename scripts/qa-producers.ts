/**
 * QA del portal de productores (fase 4): pizarra y gráfico, cálculos de la calculadora,
 * precarga del formulario, errores de validación, honeypot, mensaje de límite y envío real.
 *   npm run qa:producers -- <url-base> [--rate-limit] [--real-submit]
 *
 *   --rate-limit   envía ofertas válidas hasta que la base corta (5 por IP cada 10 min) y verifica
 *                  el aviso traducido. Pensado para local (env development).
 *   --real-submit  un envío válido de verdad: lo busca en la base con la clave secreta, lo borra y
 *                  deja el registro en screenshots/producers/real-submit.json.
 *
 * Toda fila creada lleva en `name` la marca "QA producers <id de corrida>" y se borra al final con
 * la clave secreta (solo scripts). Capturas en screenshots/producers/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";
import { adminClient } from "./lib/db";
import { settlePage } from "./settle";

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000";
const RATE_LIMIT = args.includes("--rate-limit");
const REAL_SUBMIT = args.includes("--real-submit");
const run = Date.now().toString(36);
const MARK = `QA producers ${run}`;
const out = join(process.cwd(), "screenshots", "producers");
mkdirSync(out, { recursive: true });

const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });
const db = adminClient();

const paths = { es: "/es/productores", en: "/en/producers" } as const;
const text = {
  es: { rangeWeight: "Ingresá un valor entre 150 y 900.", rateLimited: "Recibimos demasiados envíos", success: "Recibimos tu oferta" },
  en: { rangeWeight: "Enter a value between 150 and 900.", rateLimited: "Too many submissions", success: "We received your offer" },
} as const;

/** "10.176" / "10,176" → 10176; "53,0" / "53.0" → 53 */
const num = (s: string, locale: "es" | "en") => Number(locale === "es" ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""));

async function open(page: Page, path: string) {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.waitForSelector("[data-calculator]");
  await page.waitForTimeout(300);
}

/** Completa el formulario con datos válidos (sin enviar). */
async function fillValid(page: Page, name = MARK) {
  const date = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  await page.selectOption("#f-category", "steer");
  await page.fill("#f-headCount", "35");
  await page.fill("#f-avgWeight", "470");
  await page.fill("#f-breed", "Hereford");
  await page.selectOption("#f-department", "Durazno");
  await page.fill("#f-availableFrom", date);
  await page.fill("#f-name", name);
  await page.fill("#f-phone", "099 000 000");
  await page.fill("#f-email", "qa@example.com");
  await page.fill("#f-notes", "Prueba automática de QA (se borra al terminar).");
  await page.check("#f-privacy");
}

async function rowsWithMark() {
  const { data, error } = await db.from("livestock_offers").select("id, env, created_at, name").like("name", `${MARK}%`);
  if (error) throw new Error(error.message);
  return data;
}

async function main() {
  const browser = await chromium.launch();

  for (const locale of ["es", "en"] as const) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await open(page, paths[locale]);

    // ─── 1. Pizarra completa y gráfico ─────────────────────────────────────
    const rows = await page.locator("[data-category] [data-price]").count();
    check(`${locale} pizarra: 6 categorías con precio`, rows === 6, String(rows));
    check(`${locale} pizarra: rótulo "Valores ficticios" visible`, await page.locator("[data-fictitious]").isVisible());
    check(`${locale} pizarra: explicación de la unidad`, await page.locator("#unit-title").isVisible());
    check(`${locale} gráfico: vacunos visible por defecto`, (await page.locator('[data-chart="beef"]').isVisible()) && !(await page.locator('[data-chart="lamb"]').isVisible()));
    await page.click('button[data-species="lamb"]');
    const lambOn = (await page.locator('[data-chart="lamb"]').isVisible()) && !(await page.locator('[data-chart="beef"]').isVisible());
    const pressed = await page.getAttribute('button[data-species="lamb"]', "aria-pressed");
    check(`${locale} gráfico: el selector cambia a ovinos (aria-pressed)`, lambOn && pressed === "true");
    const points = await page.locator('[data-chart="lamb"] svg path[fill="none"]').count();
    check(`${locale} gráfico: 3 líneas de ovinos`, points === 3, String(points));
    await page.click('button[data-species="beef"]');

    // ─── 2. Calculadora ────────────────────────────────────────────────────
    const calc = page.locator("[data-calculator]");
    const priceOf = async () => Number(await calc.locator("[data-price]").getAttribute("data-price"));
    const expectResult = async (label: string, heads: number, weight: number) => {
      const yieldPct = num(await page.inputValue("#f-calc-yield"), locale);
      const price = await priceOf();
      const kg = heads * weight * (yieldPct / 100);
      const shownKg = Number(await calc.locator("[data-carcass-kg]").getAttribute("data-carcass-kg"));
      const shownUsd = Number(await calc.locator("[data-gross-usd]").getAttribute("data-gross-usd"));
      const ok = shownKg === Math.round(kg) && shownUsd === Math.round(kg * price);
      check(`${locale} calculadora: ${label}`, ok, `kg ${shownKg} vs ${Math.round(kg)} · US$ ${shownUsd} vs ${Math.round(kg * price)} (rend. ${yieldPct}, precio ${price})`);
      return { kg, shownKg };
    };
    const first = await expectResult("40 novillos de 480 kg", 40, 480);
    const kgText = (await calc.locator("[data-carcass-kg]").textContent()) ?? "";
    const sep = locale === "es" ? "." : ",";
    check(`${locale} calculadora: kg con separador de miles del idioma`, kgText.includes(`${Math.floor(first.shownKg / 1000)}${sep}`), kgText);
    const usdText = (await calc.locator("[data-gross-usd]").textContent()) ?? "";
    check(`${locale} calculadora: monto en US$ con formato del idioma`, /^US\$ \d{1,3}([.,]\d{3})+$/.test(usdText.trim()) && usdText.includes(sep), usdText);
    await page.locator("#calculator").locator("xpath=ancestor::section").screenshot({ path: join(out, `${locale}_calculadora-1440.png`) });

    await page.fill("#f-calc-yield", locale === "es" ? "55,5" : "55.5");
    await expectResult("rendimiento editado a 55,5 %", 40, 480);
    await page.selectOption("#f-calc-category", "heavy_lamb");
    const lambYield = await page.inputValue("#f-calc-yield");
    const lambWeight = await page.inputValue("#f-calc-weight");
    check(`${locale} calculadora: otra categoría → rendimiento por defecto y peso ovino`, num(lambYield, locale) === 47 && lambWeight === "42", `${lambYield} · ${lambWeight}`);
    await page.fill("#f-calc-heads", "250");
    await expectResult("250 corderos de 42 kg", 250, 42);

    // Validación de rangos con mensaje traducido
    await page.selectOption("#f-calc-category", "steer");
    await page.fill("#f-calc-weight", "2000");
    await page.locator("#f-calc-weight").blur();
    const weightError = (await page.locator('[data-field="calc-weight"] [data-error]').textContent()) ?? "";
    check(`${locale} calculadora: peso fuera de rango → mensaje traducido`, weightError.includes(text[locale].rangeWeight), weightError);
    check(`${locale} calculadora: sin resultado ni botón con datos inválidos`, (await calc.locator('[data-result="invalid"]').count()) === 1 && (await page.locator("[data-calculator] button[disabled]").count()) === 1);
    await page.fill("#f-calc-yield", "80");
    await page.locator("#f-calc-yield").blur();
    check(`${locale} calculadora: rendimiento fuera de rango marcado`, (await page.locator("#f-calc-yield").getAttribute("aria-invalid")) === "true");

    // ─── 3. Precarga del formulario ────────────────────────────────────────
    await page.fill("#f-calc-weight", "455");
    await page.fill("#f-calc-yield", locale === "es" ? "53" : "53");
    await page.fill("#f-calc-heads", "64");
    await page.click("[data-calculator] button");
    await page.waitForTimeout(700);
    const pre = {
      category: await page.inputValue("#f-category"),
      heads: await page.inputValue("#f-headCount"),
      weight: await page.inputValue("#f-avgWeight"),
    };
    check(`${locale} precarga: categoría, cabezas y peso en el formulario`, pre.category === "steer" && pre.heads === "64" && pre.weight === "455", JSON.stringify(pre));
    const focusOffer = await page.evaluate(() => document.activeElement?.id);
    check(`${locale} precarga: el foco pasa al título del formulario`, focusOffer === "offer", String(focusOffer));
    await page.close();

    // ─── 4. Errores de validación ──────────────────────────────────────────
    const form = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await open(form, paths[locale]);
    await form.click('[data-offer-form] button[type="submit"]');
    await form.waitForSelector('[data-form-alert="error"]');
    const codes = await form.$$eval("[data-offer-form] [data-error]", (els) => Object.fromEntries(els.map((e) => [e.closest("[data-field]")?.getAttribute("data-field"), e.getAttribute("data-error")])));
    const required = ["category", "headCount", "avgWeight", "department", "availableFrom", "name", "phone", "privacy"];
    check(`${locale} validación: todos los obligatorios marcados`, required.every((f) => codes[f]), JSON.stringify(codes));
    check(`${locale} validación: opcionales sin error (raza, email, comentarios)`, !codes.breed && !codes.email && !codes.notes);
    check(`${locale} validación: aria-invalid en los campos con error`, (await form.locator('[data-offer-form] [aria-invalid="true"]').count()) >= required.length);
    const focused = await form.evaluate(() => document.activeElement?.getAttribute("name"));
    check(`${locale} validación: foco en el primer campo con error`, focused === "category", String(focused));

    await fillValid(form);
    await form.fill("#f-email", "no-es-un-mail");
    await form.fill("#f-avgWeight", "35");
    await form.fill("#f-availableFrom", "2020-01-01");
    await form.fill("#f-phone", "abc");
    await form.uncheck("#f-privacy");
    await form.click('[data-offer-form] button[type="submit"]');
    // Esperar la respuesta nueva (antes quedan los errores del primer envío).
    await form.waitForSelector('[data-offer-form] [data-field="email"] [data-error]');
    const codes2 = await form.$$eval("[data-offer-form] [data-error]", (els) => Object.fromEntries(els.map((e) => [e.closest("[data-field]")?.getAttribute("data-field"), e.getAttribute("data-error")])));
    check(
      `${locale} validación: email, peso por especie, fecha, teléfono y privacidad`,
      codes2.email === "email" && codes2.avgWeight === "range" && codes2.availableFrom === "dateRange" && codes2.phone === "phone" && codes2.privacy === "privacy",
      JSON.stringify(codes2),
    );
    check(`${locale} validación: conserva lo escrito`, (await form.inputValue("#f-name")) === MARK && (await form.inputValue("#f-headCount")) === "35");
    await form.locator("[data-offer-form]").screenshot({ path: join(out, `${locale}_formulario-errores-1440.png`) });
    const errorMobile = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
    await open(errorMobile, paths[locale]);
    await errorMobile.click('[data-offer-form] button[type="submit"]');
    await errorMobile.waitForSelector('[data-form-alert="error"]');
    await errorMobile.locator("[data-offer-form]").screenshot({ path: join(out, `${locale}_formulario-errores-375.png`) });
    await errorMobile.close();

    // ─── 5. Honeypot: "éxito" sin guardar nada ─────────────────────────────
    await open(form, paths[locale]);
    await fillValid(form, `${MARK} honeypot ${locale}`);
    await form.evaluate(() => {
      (document.querySelector('input[name="website"]') as HTMLInputElement).value = "https://spam.example";
    });
    await form.click('[data-offer-form] button[type="submit"]');
    await form.waitForSelector("[data-form-success]");
    await new Promise((r) => setTimeout(r, 1500));
    const honeypotRows = (await rowsWithMark()).filter((r) => r.name.includes("honeypot"));
    check(`${locale} honeypot: responde éxito y no guarda la fila`, honeypotRows.length === 0, `${honeypotRows.length} filas`);
    // La pantalla de éxito es la misma que la de un envío real: sirve para las capturas sin guardar filas.
    await form.locator("[data-form-success]").screenshot({ path: join(out, `${locale}_formulario-exito-1440.png`) });
    await form.close();
    const okMobile = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
    await open(okMobile, paths[locale]);
    await fillValid(okMobile, `${MARK} honeypot ${locale} 375`);
    await okMobile.evaluate(() => {
      (document.querySelector('input[name="website"]') as HTMLInputElement).value = "https://spam.example";
    });
    await okMobile.click('[data-offer-form] button[type="submit"]');
    await okMobile.waitForSelector("[data-form-success]");
    await okMobile.locator("[data-form-success]").screenshot({ path: join(out, `${locale}_formulario-exito-375.png`) });
    await okMobile.close();
  }

  // ─── 6. Límite de envíos (local) ─────────────────────────────────────────
  if (RATE_LIMIT) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    let blockedAt = 0;
    for (let i = 1; i <= 7 && !blockedAt; i++) {
      await open(page, paths.es);
      await fillValid(page, `${MARK} limite ${i}`);
      await page.click('[data-offer-form] button[type="submit"]');
      const outcome = await Promise.race([
        page.waitForSelector("[data-form-success]").then(() => "ok"),
        page.waitForSelector('[data-form-alert="error"]').then(() => "error"),
      ]);
      if (outcome === "error") {
        const alert = (await page.locator('[data-form-alert="error"]').textContent()) ?? "";
        check("límite: aviso traducido de envíos", alert.includes(text.es.rateLimited), alert);
        blockedAt = i;
        await page.locator("[data-offer-form]").screenshot({ path: join(out, "es_formulario-limite-1440.png") });
      }
    }
    check("límite: la base corta después de 5 envíos por IP", blockedAt > 1 && blockedAt <= 6, `cortó en el envío ${blockedAt || "ninguno"}`);
    await page.close();
  }

  // ─── 7. Envío real (uno) ─────────────────────────────────────────────────
  if (REAL_SUBMIT) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await open(page, paths.es);
    await fillValid(page, `${MARK} real es`);
    await page.click('[data-offer-form] button[type="submit"]');
    await page.waitForSelector("[data-form-success]", { timeout: 20_000 });
    const msg = (await page.locator("[data-form-success]").textContent()) ?? "";
    check("envío real: mensaje de éxito", msg.includes(text.es.success), msg.slice(0, 80));
    await page.close();
    const real = (await rowsWithMark()).filter((r) => r.name.includes(" real "));
    check("envío real: 1 fila guardada", real.length === 1, JSON.stringify(real));
    if (!base.includes("localhost")) check("envío real: columna env = production", real[0]?.env === "production", String(real[0]?.env));
    const del = await db.from("livestock_offers").delete({ count: "exact" }).in("id", real.map((r) => r.id));
    check("envío real: filas borradas con la clave secreta", !del.error && del.count === real.length, del.error?.message ?? `${del.count} borradas`);
    const left = (await rowsWithMark()).filter((r) => r.name.includes(" real "));
    check("envío real: ya no están en la base", left.length === 0);
    const record = { base, run, inserted: real, deleted: del.count, checkedAfterDelete: left.length, at: new Date().toISOString() };
    writeFileSync(join(out, "real-submit.json"), `${JSON.stringify(record, null, 2)}\n`);
    console.log("Registro del envío real:", JSON.stringify(record));
  }

  // ─── Capturas del portal completo ───────────────────────────────────────
  for (const locale of ["es", "en"] as const) {
    for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
      const page = await browser.newPage({ viewport: vp, deviceScaleFactor: vp.width < 640 ? 2 : 1 });
      await open(page, paths[locale]);
      await settlePage(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`${locale} ${vp.width} px: sin scroll horizontal`, overflow <= 0, String(overflow));
      check(`${locale} ${vp.width} px: un solo h1`, (await page.locator("h1").count()) === 1);
      await page.screenshot({ path: join(out, `${locale}_portal-${vp.width}.png`), fullPage: true });
      if (vp.width < 640) await page.locator("#calculator").locator("xpath=ancestor::section").screenshot({ path: join(out, `${locale}_calculadora-375.png`) });
      await page.close();
    }
  }

  await browser.close();

  // Limpieza: cualquier fila de esta corrida (límite incluido).
  const leftovers = await rowsWithMark();
  if (leftovers.length) {
    const { error } = await db.from("livestock_offers").delete().like("name", `${MARK}%`);
    console.log(`Limpieza: ${leftovers.length} filas de prueba borradas${error ? ` (error: ${error.message})` : ""}.`);
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.ok || !r.detail ? "" : ` — ${r.detail}`}`);
  console.log(`\n${results.length - failed.length}/${results.length} verificaciones OK`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
