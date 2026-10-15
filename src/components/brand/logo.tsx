import { useId } from "react";
import { company } from "@/data/company";
import { cn } from "@/components/ui/cn";

/*
 * Isotipo: una "C" abierta cortada por dos tajos paralelos (−10°) → tres trazos,
 * como el corte de una cuchilla. Geometría en un lienzo de 48×48.
 * Versiones en archivo: public/brand/isotipo-{color,mono,blanco}.svg
 */
const ARC = "M35.82 33.23A15 15 0 1 1 35.82 14.77";
const CUTS = ["M-0.54 18.13L17.19 15.01", "M-0.54 34.03L17.19 30.91"];

type IsotypeProps = { className?: string; title?: string };

/** Isotipo en `currentColor` (color = text-brand-700, mono = text-ink, blanco = text-white). */
export function Isotype({ className, title }: IsotypeProps) {
  const maskId = useId();
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="#fff" />
          {CUTS.map((d) => (
            <path key={d} d={d} stroke="#000" strokeWidth="2.4" />
          ))}
        </mask>
      </defs>
      <path d={ARC} fill="none" stroke="currentColor" strokeWidth="7" mask={`url(#${maskId})`} />
    </svg>
  );
}

type LogoProps = {
  /** color: isotipo bordó + texto oscuro · mono: todo en tinta · light: todo blanco (fondos oscuros) */
  variant?: "color" | "mono" | "light";
  className?: string;
};

/** Logotipo completo: isotipo + "Frigorífico / Cuchilla Grande". */
export function Logo({ variant = "color", className }: LogoProps) {
  const isoColor = { color: "text-brand-700", mono: "text-ink", light: "text-white" }[variant];
  const kickerColor = { color: "text-ink-muted", mono: "text-ink-muted", light: "text-earth-200" }[variant];
  const nameColor = { color: "text-ink", mono: "text-ink", light: "text-white" }[variant];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Isotype className={cn("size-10 shrink-0", isoColor)} />
      <span className="flex flex-col leading-none">
        <span className={cn("text-[0.68rem] font-semibold tracking-[0.22em] uppercase", kickerColor)}>
          {company.brand.kicker}
        </span>
        <span className={cn("mt-1 font-serif text-xl font-semibold tracking-tight", nameColor)}>
          {company.brand.name}
        </span>
      </span>
    </span>
  );
}
