import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { AlternatesProvider } from "@/components/i18n/alternates";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";
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
  return {
    title: { default: t("siteName"), template: `%s · ${t("siteName")}` },
    description: t("description"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  };
}

export const viewport: Viewport = { themeColor: "#7a1f2b" };

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
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
