import { cn } from "@/components/ui/cn";

/**
 * Badge genérico propio de una certificación (nunca el logo oficial de la entidad):
 * sello circular con borde dentado y un pictograma neutro. Decorativo: el nombre de la
 * certificación siempre va en texto al lado.
 */
export function CertBadge({ icon, className }: { icon: string; className?: string }) {
  // Borde dentado: 24 puntas alrededor del centro (32, 32).
  const teeth = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r = i % 2 === 0 ? 30 : 27.5;
    return `${(32 + r * Math.cos(a)).toFixed(2)} ${(32 + r * Math.sin(a)).toFixed(2)}`;
  }).join("L");

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={cn("size-16 shrink-0", className)}>
      <path d={`M${teeth}Z`} className="fill-brand-700" />
      <circle cx="32" cy="32" r="23" className="fill-earth-50" />
      <circle cx="32" cy="32" r="20" fill="none" strokeWidth="1.2" strokeDasharray="2 2.4" className="stroke-brand-700" />
      <g
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-brand-800"
        transform="translate(20 20)"
      >
        {glyphs[icon] ?? glyphs.shield}
      </g>
    </svg>
  );
}

/** Pictogramas de 24×24 (se dibujan dentro del sello). */
const glyphs: Record<string, React.ReactNode> = {
  crescent: <path d="M15.5 3.5a9 9 0 1 0 5 15.6A7.5 7.5 0 1 1 15.5 3.5z" />,
  star: <path d="M12 2.5l8.2 14.2H3.8zM12 21.5L3.8 7.3h16.4z" />,
  shield: (
    <>
      <path d="M12 2.5l8 3.2v5.8c0 4.7-3.3 8.6-8 10-4.7-1.4-8-5.3-8-10V5.7z" />
      <path d="M8.3 12l2.6 2.6 4.8-5.2" />
    </>
  ),
  rosette: (
    <>
      <circle cx="12" cy="9.5" r="6.5" />
      <path d="M8.5 15l-1.8 7 5.3-2.6 5.3 2.6-1.8-7M9.4 9.6l1.8 1.8 3.4-3.6" />
    </>
  ),
  stamp: (
    <>
      <path d="M9 3.5h6v5l2.5 3.5h-11L9 8.5z" />
      <path d="M4.5 15h15v3.5h-15zM7 21.5h10" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.7 3.8 5.7 3.8 9s-1.2 6.3-3.8 9c-2.6-2.7-3.8-5.7-3.8-9S9.4 5.7 12 3z" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21.5V3" />
      <path d="M5.5 4h12l-2.6 4.2 2.6 4.3h-12" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11.5-6.5 11.5z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
};
