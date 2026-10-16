import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Todo menos API, internos de Next/Vercel, archivos con extensión y las imágenes OG/Twitter
  // (Next las publica con la ruta interna, p. ej. /es/news/opengraph-image: sin el proxy no se
  // confunden con un slug ni se redirigen a la ruta traducida).
  matcher: "/((?!api|_next|_vercel|.*\\..*|.*/opengraph-image|.*/twitter-image).*)",
};
