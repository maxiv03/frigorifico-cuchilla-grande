/**
 * Países (ISO 3166-1 numérico, como los ids de world-atlas / Natural Earth) que pinta cada
 * mercado en el mapa. Es geometría, no contenido: el nombre, la participación y la descripción
 * de cada mercado están en la base (seed `markets`). Un mercado puede abarcar varios países.
 */
export const marketCountries: Record<string, readonly string[]> = {
  cn: ["156"],
  // Unión Europea (27). Malta no está en la escala 110m de Natural Earth.
  eu: [
    "040", "056", "100", "191", "196", "203", "208", "233", "246", "250", "276", "300", "348", "372",
    "380", "428", "440", "442", "470", "528", "616", "620", "642", "703", "705", "724", "752",
  ],
  us: ["840"],
  il: ["376"],
  br: ["076"],
  uk: ["826"],
  ca: ["124"],
  // Medio Oriente: Arabia Saudita, Emiratos Árabes Unidos, Jordania, Kuwait
  me: ["682", "784", "400", "414"],
  jp: ["392"],
};

/** País de origen (Uruguay), destacado en el mapa. */
export const ORIGIN_COUNTRY = "858";

/** Antártida: fuera del encuadre. */
export const HIDDEN_COUNTRIES = new Set(["010"]);

/**
 * Escala de bordó por participación (de más claro a más oscuro). Mismos tramos en el mapa y
 * en la leyenda; el color nunca es la única pista (la lista y el panel dan el porcentaje).
 */
export const SHARE_BINS = [
  { min: 30, fill: "fill-brand-900", swatch: "bg-brand-900" },
  { min: 12, fill: "fill-brand-700", swatch: "bg-brand-700" },
  { min: 6, fill: "fill-brand-500", swatch: "bg-brand-500" },
  { min: 0, fill: "fill-brand-300", swatch: "bg-brand-300" },
] as const;

export const shareBin = (pct: number) => SHARE_BINS.find((b) => pct >= b.min) ?? SHARE_BINS[SHARE_BINS.length - 1];
