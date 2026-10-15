import type { Presentation, Species } from "@/lib/catalog/types";

/**
 * Datos generales por presentación (no por corte). Referenciales, para orientar al
 * comprador; cada pedido se ajusta a la ficha técnica del cliente.
 */
export const presentationSpecs: Record<
  Presentation,
  { tempMin: number; tempMax: number | null; shelfLife: { unit: "day" | "month"; value: Record<Species, number> }; boxKg: [number, number] }
> = {
  chilled: { tempMin: -1, tempMax: 2, shelfLife: { unit: "day", value: { beef: 120, lamb: 90 } }, boxKg: [15, 27] },
  frozen: { tempMin: -18, tempMax: null, shelfLife: { unit: "month", value: { beef: 24, lamb: 24 } }, boxKg: [20, 27] },
};
