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
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/**
 * CSP estricta en modo report-only: sin 'unsafe-inline' en scripts. Next la viola en cada página
 * estática (scripts inline sin nonce), así que solo informa; documenta el objetivo si algún día
 * las páginas pasan a renderizarse con nonce.
 */
const strictCsp = csp.replace(/script-src [^;]+/, "script-src 'self'");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  ...(isDev ? [] : [{ key: "Content-Security-Policy-Report-Only", value: strictCsp }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
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
