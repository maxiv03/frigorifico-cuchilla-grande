import type { CertificationSeed } from "./types";

/**
 * Certificaciones y habilitaciones (ficticias para esta empresa, sin números de certificado).
 * En el sitio se muestran con badges genéricos propios, nunca con logos oficiales.
 * `markets` alimenta market_certifications: mercados donde la exigen o la piden los clientes.
 */
export const certifications: CertificationSeed[] = [
  {
    id: "haccp",
    icon: "shield",
    sort: 1,
    name: { es: "HACCP", en: "HACCP" },
    summary: {
      es: "Sistema de análisis de peligros y puntos críticos de control, auditado por la autoridad sanitaria oficial. Es la base de inocuidad que exigen todos los destinos.",
      en: "Hazard analysis and critical control point system, audited by the official health authority. It is the food safety baseline required by every destination.",
    },
    markets: ["cn", "eu", "us", "il", "br", "uk", "ca", "jp"],
  },
  {
    id: "eu",
    icon: "globe",
    sort: 2,
    name: { es: "Habilitación Unión Europea", en: "European Union approval" },
    summary: {
      es: "Planta incluida en la lista de establecimientos habilitados para exportar a la Unión Europea, con trazabilidad individual y cortes elegibles para la cuota Hilton.",
      en: "Plant listed among establishments approved to export to the European Union, with individual traceability and cuts eligible for the Hilton quota.",
    },
    markets: ["eu", "uk"],
  },
  {
    id: "usda",
    icon: "stamp",
    sort: 3,
    name: { es: "Habilitación USDA", en: "USDA approval" },
    summary: {
      es: "Habilitación para exportar a Estados Unidos bajo el sistema de inspección uruguayo, reconocido como equivalente por el Departamento de Agricultura de ese país.",
      en: "Approval to export to the United States under Uruguay's inspection system, recognised as equivalent by the U.S. Department of Agriculture.",
    },
    markets: ["us"],
  },
  {
    id: "brcgs",
    icon: "rosette",
    sort: 4,
    name: { es: "BRCGS", en: "BRCGS" },
    summary: {
      es: "Certificación de inocuidad bajo la norma global BRCGS, con auditoría externa anual. La piden las cadenas de supermercados del Reino Unido y de Europa.",
      en: "Food safety certification under the BRCGS global standard, with an annual external audit. Requested by supermarket chains in the United Kingdom and Europe.",
    },
    markets: ["uk", "eu"],
  },
  {
    id: "halal",
    icon: "crescent",
    sort: 5,
    name: { es: "Halal", en: "Halal" },
    summary: {
      es: "Faena y manejo según el rito islámico, con supervisión de una entidad certificadora reconocida. La piden importadores de Medio Oriente y del Sudeste Asiático, y clientes en Europa y Canadá.",
      en: "Slaughter and handling according to Islamic rites, supervised by a recognised certification body. Requested by importers in the Middle East and Southeast Asia, and by customers in Europe and Canada.",
    },
    markets: ["eu", "uk", "ca"],
  },
  {
    id: "kosher",
    icon: "star",
    sort: 6,
    name: { es: "Kosher", en: "Kosher" },
    summary: {
      es: "Línea de producción bajo supervisión rabínica permanente durante las campañas, con cortes del cuarto delantero. Requisito para Israel y para parte del mercado de Estados Unidos.",
      en: "Production line under permanent rabbinical supervision during each run, focused on forequarter cuts. Required for Israel and for part of the U.S. market.",
    },
    markets: ["il", "us"],
  },
];
