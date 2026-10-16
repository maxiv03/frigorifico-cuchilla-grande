/**
 * Capturas del README (docs/img), desde producción o la URL que se pase.
 *   npx tsx scripts/readme-shots.ts [url-base]
 * Escritorio a 1440×900 (vista, no página completa) y una composición de tres pantallas móviles.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";
import sharp from "sharp";
import { settlePage } from "./settle";

const base = (process.argv[2] ?? "https://frigorifico-cuchilla-grande.vercel.app").replace(/\/$/, "");
const out = join(process.cwd(), "docs", "img");
mkdirSync(out, { recursive: true });

/** Lleva un elemento al borde superior (debajo del header sticky). */
async function scrollTo(page: Page, selector: string, offset = 88) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (off as number), behavior: "instant" });
    },
    [selector, offset],
  );
  await page.waitForTimeout(500);
}

const DESKTOP: { file: string; path: string; prepare?: (p: Page) => Promise<void> }[] = [
  { file: "home.jpg", path: "/es" },
  {
    file: "catalogo-diagrama.jpg",
    path: "/es/productos?zone=loin",
    prepare: (p) => scrollTo(p, '[aria-labelledby="zonas-titulo"]', 200),
  },
  { file: "detalle-corte.jpg", path: "/es/productos/vacuno/tapa-de-cuadril", prepare: (p) => scrollTo(p, "h1", 140) },
  {
    file: "mercados-mapa.jpg",
    path: "/es/mercados",
    prepare: async (p) => {
      await scrollTo(p, "#mapa", 100);
      await p.focus('[data-market="eu"]');
      await p.waitForTimeout(300);
    },
  },
  { file: "portal-productores.jpg", path: "/es/productores", prepare: (p) => scrollTo(p, "#board", 110) },
];

const MOBILE = ["/es", "/es/productos", "/es/productores#calculator"];

(async () => {
  const browser = await chromium.launch();
  for (const shot of DESKTOP) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(`${base}${shot.path}`, { waitUntil: "load" });
    await settlePage(page);
    await shot.prepare?.(page);
    const png = await page.screenshot();
    await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(join(out, shot.file));
    console.log(shot.file);
    await page.close();
  }

  // Móvil: tres pantallas de 390×844 lado a lado sobre fondo claro.
  const phones: Buffer[] = [];
  for (const path of MOBILE) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const [route, hash] = path.split("#");
    await page.goto(`${base}${route}`, { waitUntil: "load" });
    await settlePage(page);
    if (hash) await scrollTo(page, `#${hash}`, 84);
    phones.push(await sharp(await page.screenshot()).resize(390 * 1.5).toBuffer());
    await page.close();
  }
  const w = 585;
  const h = Math.round((844 / 390) * w);
  const gap = 48;
  await sharp({ create: { width: w * 3 + gap * 4, height: h + gap * 2, channels: 3, background: "#f3ece0" } })
    .composite(phones.map((input, i) => ({ input, left: gap + i * (w + gap), top: gap })))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(out, "movil.jpg"));
  console.log("movil.jpg");
  await browser.close();
})();
