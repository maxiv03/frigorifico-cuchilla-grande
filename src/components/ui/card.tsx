import type { ComponentProps } from "react";
import { cn } from "./cn";

/** Superficie blanca con borde suave y sombra de tarjeta. */
export function Card({ className, ...props }: ComponentProps<"article">) {
  return (
    <article
      className={cn("flex flex-col overflow-hidden rounded-lg bg-surface shadow-card ring-1 ring-line", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-1 flex-col p-6 sm:p-8", className)} {...props} />;
}
