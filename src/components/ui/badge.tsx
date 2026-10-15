import type { ComponentProps } from "react";
import { cn } from "./cn";

const tones = {
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  earth: "bg-earth-100 text-earth-800 ring-earth-300",
  neutral: "bg-surface-muted text-ink-muted ring-line",
  light: "bg-white/10 text-white ring-white/30",
} as const;

/** Etiqueta chica (categorías, estados, "ficticio"). */
export function Badge({ tone = "brand", className, ...props }: ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
