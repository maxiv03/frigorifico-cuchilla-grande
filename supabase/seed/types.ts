import type { Localized } from "@/data/company";

export type { Localized };

export type LocaleSeed = { code: string; name: string; isDefault: boolean; sort: number };

export type PriceCategorySeed = {
  id: string;
  species: "beef" | "lamb";
  /** US$/kg carcasa (ficticio). Ancla de la rotación semanal. */
  basePrice: number;
  /** Rendimiento estimado en carcasa (%), usado por la calculadora. */
  yieldPct: number;
  sort: number;
  name: Localized;
};

export type MarketSeed = {
  /** Clave neutra (también en la URL: ?market=cn). */
  id: string;
  lat: number;
  lng: number;
  /** Participación ficticia en las exportaciones (%). */
  sharePct: number;
  sort: number;
  name: Localized;
  description: Localized;
};

export type CutZoneSeed = {
  /** Clave neutra dentro de la especie (?zone=loin). En la base: `${species}_${key}`. */
  key: string;
  species: "beef" | "lamb";
  sort: number;
  name: Localized;
};

/**
 * Foto del tipo de pieza (src/lib/catalog/images.ts), siempre de la especie del corte.
 * Solo cuando la foto muestra ESA pieza; sin foto, el detalle usa la ilustración de la zona.
 */
export type CutImageKey =
  | "beef-tenderloin"
  | "beef-striploin"
  | "beef-rump-cap"
  | "beef-ribeye"
  | "beef-ribs"
  | "beef-flank"
  | "beef-shank"
  | "lamb-rack"
  | "lamb-leg"
  | "lamb-chops";

export type CutSeed = {
  /** Clave interna; en la base: `${species}_${key}`. No se muestra. */
  key: string;
  species: "beef" | "lamb";
  zone: string;
  bone: "bone_in" | "boneless";
  presentations: ("chilled" | "frozen")[];
  markets: string[];
  image?: CutImageKey;
  featured?: boolean;
  /** ES: nombre INAC. EN: término de exportación. */
  name: Localized;
  /** Término alternativo (EN: de consumidor). Opcional por idioma. */
  alias?: Partial<Localized>;
  description: Localized;
};

/** Ícono propio del badge (src/components/quality/cert-badge.tsx). Nunca logos oficiales. */
export type CertIcon = "crescent" | "star" | "shield" | "rosette" | "stamp" | "globe" | "flag" | "pin";

export type CertificationSeed = {
  /** Clave neutra; ancla en /calidad (#cert-halal). */
  id: string;
  /** Grupo en /calidad: certificación (norma o rito) o habilitación sanitaria de un mercado. */
  kind: "certification" | "approval";
  icon: CertIcon;
  sort: number;
  name: Localized;
  /** Texto breve. Sin números de certificado. */
  summary: Localized;
  /** Mercados del seed donde se usa (market_certifications); en /calidad, "Mercados". */
  markets: string[];
};

/** Meta de sostenibilidad (/sostenibilidad): una pestaña por tema. Cifras de una planta mediana. */
export type SustainabilityGoalSeed = {
  id: string;
  topic: "energy" | "water" | "emissions" | "animal_welfare" | "community";
  pillar: "environment" | "animal_welfare" | "people" | "community";
  /** Unidad neutra (símbolos): "%", "m³/t", "kWh/t", "kg CO₂e/t", "h". */
  unit: string;
  baseline: number;
  baselineYear: number;
  target: number;
  targetYear: number;
  current: number;
  status: "achieved" | "on_track" | "in_progress" | "at_risk";
  sort: number;
  title: Localized;
  description: Localized;
};

/** Noticia ficticia. `slug` se deriva del título con slugify() en el seed. */
export type NewsSeed = {
  id: string;
  publishedAt: string;
  /** Archivo en public/images/news (crédito en CREDITS.md). */
  image: string;
  featured?: boolean;
  title: Localized;
  excerpt: Localized;
  /** Markdown mínimo: párrafos, "## subtítulo" y listas con "- ". */
  body: Localized;
};
