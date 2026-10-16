import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { diagrams, toPath } from "@/components/cuts/diagram-geometry";
import type { Species } from "@/lib/catalog/types";

/**
 * Plantillas de marca de las imágenes Open Graph (next/og, 1200×630), una por tipo de página:
 * general, corte y noticia. Colores = tokens de globals.css (acá van en hex porque Satori no lee
 * CSS). Fuentes estáticas de la marca en ./fonts (Source Serif 4 y Source Sans 3, OFL).
 * Se generan en el build (rutas estáticas): leen archivos del repo con process.cwd().
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
const DECORATIVE = "";

const C = {
  brand700: "#7a1f2b",
  brand800: "#631824",
  brand900: "#4c121c",
  brand200: "#ebc5ca",
  earth50: "#faf6ef",
  earth100: "#f3ece0",
  earth300: "#d4bf9c",
  earth600: "#8a6c44",
  ink: "#1f1a17",
  white: "#ffffff",
};

const root = process.cwd();
const fontFile = (name: string) => readFile(join(root, "src/lib/og/fonts", name));

async function fonts() {
  const [serif, sans, sansSemi] = await Promise.all([
    fontFile("source-serif-4-latin-600-normal.woff"),
    fontFile("source-sans-3-latin-400-normal.woff"),
    fontFile("source-sans-3-latin-600-normal.woff"),
  ]);
  return [
    { name: "Serif", data: serif, weight: 600 as const, style: "normal" as const },
    { name: "Sans", data: sans, weight: 400 as const, style: "normal" as const },
    { name: "Sans", data: sansSemi, weight: 600 as const, style: "normal" as const },
  ];
}

/** Isotipo (mismo trazo que public/brand), en el color pedido. */
function Isotype({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <mask id="c" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="#fff" />
          <path d="M-0.54 18.13L17.19 15.01" stroke="#000" strokeWidth="2.4" />
          <path d="M-0.54 34.03L17.19 30.91" stroke="#000" strokeWidth="2.4" />
        </mask>
      </defs>
      <path d="M35.82 33.23A15 15 0 1 1 35.82 14.77" fill="none" stroke={color} strokeWidth="7" mask="url(#c)" />
    </svg>
  );
}

type Brand = { kicker: string; brand: string; disclaimer: string };

function Header({ brand, light }: { brand: Brand; light: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <Isotype size={64} color={light ? C.white : C.brand700} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: "Sans", fontWeight: 600, fontSize: 18, letterSpacing: 5, color: light ? C.earth300 : C.earth600 }}>
          {brand.kicker.toUpperCase()}
        </span>
        <span style={{ fontFamily: "Serif", fontSize: 32, color: light ? C.white : C.ink, marginTop: -4 }}>{brand.brand}</span>
      </div>
    </div>
  );
}

function Footer({ brand, light }: { brand: Brand; light: boolean }) {
  return (
    <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 600, fontSize: 22, color: light ? C.brand200 : C.earth600 }}>{brand.disclaimer}</div>
  );
}

/** General: fondo bordó, antetítulo, título grande y bajada. */
export async function renderGeneral({ brand, eyebrow, title, description }: { brand: Brand; eyebrow: string; title: string; description: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: C.brand800 }}>
        <Header brand={brand} light />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <span style={{ fontFamily: "Sans", fontWeight: 600, fontSize: 24, letterSpacing: 4, color: C.earth300 }}>{eyebrow.toUpperCase()}</span>
          <span style={{ fontFamily: "Serif", fontSize: title.length > 40 ? 64 : 76, lineHeight: 1.08, color: C.white, marginTop: 14 }}>{title}</span>
          <span style={{ fontFamily: "Sans", fontSize: 30, lineHeight: 1.35, color: C.brand200, marginTop: 22 }}>{clip(description, 140)}</span>
        </div>
        <Footer brand={brand} light />
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}

/** Corte: texto a la izquierda; a la derecha, la silueta de la especie con la zona del corte resaltada. */
export async function renderCut({
  brand,
  species,
  speciesLabel,
  zoneId,
  zoneLabel,
  name,
  alias,
}: {
  brand: Brand;
  species: Species;
  speciesLabel: string;
  zoneId: string;
  zoneLabel: string;
  name: string;
  alias: string | null;
}) {
  const g = diagrams[species];
  const [, , vw, vh] = g.viewBox.split(" ").map(Number);
  const w = 560;
  const h = Math.round((w * vh) / vw);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.earth50 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600, padding: 64 }}>
          <Header brand={brand} light={false} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Sans", fontWeight: 600, fontSize: 24, letterSpacing: 4, color: C.brand700 }}>
              {`${speciesLabel} · ${zoneLabel}`.toUpperCase()}
            </span>
            <span style={{ fontFamily: "Serif", fontSize: name.length > 22 ? 58 : 72, lineHeight: 1.05, color: C.ink, marginTop: 12 }}>{name}</span>
            {alias && <span style={{ fontFamily: "Sans", fontSize: 32, color: C.earth600, marginTop: 10 }}>{alias}</span>}
          </div>
          <Footer brand={brand} light={false} />
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", background: C.earth100 }}>
          <svg width={w} height={h} viewBox={g.viewBox}>
            <defs>
              <clipPath id="body">
                <path d={g.body} />
              </clipPath>
            </defs>
            {g.behind.map((d, i) => (
              <path key={`b${i}`} d={d} fill={C.earth300} />
            ))}
            <path d={g.body} fill={C.earth300} />
            <g clipPath="url(#body)">
              {g.zones.map((z) => (
                <path
                  key={z.id}
                  d={toPath(z.polygon)}
                  fill={z.id === zoneId || (zoneId === "shank" && z.id === "shank_hind") ? C.brand700 : C.earth300}
                  stroke={C.earth50}
                  strokeWidth={3}
                />
              ))}
            </g>
            {g.over.map((d, i) => (
              <path key={`o${i}`} d={d} fill={C.earth300} stroke={C.earth50} strokeWidth={3} />
            ))}
            <path d={g.body} fill="none" stroke={C.earth600} strokeWidth={3} />
          </svg>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}

/** Noticia: foto a la derecha (si hay), fecha y título a la izquierda sobre bordó oscuro. */
export async function renderNews({ brand, kicker, date, title, image }: { brand: Brand; kicker: string; date: string; title: string; image: string | null }) {
  const photo = image ? `data:image/jpeg;base64,${(await readFile(join(root, "public/images/news", `${image}.jpg`))).toString("base64")}` : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.brand900 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: photo ? 640 : 1200, padding: 64 }}>
          <Header brand={brand} light />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Sans", fontWeight: 600, fontSize: 24, letterSpacing: 4, color: C.earth300 }}>{`${kicker} · ${date}`.toUpperCase()}</span>
            <span style={{ fontFamily: "Serif", fontSize: title.length > 50 ? 50 : 60, lineHeight: 1.1, color: C.white, marginTop: 14 }}>{title}</span>
          </div>
          <Footer brand={brand} light />
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori solo acepta <img>; foto decorativa (alt vacío)
          <img src={photo} alt={DECORATIVE} width={560} height={630} style={{ objectFit: "cover" }} />
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}

function clip(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
