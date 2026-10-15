/** Tipos y claves neutras del catálogo (iguales en todos los idiomas y en la URL). */
export const SPECIES = ["beef", "lamb"] as const;
export type Species = (typeof SPECIES)[number];

export const PRESENTATIONS = ["chilled", "frozen"] as const;
export type Presentation = (typeof PRESENTATIONS)[number];

export const BONES = ["bone_in", "boneless"] as const;
export type Bone = (typeof BONES)[number];
