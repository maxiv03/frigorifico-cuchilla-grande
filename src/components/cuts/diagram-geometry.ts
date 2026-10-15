/**
 * Geometría de los diagramas de cortes (siluetas propias, de perfil, mirando a la izquierda).
 *
 * Cómo encajan las zonas sin huecos ni superposiciones: cada zona es un polígono de una
 * PARTICIÓN del plano (los vecinos comparten exactamente los mismos vértices) y se recorta
 * con la silueta (`clipPath`). Lo que queda fuera de toda zona (cabeza, cola, pezuñas) se
 * pinta con el tono neutro de la silueta y no es interactivo.
 *
 * Los ids de zona son los de `cut_zones` en la base. Vista previa: `npm run diagram:preview`.
 */
import type { Species } from "@/lib/catalog/types";

type Pt = readonly [number, number];

export type ZoneShape = {
  id: string;
  /** Polígono de la partición (puede exceder la silueta: se recorta). */
  polygon: readonly Pt[];
  /** Punto donde va la etiqueta, dentro de la parte visible. */
  label: Pt;
};

export type DiagramGeometry = {
  viewBox: string;
  /** Contorno del cuerpo (define el recorte de las zonas). */
  body: string;
  /** Partes neutras detrás del cuerpo (cola). */
  behind: readonly string[];
  /** Partes neutras por encima de las zonas (oreja). No interactivas. */
  over: readonly string[];
  zones: readonly ZoneShape[];
};

export const toPath = (polygon: readonly Pt[]) => `M${polygon.map(([x, y]) => `${x} ${y}`).join("L")}Z`;

/**
 * Tramo festoneado (lana) de `from` a `to`, con `n` ondas hacia el lado `out` (vector unitario).
 * Devuelve comandos Q que continúan el trazo desde `from`.
 */
function scallops(from: Pt, to: Pt, n: number, amp: number, out: Pt) {
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const x0 = from[0] + (to[0] - from[0]) * t0;
    const y0 = from[1] + (to[1] - from[1]) * t0;
    const x1 = from[0] + (to[0] - from[0]) * t1;
    const y1 = from[1] + (to[1] - from[1]) * t1;
    const cx = (x0 + x1) / 2 + out[0] * amp;
    const cy = (y0 + y1) / 2 + out[1] * amp;
    parts.push(`Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`);
  }
  return parts.join("");
}

// ─── Vacuno ────────────────────────────────────────────────────────────────
const beef: DiagramGeometry = {
  viewBox: "40 96 880 500",
  body: [
    "M168 152",
    "C150 150 128 160 112 178",
    "L72 262C64 280 70 298 88 302",
    "C108 306 130 300 146 292",
    "C168 290 196 298 214 318",
    "C236 344 252 380 262 412",
    "C268 428 276 440 290 448",
    // patas delanteras (cercana y lejana)
    "L292 545L288 575L324 575L326 545L330 458",
    "L344 462L346 545L344 575L378 575L378 545L382 456",
    // vientre
    "C470 466 600 466 700 452",
    // patas traseras
    "L712 545L710 575L744 575L748 545L756 470",
    "L772 474C780 500 790 516 794 530L790 575L826 575L828 530",
    "C836 484 848 440 862 400",
    "C874 360 880 300 878 246",
    "C876 216 868 196 856 184",
    // lomo y cruz
    "C800 168 700 166 600 170",
    "C480 172 380 160 300 150",
    "C260 146 220 140 196 144",
    "C188 146 178 148 168 152Z",
  ].join(""),
  over: [
    // oreja, hacia atrás (razas sin cuernos: Hereford/Angus mochos)
    "M178 160C194 154 218 158 240 170C248 176 244 184 234 184C212 182 192 176 178 170Z",
  ],
  behind: [
    // cola
    "M858 186C872 196 880 230 884 300L890 400C896 406 900 420 896 432C888 440 876 436 874 424L878 400L872 300C868 240 862 206 852 192Z",
  ],
  zones: [
    { id: "neck", polygon: [[200, 0], [305, 0], [312, 236], [320, 335], [236, 345]], label: [262, 245] },
    { id: "chuck", polygon: [[305, 0], [440, 0], [446, 240], [312, 236]], label: [376, 200] },
    { id: "blade", polygon: [[312, 236], [446, 240], [452, 392], [330, 405], [320, 335]], label: [386, 320] },
    {
      id: "brisket",
      polygon: [[0, 345], [236, 345], [320, 335], [330, 405], [452, 392], [420, 478], [0, 478]],
      label: [300, 425],
    },
    { id: "rib", polygon: [[440, 0], [565, 0], [568, 246], [446, 240]], label: [505, 205] },
    {
      id: "plate",
      polygon: [[446, 240], [568, 246], [612, 600], [420, 600], [420, 478], [452, 392]],
      label: [515, 380],
    },
    { id: "loin", polygon: [[565, 0], [762, 0], [758, 250], [568, 246]], label: [662, 210] },
    { id: "flank", polygon: [[568, 246], [758, 250], [696, 450], [696, 478], [684, 600], [612, 600]], label: [650, 370] },
    { id: "rump", polygon: [[762, 0], [900, 0], [870, 232], [758, 250]], label: [815, 210] },
    {
      id: "round",
      polygon: [[758, 250], [870, 232], [900, 0], [1000, 0], [1000, 478], [696, 478], [696, 450]],
      label: [800, 355],
    },
    {
      id: "shank",
      // dos piezas (patas delanteras y traseras) en un solo polígono con hueco intermedio
      polygon: [[0, 478], [420, 478], [420, 600], [0, 600]],
      label: [228, 530],
    },
    { id: "shank_hind", polygon: [[696, 478], [1000, 478], [1000, 600], [684, 600]], label: [770, 530] },
  ],
};

// ─── Ovino ─────────────────────────────────────────────────────────────────
const lamb: DiagramGeometry = {
  viewBox: "60 70 800 486",
  body: [
    "M196 118",
    // cabeza chica, perfil de nariz convexo
    "C182 110 162 112 152 124",
    "C140 140 124 164 116 182C110 196 116 208 130 210",
    "C146 212 164 206 178 200",
    "C192 202 206 212 216 228",
    "C228 248 236 282 246 312",
    // pecho con lana
    "C250 330 256 348 270 358",
    "L290 364",
    // patas delanteras (finas, largas, sin lana)
    "L292 520L290 540L316 540L316 520L318 372",
    "L334 374L336 520L334 540L360 540L360 520L364 378",
    // vientre con lana
    scallops([364, 378], [652, 374], 7, 14, [0, 1]),
    // patas traseras
    "L656 520L654 540L680 540L680 520L688 386",
    "L706 390C714 430 722 470 726 498L724 540L752 540L752 504",
    "C762 450 774 410 790 368",
    // anca redondeada con lana
    scallops([790, 368], [808, 238], 3, 12, [1, 0]),
    "C800 192 776 166 740 158",
    // lomo con lana
    scallops([740, 158], [262, 140], 11, 13, [0, -1]),
    "C236 134 214 122 196 118Z",
  ].join(""),
  over: [
    // oreja horizontal, caída hacia atrás
    "M202 134C218 132 240 138 258 152C266 158 262 166 252 166C234 164 214 156 200 146Z",
  ],
  behind: [
    // cola corta con lana
    "M796 196C814 190 830 204 830 224C830 246 818 260 802 262Z",
  ],
  zones: [
    { id: "neck", polygon: [[215, 0], [300, 0], [310, 250], [244, 262]], label: [266, 200] },
    { id: "shoulder", polygon: [[300, 0], [430, 0], [436, 312], [318, 326], [310, 250]], label: [370, 245] },
    { id: "rack", polygon: [[430, 0], [550, 0], [554, 300], [436, 312]], label: [492, 235] },
    { id: "loin", polygon: [[550, 0], [672, 0], [668, 290], [554, 300]], label: [610, 230] },
    {
      id: "leg",
      polygon: [[672, 0], [1000, 0], [1000, 466], [652, 466], [640, 396], [668, 290]],
      label: [735, 290],
    },
    {
      id: "breast",
      polygon: [
        [0, 262], [244, 262], [310, 250], [318, 326], [436, 312], [554, 300], [668, 290],
        [640, 396], [640, 600], [370, 600], [370, 396], [0, 396],
      ],
      label: [480, 352],
    },
    { id: "shank", polygon: [[0, 396], [370, 396], [370, 600], [0, 600]], label: [240, 480] },
    { id: "shank_hind", polygon: [[652, 466], [1000, 466], [1000, 600], [640, 600], [640, 396]], label: [700, 505] },
  ],
};

export const diagrams: Record<Species, DiagramGeometry> = { beef, lamb };

/**
 * Algunas zonas se dibujan en más de una pieza (garrón delantero y trasero). `shank_hind`
 * es solo geometría: se agrupa con `shank` para la interacción y la etiqueta.
 */
export const zonePieceOf = (id: string) => (id === "shank_hind" ? "shank" : id);
