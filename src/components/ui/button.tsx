import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "./cn";

const variants = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-sm",
  secondary: "bg-surface text-brand-800 ring-1 ring-inset ring-brand-200 hover:bg-brand-50",
  earth: "bg-earth-700 text-white hover:bg-earth-800 shadow-sm",
  /** Para usar sobre fotos u fondos oscuros. */
  outlineLight: "text-white ring-1 ring-inset ring-white/70 hover:bg-white/10",
  ghost: "text-brand-700 hover:bg-brand-50",
} as const;

const sizes = {
  md: "h-11 px-5 text-base",
  lg: "h-13 px-7 text-lg",
} as const;

type Style = { variant?: keyof typeof variants; size?: keyof typeof sizes; icon?: ReactNode };

export function buttonClasses({ variant = "primary", size = "md" }: Style = {}, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
    variants[variant],
    sizes[size],
    className,
  );
}

/** Botón real (acciones). */
export function Button({ variant, size, icon, className, children, ...props }: ComponentProps<"button"> & Style) {
  return (
    <button className={buttonClasses({ variant, size }, className)} {...props}>
      {children}
      {icon}
    </button>
  );
}

/** Link con aspecto de botón a una ruta interna traducida (next-intl). */
export function ButtonLink({ variant, size, icon, className, children, ...props }: ComponentProps<typeof Link> & Style) {
  return (
    <Link className={buttonClasses({ variant, size }, className)} {...props}>
      {children}
      {icon}
    </Link>
  );
}

/** Link con aspecto de botón a anclas, mailto:, WhatsApp u otros destinos externos. */
export function ButtonAnchor({ variant, size, icon, className, children, href, ...props }: ComponentProps<"a"> & Style) {
  const classes = buttonClasses({ variant, size }, className);
  if (href?.startsWith("#")) {
    return (
      <NextLink href={href} className={classes} {...props}>
        {children}
        {icon}
      </NextLink>
    );
  }
  return (
    <a href={href} className={classes} {...props}>
      {children}
      {icon}
    </a>
  );
}
