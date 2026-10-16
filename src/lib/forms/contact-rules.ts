/**
 * Reglas de los formularios de contacto (fase 5), compartidas por los formularios (cliente) y sus
 * Server Actions. Valores neutros: iguales en todos los idiomas y en la base.
 */
export const PRESENTATIONS = ["chilled", "frozen", "both"] as const;
export const VOLUME_UNITS = ["tonnes_month", "containers_month"] as const;
export const INCOTERMS = ["FOB", "CFR", "CIF"] as const;
export const PRODUCER_REASONS = ["sell", "settlement", "other"] as const;

export type VolumeUnit = (typeof VOLUME_UNITS)[number];

/** Volumen estimado por mes, según la unidad (enteros). */
export const VOLUME_LIMITS = {
  tonnes_month: { min: 1, max: 2000 },
  containers_month: { min: 1, max: 100 },
} as const satisfies Record<VolumeUnit, { min: number; max: number }>;

/** Cortes por pedido (igual que el check de la base). */
export const MAX_CUTS = 20;

/** Pestañas de /contacto (?tab=quote|producer). */
export const CONTACT_TABS = ["quote", "producer"] as const;
export type ContactTab = (typeof CONTACT_TABS)[number];
export const isContactTab = (v: unknown): v is ContactTab => typeof v === "string" && (CONTACT_TABS as readonly string[]).includes(v);
