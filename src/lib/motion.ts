/** Desplazamiento suave salvo que la persona pida menos movimiento (prefers-reduced-motion). */
export function scrollBehavior(): ScrollBehavior {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
