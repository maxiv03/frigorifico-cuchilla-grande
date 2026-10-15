import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Todo menos API, internos de Next/Vercel y archivos con extensión.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
