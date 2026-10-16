"use client";

import { useEffect, useRef } from "react";
import { scrollBehavior } from "@/lib/motion";

/**
 * Fila con desplazamiento horizontal (utilidad `scroll-row` de globals.css): marca con
 * `data-fade-start` / `data-fade-end` el borde que tiene más contenido, y el CSS pone ahí el
 * degradado. Se recalcula al desplazar, al cambiar el ancho y al cambiar los hijos (otra especie).
 */
export function useScrollRow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.toggleAttribute("data-fade-start", max > 1 && el.scrollLeft > 1);
      el.toggleAttribute("data-fade-end", max > 1 && el.scrollLeft < max - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const mutation = new MutationObserver(update);
    mutation.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);
  return ref;
}

/**
 * Lleva `item` a la vista dentro de la fila, solo en horizontal (scrollIntoView también movería la
 * página). Si ya se ve entero, fuera del degradado, no hace nada; si no, lo alinea al inicio
 * (después del scroll-padding, igual que el snap). Respeta prefers-reduced-motion.
 */
export function revealInRow(row: HTMLElement, item: HTMLElement, instant = false) {
  if (row.scrollWidth <= row.clientWidth) return;
  const cs = getComputedStyle(row);
  const padStart = parseFloat(cs.scrollPaddingLeft) || 0;
  const padEnd = parseFloat(cs.scrollPaddingRight) || 0;
  const r = row.getBoundingClientRect();
  const c = item.getBoundingClientRect();
  if (c.left >= r.left + padStart - 1 && c.right <= r.right - padEnd + 1) return;
  row.scrollBy({ left: c.left - (r.left + padStart), behavior: instant ? "auto" : scrollBehavior() });
}
