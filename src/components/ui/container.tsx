import type { ComponentProps } from "react";
import { cn } from "./cn";

/** Ancho máximo del sitio con gutter de 16 px en móvil. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
