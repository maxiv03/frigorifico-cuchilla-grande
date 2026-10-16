/**
 * ÚNICA fuente de verdad de los datos de la empresa (ficticia).
 * Cualquier cifra que aparezca en el sitio sale de acá.
 * Teléfono/WhatsApp y mail vienen de variables de entorno (ver src/lib/contact.ts).
 */
import type { Locale } from "@/i18n/routing";

export type Localized = Record<Locale, string>;

export const company = {
  name: "Frigorífico Cuchilla Grande",
  /** Partes del logotipo (nombre propio: no se traduce). */
  brand: { kicker: "Frigorífico", name: "Cuchilla Grande" },
  legalName: "Frigorífico Cuchilla Grande S.A.",
  founded: 1968,
  foundingFamily: "Iturralde",

  /** Número ficticio: con letras para que no pueda coincidir con una planta real. */
  mgapNumber: "DEMO-000",

  address: {
    street: { es: "Ruta 6 km 212,500", en: "Route 6, km 212.5" },
    city: "Sarandí del Yí",
    department: "Durazno",
    country: "Uruguay",
    /** Ubicación aproximada en las afueras de Sarandí del Yí, sobre ruta 6 (ficticia). */
    coordinates: { lat: -33.3365, lng: -55.6492 },
  },

  figures: {
    siteHectares: 58,
    builtAreaM2: 26_000,
    cattlePerDay: 650,
    sheepPerDay: 1_800,
    cattlePerYear: 120_000,
    sheepPerYear: 190_000,
    frozenStorageTonnes: 4_200,
    blastFreezingTunnels: 9,
    employees: 1_150,
    exportTonnesPerYear: 24_000,
    exportSharePct: 88,
    countries: 35,
    solarSharePct: 30,
  },

  people: {
    ceo: {
      name: "Lucía Iturralde",
      role: { es: "Directora general", en: "Chief Executive Officer" },
      bio: {
        es: "Tercera generación de la familia fundadora; dirige la planta desde 2015.",
        en: "Third generation of the founding family; has run the plant since 2015.",
      },
    },
    commercial: {
      name: "Martín Sosa",
      role: { es: "Gerente comercial de exportación", en: "Export Sales Manager" },
      bio: {
        es: "Atiende a importadores de Europa, Asia y América, de la cotización al embarque.",
        en: "Works with importers in Europe, Asia and the Americas, from quotation to shipment.",
      },
    },
    livestockBuyers: [
      {
        name: "Andrés Píriz",
        role: { es: "Comprador de hacienda", en: "Livestock buyer" },
        /** Zona que recorre (portal de productores). */
        zone: { es: "Durazno, Florida y Tacuarembó · vacunos", en: "Durazno, Florida and Tacuarembó · cattle" },
        bio: {
          es: "Recorre establecimientos de Durazno, Florida y Tacuarembó para comprar vacunos.",
          en: "Visits farms in Durazno, Florida and Tacuarembó to buy cattle.",
        },
      },
      {
        name: "Carolina Fagúndez",
        role: { es: "Compradora de hacienda", en: "Livestock buyer" },
        zone: { es: "Flores, Soriano, Paysandú y Salto · ovinos", en: "Flores, Soriano, Paysandú and Salto · sheep" },
        bio: {
          es: "Coordina la compra de ovinos y los turnos de ingreso a planta con los productores.",
          en: "Coordinates sheep purchasing and delivery slots at the plant with producers.",
        },
      },
    ],
  },

  timeline: [
    {
      year: 1968,
      title: { es: "Fundación", en: "Founded" },
      text: {
        es: "La familia Iturralde abre un matadero local para abastecer a Sarandí del Yí y la zona.",
        en: "The Iturralde family opens a local abattoir to supply Sarandí del Yí and the surrounding area.",
      },
    },
    {
      year: 1984,
      title: { es: "Primera habilitación para exportar", en: "First export approval" },
      text: {
        es: "La planta obtiene la habilitación oficial y realiza sus primeros embarques.",
        en: "The plant obtains official approval and ships its first export orders.",
      },
    },
    {
      year: 1997,
      title: { es: "Habilitación Unión Europea", en: "European Union approval" },
      text: {
        es: "Ingreso al mercado europeo, incluidos los cortes de alta calidad de la cuota Hilton.",
        en: "Entry into the European market, including high-quality Hilton quota cuts.",
      },
    },
    {
      year: 2006,
      title: { es: "Trazabilidad individual", en: "Individual traceability" },
      text: {
        es: "Integración completa al sistema nacional de trazabilidad individual del ganado.",
        en: "Full integration with Uruguay's national individual livestock traceability system.",
      },
    },
    {
      year: 2012,
      title: { es: "Línea ovina y Halal", en: "Lamb line and Halal" },
      text: {
        es: "Se inaugura la línea de faena ovina y se certifica la producción Halal.",
        en: "The sheep processing line opens and Halal production is certified.",
      },
    },
    {
      year: 2014,
      title: { es: "Habilitación China", en: "China approval" },
      text: {
        es: "La planta queda habilitada para exportar carne vacuna y ovina a China.",
        en: "The plant is approved to export beef and lamb to China.",
      },
    },
    {
      year: 2017,
      title: { es: "Certificación BRCGS", en: "BRCGS certification" },
      text: {
        es: "Certificación del sistema de inocuidad bajo la norma global BRCGS.",
        en: "The food safety system is certified under the BRCGS global standard.",
      },
    },
    {
      year: 2019,
      title: { es: "Ampliación de frío", en: "Cold storage expansion" },
      text: {
        es: "Nuevas cámaras y túneles de congelado rápido llevan la capacidad a 4.200 toneladas.",
        en: "New cold rooms and blast freezing tunnels raise capacity to 4,200 tonnes.",
      },
    },
    {
      year: 2023,
      title: { es: "Línea Kosher", en: "Kosher line" },
      text: {
        es: "Se habilita una línea de producción Kosher bajo supervisión rabínica.",
        en: "A Kosher production line is set up under rabbinical supervision.",
      },
    },
    {
      year: 2025,
      title: { es: "Parque solar propio", en: "On-site solar park" },
      text: {
        es: "Un parque solar en el predio cubre el 30 % del consumo eléctrico de la planta.",
        en: "An on-site solar park covers 30% of the plant's electricity consumption.",
      },
    },
  ],
} as const;

export type Company = typeof company;
