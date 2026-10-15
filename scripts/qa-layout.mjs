/**
 * QA de layout y accesibilidad (fase 1): skip link, menú móvil, selector de idioma, imágenes,
 * overflow a 375 px.   npm run qa:layout -- <url-base>
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const base = process.argv[2];
const ok = (c, m) => console.log(`${c ? "  ✓" : "  ✗"} ${m}`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto(`${base}/es?species=beef&market=cn`, { waitUntil: "networkidle" });

// Skip link
await page.keyboard.press("Tab");
const skip = await page.evaluate(() => ({ text: document.activeElement?.textContent, href: document.activeElement?.getAttribute("href"), w: document.activeElement?.getBoundingClientRect().width }));
ok(skip.href === "#contenido" && skip.w > 20, `primer Tab = skip link visible ("${skip.text}")`);

// Selector de idioma conserva filtros
const enHref = await page.locator('header nav a[hreflang="en"]').first().getAttribute("href");
ok(enHref === "/en?species=beef&market=cn", `selector EN conserva filtros → ${enHref}`);

// Menú móvil
const btn = page.locator("header button[aria-expanded]").first();
ok((await btn.getAttribute("aria-expanded")) === "false", "botón menú aria-expanded=false");
await btn.click();
ok((await btn.getAttribute("aria-expanded")) === "true", "al abrir aria-expanded=true");
const dialog = page.locator('[role="dialog"][aria-modal="true"]');
ok(await dialog.isVisible(), "panel role=dialog aria-modal visible");
const controls = await btn.getAttribute("aria-controls");
ok((await dialog.getAttribute("id")) === controls, "aria-controls apunta al panel");
const inside = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
ok(await inside(), "foco dentro del panel al abrir");
let trapped = true;
for (let i = 0; i < 15; i++) { await page.keyboard.press("Tab"); if (!(await inside())) trapped = false; }
for (let i = 0; i < 15; i++) { await page.keyboard.press("Shift+Tab"); if (!(await inside())) trapped = false; }
ok(trapped, "Tab / Shift+Tab no salen del panel (foco atrapado)");
const bodyLocked = await page.evaluate(() => document.body.style.overflow === "hidden");
ok(bodyLocked, "scroll del fondo bloqueado");
await page.keyboard.press("Escape");
ok(!(await dialog.count()), "Escape cierra el panel");
ok((await btn.getAttribute("aria-expanded")) === "false", "aria-expanded vuelve a false");
const focusBack = await page.evaluate(() => document.activeElement?.getAttribute("aria-expanded") !== null);
ok(focusBack, "foco vuelve al botón del menú");

// Imágenes
const imgs = await page.$$eval("img", (els) => els.map((e) => ({ src: e.currentSrc.split("?")[0].split("/").pop() || e.src.slice(0, 60), fp: e.getAttribute("fetchpriority"), loading: e.getAttribute("loading"), alt: e.alt, sizes: e.sizes })));
ok(imgs[0].fp === "high", `hero con fetchpriority=high`);
ok(imgs.slice(1).every((i) => i.loading === "lazy" && i.fp !== "high"), "resto de imágenes lazy, sin prioridad");
ok(imgs.every((i) => i.alt && i.alt.length > 5), "todas las imágenes con alt");
console.log("   ", imgs.map((i) => `${i.loading ?? "eager"}/${i.fp ?? "-"} sizes="${i.sizes}"`).join("\n    "));

// Overflow horizontal a 375
for (const path of ["/es", "/en", "/es/no-existe"]) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  const of = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(of <= 0, `sin scroll horizontal a 375 px en ${path} (${of}px)`);
}
// Escritorio: menú móvil oculto, h1 único
const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto(base + "/en", { waitUntil: "networkidle" });
ok((await d.locator("h1").count()) === 1, "un solo h1 en la home");
ok(!(await d.locator("header button[aria-expanded]").first().isVisible()), "botón de menú oculto en escritorio");
const heroH = await d.evaluate(() => document.querySelector("section")?.getBoundingClientRect().height);
console.log("    alto del hero en 1440×900:", heroH);
await browser.close();
