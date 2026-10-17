import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP aplicada: sin orígenes externos (fuentes autohospedadas, imágenes propias, el navegador
 * nunca habla con Supabase). Requiere 'unsafe-inline' en scripts porque Next inyecta scripts
 * inline (arranque y payload RSC) en páginas ESTÁTICAS: la alternativa con nonce obliga a
 * renderizar cada página por pedido (sin prerender, sin caché de CDN ni PPR).
 * 'unsafe-eval' solo en desarrollo (React lo usa para depurar).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  // Solo fourvexa.com la puede mostrar en un iframe ("Probalo vos" del portfolio). Reemplaza a
  // X-Frame-Options, que no admite una lista de orígenes permitidos.
  "frame-ancestors 'self' https://fourvexa.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/**
 * CSP estricta (sin 'unsafe-inline' en scripts) en modo report-only, solo con
 * CSP_STRICT_REPORT_ONLY=true. Next la viola en cada página estática (scripts inline sin nonce):
 * Chrome registra un error de consola y un aviso en DevTools por cada script, lo que baja
 * "Buenas prácticas" de Lighthouse a 92. Sirve para auditar; en producción queda apagada.
 * (Sin upgrade-insecure-requests: no aplica en report-only y también genera un aviso.)
 */
const strictCsp = csp.replace(/script-src [^;]+/, "script-src 'self'").replace("; upgrade-insecure-requests", "");
const reportOnly = process.env.CSP_STRICT_REPORT_ONLY === "true";

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  ...(reportOnly ? [{ key: "Content-Security-Policy-Report-Only", value: strictCsp }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // SITE_INDEXABLE=false (por defecto): también las respuestas que no son HTML (OG, sitemap).
  ...(process.env.SITE_INDEXABLE === "true" ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Las imágenes OG (next/og) se generan por pedido y leen fuentes y fotos del repo.
  outputFileTracingIncludes: {
    "/[locale]/**": ["./src/lib/og/fonts/**", "./public/images/news/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
