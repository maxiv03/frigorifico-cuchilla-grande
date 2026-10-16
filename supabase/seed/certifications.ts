import type { CertificationSeed } from "./types";

/**
 * Certificaciones y habilitaciones sanitarias por mercado (ficticias para esta empresa, sin
 * números de certificado). En el sitio se muestran con badges genéricos propios, nunca con
 * logos oficiales. `markets` alimenta market_certifications (en /calidad: "Mercados"; en
 * /mercados: lo que requiere cada destino).
 */
export const certifications: CertificationSeed[] = [
  // ─── Certificaciones ───────────────────────────────────────────────────────
  {
    id: "haccp",
    kind: "certification",
    icon: "shield",
    sort: 1,
    name: { es: "HACCP", en: "HACCP" },
    summary: {
      es: "Sistema de análisis de peligros y puntos críticos de control, auditado por la autoridad sanitaria oficial. Es la base de inocuidad que exigen todos los destinos.",
      en: "Hazard analysis and critical control point system, audited by the official health authority. It is the food safety baseline required by every destination.",
    },
    markets: ["cn", "eu", "us", "il", "br", "uk", "ca", "me", "jp"],
  },
  {
    id: "brcgs",
    kind: "certification",
    icon: "rosette",
    sort: 2,
    name: { es: "BRCGS", en: "BRCGS" },
    summary: {
      es: "Certificación de inocuidad bajo la norma global BRCGS, con auditoría externa anual. La piden las cadenas de supermercados del Reino Unido y de Europa.",
      en: "Food safety certification under the BRCGS global standard, with an annual external audit. Requested by supermarket chains in the United Kingdom and Europe.",
    },
    markets: ["uk", "eu"],
  },
  {
    id: "halal",
    kind: "certification",
    icon: "crescent",
    sort: 3,
    name: { es: "Halal", en: "Halal" },
    summary: {
      es: "Faena y manejo según el rito islámico, con supervisión de una entidad certificadora reconocida. Requisito para Medio Oriente, sobre todo en carne ovina, y pedido por clientes de Europa, el Reino Unido y Canadá.",
      en: "Slaughter and handling according to Islamic rites, supervised by a recognised certification body. Required for the Middle East, mainly for lamb and mutton, and requested by customers in Europe, the United Kingdom and Canada.",
    },
    markets: ["me", "eu", "uk", "ca"],
  },
  {
    id: "kosher",
    kind: "certification",
    icon: "star",
    sort: 4,
    name: { es: "Kosher", en: "Kosher" },
    summary: {
      es: "Línea de producción bajo supervisión rabínica permanente durante las campañas, con cortes del cuarto delantero. Requisito para Israel y para parte del mercado de Estados Unidos.",
      en: "Production line under permanent rabbinical supervision during each run, focused on forequarter cuts. Required for Israel and for part of the US market.",
    },
    markets: ["il", "us"],
  },
  // ─── Habilitaciones sanitarias por mercado ─────────────────────────────────
  {
    id: "eu",
    kind: "approval",
    icon: "globe",
    sort: 5,
    name: { es: "Habilitación Unión Europea", en: "European Union approval" },
    summary: {
      es: "Planta incluida desde 1997 en la lista de establecimientos habilitados para exportar a la Unión Europea, con trazabilidad individual y cortes elegibles para la cuota Hilton.",
      en: "Plant listed since 1997 among establishments approved to export to the European Union, with individual traceability and cuts eligible for the Hilton quota.",
    },
    markets: ["eu"],
  },
  {
    id: "uk",
    kind: "approval",
    icon: "flag",
    sort: 6,
    name: { es: "Habilitación Reino Unido", en: "United Kingdom approval" },
    summary: {
      es: "Habilitación propia para exportar carne vacuna y ovina al Reino Unido, con controles y certificados sanitarios específicos de ese mercado, separados de los de la Unión Europea.",
      en: "Separate approval to export beef and lamb to the United Kingdom, with health controls and certificates specific to that market, distinct from the European Union's.",
    },
    markets: ["uk"],
  },
  {
    id: "usda",
    kind: "approval",
    icon: "stamp",
    sort: 7,
    name: { es: "Habilitación USDA", en: "USDA approval" },
    summary: {
      es: "Habilitación para exportar a Estados Unidos bajo el sistema de inspección uruguayo, reconocido como equivalente por el Departamento de Agricultura de ese país.",
      en: "Approval to export to the United States under Uruguay's inspection system, recognised as equivalent by the US Department of Agriculture.",
    },
    markets: ["us"],
  },
  {
    id: "china",
    kind: "approval",
    icon: "pin",
    sort: 8,
    name: { es: "Habilitación China", en: "China approval" },
    summary: {
      es: "Planta registrada desde 2014 ante la autoridad aduanera china para exportar carne vacuna y ovina, enfriada y congelada, con y sin hueso.",
      en: "Plant registered since 2014 with China's customs authority to export chilled and frozen beef and lamb, bone-in and boneless.",
    },
    markets: ["cn"],
  },
];
