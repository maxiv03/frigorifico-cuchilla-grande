import type { MarketSeed } from "./types";

/**
 * Mercados de destino. Participaciones ficticias (suman menos de 100: el resto son
 * destinos menores). El volumen se calcula sobre company.figures.exportTonnesPerYear.
 */
export const markets: MarketSeed[] = [
  {
    id: "cn",
    lat: 35.86,
    lng: 104.19,
    sharePct: 36,
    sort: 1,
    name: { es: "China", en: "China" },
    description: {
      es: "Primer destino en volumen: cortes congelados del cuarto delantero y piezas para procesamiento, con y sin hueso.",
      en: "Largest destination by volume: frozen forequarter cuts and processing pieces, bone-in and boneless.",
    },
  },
  {
    id: "eu",
    lat: 50.11,
    lng: 8.68,
    sharePct: 17,
    sort: 2,
    name: { es: "Unión Europea", en: "European Union" },
    description: {
      es: "Cortes enfriados del cuarto trasero de novillos terminados a pasto, en buena parte dentro de la cuota Hilton.",
      en: "Chilled hindquarter cuts from grass-finished steers, largely shipped under the Hilton quota.",
    },
  },
  {
    id: "us",
    lat: 39.83,
    lng: -98.58,
    sharePct: 14,
    sort: 3,
    name: { es: "Estados Unidos", en: "United States" },
    description: {
      es: "Cortes del cuarto trasero enfriados y congelados, y carne magra para la industria.",
      en: "Chilled and frozen hindquarter cuts, plus lean beef for further processing.",
    },
  },
  {
    id: "il",
    lat: 31.05,
    lng: 34.85,
    sharePct: 8,
    sort: 4,
    name: { es: "Israel", en: "Israel" },
    description: {
      es: "Cortes del cuarto delantero con faena y certificación kosher, enfriados y congelados.",
      en: "Kosher-certified forequarter cuts, chilled and frozen.",
    },
  },
  {
    id: "br",
    lat: -14.24,
    lng: -51.93,
    sharePct: 5,
    sort: 5,
    name: { es: "Brasil", en: "Brazil" },
    description: {
      es: "Tapa de cuadril, cortes para parrilla y cordero, por camión y en contenedor.",
      en: "Rump cap, grilling cuts and lamb, shipped by truck and in containers.",
    },
  },
  {
    id: "uk",
    lat: 52.36,
    lng: -1.17,
    sharePct: 5,
    sort: 6,
    name: { es: "Reino Unido", en: "United Kingdom" },
    description: {
      es: "Cortes premium vacunos y ovinos enfriados para retail y gastronomía.",
      en: "Premium chilled beef and lamb cuts for retail and food service.",
    },
  },
  {
    id: "ca",
    lat: 56.13,
    lng: -106.35,
    sharePct: 4,
    sort: 7,
    name: { es: "Canadá", en: "Canada" },
    description: {
      es: "Bife angosto, lomo y cortes de cordero, enfriados y congelados.",
      en: "Striploin, tenderloin and lamb cuts, chilled and frozen.",
    },
  },
  {
    id: "me",
    lat: 24.47,
    lng: 47.5,
    sharePct: 4,
    sort: 8,
    name: { es: "Medio Oriente", en: "Middle East" },
    description: {
      es: "Arabia Saudita, Emiratos Árabes Unidos, Jordania y Kuwait: sobre todo cordero y carne ovina con certificación Halal, y cortes vacunos del cuarto delantero.",
      en: "Saudi Arabia, the United Arab Emirates, Jordan and Kuwait: mainly Halal-certified lamb and mutton, plus beef forequarter cuts.",
    },
  },
  {
    id: "jp",
    lat: 36.2,
    lng: 138.25,
    sharePct: 3,
    sort: 9,
    name: { es: "Japón", en: "Japan" },
    description: {
      es: "Entrañas, asado y cortes del cuarto delantero con especificaciones de corte a medida.",
      en: "Skirts, rib plate and forequarter cuts prepared to customer specifications.",
    },
  },
];
