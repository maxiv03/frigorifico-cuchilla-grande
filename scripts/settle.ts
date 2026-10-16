/**
 * Prepara una página para una captura completa: la recorre con scroll hasta el final (dispara
 * las imágenes `loading="lazy"`), espera a que TODAS las imágenes visibles estén cargadas y
 * decodificadas, y vuelve arriba. Falla con la lista de imágenes pendientes si no terminan a tiempo.
 *
 * El placeholder blur de next/image es un `background-image` del propio <img>: se ve solo mientras
 * la foto no está pintada. Con la foto cargada y decodificada queda tapado (las fotos son JPG
 * opacos con object-cover). El hero usa getImageProps (<picture>), que no quita ese estilo al
 * cargar; por eso el criterio es "cargada y decodificada", no la ausencia del estilo.
 */
import type { Page } from "@playwright/test";

export async function settlePage(page: Page, { timeout = 20_000 } = {}) {
  // Scroll por pantallas, con una pausa para que el navegador pida las imágenes que entran.
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 200));
  });

  const done = () =>
    [...document.images].every(
      (img) =>
        img.getClientRects().length === 0 ||
        (img.complete && img.naturalWidth > 0),
    );
  // Si vence el tiempo, se sigue para informar cuáles quedaron pendientes.
  await page
    .waitForFunction(done, undefined, { timeout, polling: 100 })
    .catch(() => {});
  const left = await page.evaluate(() =>
    [...document.images]
      .filter(
        (img) =>
          img.getClientRects().length > 0 &&
          !(img.complete && img.naturalWidth > 0),
      )
      .map((img) => img.currentSrc || img.src || img.outerHTML.slice(0, 120)),
  );
  if (left.length > 0)
    throw new Error(
      `Imágenes sin cargar en ${page.url()}:\n  ${left.join("\n  ")}`,
    );
  // Decodificadas: listas para pintarse en la captura (no el placeholder).
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length > 0)
        .map((i) => i.decode().catch(() => {})),
    ),
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  // Fuentes y una pausa corta para transiciones (header sticky, fundidos).
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}
