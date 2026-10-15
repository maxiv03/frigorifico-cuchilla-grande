import { notFound } from "next/navigation";

// Cualquier ruta desconocida bajo /[locale] muestra el not-found localizado.
export default function CatchAllPage() {
  notFound();
}
