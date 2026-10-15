/**
 * Capturas de QA: cada ruta en escritorio (1440 px) y móvil (375 px), página completa.
 *   npm run shots -- <url-base> <ruta> [ruta…]
 *   npm run shots -- http://localhost:3000 es en es/productos
 *   --menu  además captura el menú móvil abierto (375 px) → <ruta>--mobile-menu.png
 * Salida: screenshots/<ruta>--desktop.png y --mobile.png
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const openMenu = args.includes("--menu");
const [baseUrl, ...rawPaths] = args.filter((a) => a !== "--menu");
// Acepta "es/productos" o "/es/productos". En Git Bash, usar MSYS_NO_PATHCONV=1 o rutas sin barra
// inicial: si no, convierte "/es" en "C:/Program Files/Git/es".
const paths = rawPaths.map((p) => `/${p.replace(/^\/+/, "")}`);
if (!baseUrl || rawPaths.length === 0) {
  console.error("Uso: npm run shots -- <url-base> <ruta> [ruta…]");
  process.exit(1);
}

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];

const outDir = join(process.cwd(), "screenshots");
mkdirSync(outDir, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  try {
    for (const vp of viewports) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.name === "mobile" ? 2 : 1,
      });
      for (const path of paths) {
        const response = await page.goto(new URL(path, baseUrl).toString(), { waitUntil: "networkidle" });
        const file = join(outDir, `${path.replace(/^\/|\/$/g, "").replace(/[/?=&]/g, "_") || "root"}--${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`  ${response?.status()} ${vp.name.padEnd(7)} ${path} → ${file}`);
        if (openMenu && vp.name === "mobile") {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.locator("header button[aria-expanded]").first().click();
          await page.waitForTimeout(300);
          const menuFile = file.replace("--mobile.png", "--mobile-menu.png");
          await page.screenshot({ path: menuFile });
          console.log(`  menú    ${path} → ${menuFile}`);
          await page.keyboard.press("Escape");
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
