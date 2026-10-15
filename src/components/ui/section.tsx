import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import { Container } from "./container";

const tones = {
  white: "bg-surface text-ink",
  muted: "bg-surface-muted text-ink",
  night: "bg-night text-white",
  brand: "bg-brand-800 text-white",
} as const;

type SectionProps = Omit<ComponentProps<"section">, "title"> & {
  tone?: keyof typeof tones;
  /** Sin Container interno (para bloques a sangre). */
  bleed?: boolean;
};

/** Bloque vertical de la página. Alterna `white` y `muted` para separar secciones. */
export function Section({ tone = "white", bleed, className, children, ...props }: SectionProps) {
  return (
    <section className={cn(tones[tone], "py-section lg:py-section-lg", className)} {...props}>
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  align?: "left" | "center";
  invert?: boolean;
  className?: string;
};

/** Encabezado estándar de sección: antetítulo, título serif y bajada. */
export function SectionHeader({ eyebrow, title, lead, id, align = "left", invert, className }: SectionHeaderProps) {
  return (
    <header className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "text-sm font-semibold tracking-[0.14em] uppercase",
            invert ? "text-earth-300" : "text-brand-700",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={cn(
          "mt-3 text-3xl leading-tight font-semibold sm:text-4xl",
          invert ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p className={cn("mt-4 text-lg leading-relaxed", invert ? "text-earth-200" : "text-ink-muted")}>{lead}</p>
      )}
    </header>
  );
}
