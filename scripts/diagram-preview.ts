/**
 * Renderiza los diagramas de cortes a PNG para revisarlos (geometría, encastre de zonas).
 *   npm run diagram:preview -- [carpeta-salida]   (por defecto screenshots/diagram)
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { diagrams, toPath } from "../src/components/cuts/diagram-geometry";

const outDir = process.argv[2] ?? join(process.cwd(), "screenshots", "diagram");
mkdirSync(outDir, { recursive: true });
const palette = ["#e8c9a0", "#c98f6b", "#e3b6a8", "#b97a5b", "#efd9b4", "#d49a8a", "#caa27a", "#e9c3b8", "#b8875e", "#dcb48c", "#c4a08a", "#c4a08a"];

async function main() {
  for (const [species, g] of Object.entries(diagrams)) {
    const zones = g.zones
      .map((z, i) => `<path d="${toPath(z.polygon)}" fill="${palette[i % palette.length]}" stroke="#fff" stroke-width="3" clip-path="url(#b)"/>`)
      .join("");
    const labels = g.zones
      .filter((z) => z.label)
      .map((z) => `<text x="${z.label![0]}" y="${z.label![1]}" font-size="16" font-family="sans-serif" text-anchor="${z.anchor ?? "middle"}" fill="#1f1a17">${z.piece ?? z.id}</text>`)
      .join("");
    const [x, y, w, h] = g.viewBox.split(" ").map(Number);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.viewBox}" width="${w * 1.5}" height="${h * 1.5}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f7f5f1"/>
      <defs><clipPath id="b"><path d="${g.body}"/></clipPath></defs>
      ${g.behind.map((d) => `<path d="${d}" fill="#d9d2c8" stroke="#7a1f2b" stroke-width="3"/>`).join("")}
      <path d="${g.body}" fill="#d9d2c8"/>
      ${zones}
      <path d="${g.body}" fill="none" stroke="#7a1f2b" stroke-width="3"/>
      ${g.over.map((d) => `<path d="${d}" fill="#d9d2c8" stroke="#7a1f2b" stroke-width="3"/>`).join("")}
      ${labels}
    </svg>`;
    const file = join(outDir, `${species}.png`);
    await sharp(Buffer.from(svg)).png().toFile(file);
    console.log(file);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
