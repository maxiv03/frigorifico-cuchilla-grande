import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { AlternatesProvider } from "@/components/i18n/alternates";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { routing } from "@/i18n/routing";
import { siteIndexable, siteUrl } from "@/lib/site";
import "../globals.css";

// Source Serif 4 (títulos) + Source Sans 3 (texto): superfamilia de Adobe pensada para
// combinarse; serif editorial sobria y sans muy legible. Variables: un archivo por familia.
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });
const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  const indexable = siteIndexable();
  return {
    title: { default: t("siteName"), template: `%s · ${t("siteName")}` },
    description: t("description"),
    applicationName: t("siteName"),
    metadataBase: new URL(siteUrl()),
    // SITE_INDEXABLE (por defecto false): empresa ficticia, fuera de los buscadores.
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false, googleBot: { index: false, follow: false } },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = { themeColor: "#7a1f2b" };

/**
 * Namespaces que usan los componentes de cliente. Solo esos viajan al navegador (el resto se
 * resuelve en el servidor): sin esto, cada página llevaba en el HTML los mensajes de todo el sitio.
 * Si un componente de cliente nuevo usa otro namespace, agregarlo acá.
 */
const CLIENT_NAMESPACES = ["Header", "LocaleSwitcher", "Forms", "Error", "Products", "Producers", "Contact"] as const;

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]));
  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <OrganizationJsonLd locale={locale} />
        <NextIntlClientProvider messages={clientMessages}>
          <AlternatesProvider>
            <SiteHeader />
            <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
              {children}
            </main>
            <SiteFooter />
          </AlternatesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
