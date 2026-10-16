"use client";

import "./globals.css";
import { GLOBAL_ERROR_BRAND, globalErrorMessages as m } from "@/i18n/global-error-messages";

/**
 * Error en el layout raíz: reemplaza todo el documento, sin el proveedor de next-intl. El idioma
 * sale de la URL (/es/…, /en/…); textos en i18n/global-error-messages.ts (módulo chico: no arrastra
 * todos los mensajes al cliente).
 */

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = typeof window !== "undefined" && window.location.pathname.startsWith("/en") ? "en" : "es";
  const t = { brand: GLOBAL_ERROR_BRAND, title: m.title[locale], text: m.text[locale], retry: m.retry[locale], home: m.home[locale] };
  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col items-start justify-center bg-surface px-6 font-sans text-ink sm:px-16">
        <p className="text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">{t.brand}</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold">{t.title}</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">{t.text}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-md bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">
            {t.retry}
          </button>
          <a href={`/${locale}`} className="rounded-md px-5 py-3 font-semibold text-brand-700 ring-1 ring-brand-700 ring-inset">
            {t.home}
          </a>
        </div>
      </body>
    </html>
  );
}
