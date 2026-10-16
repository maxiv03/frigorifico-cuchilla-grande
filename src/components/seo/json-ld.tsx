import { getTranslations } from "next-intl/server";
import { company } from "@/data/company";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { contactInfo } from "@/lib/contact";
import { absoluteUrl } from "@/lib/site";

type Json = Record<string, unknown>;

/** Bloque JSON-LD. Escapa "<" para que ningún texto pueda cerrar el <script>. */
export function JsonLd({ data }: { data: Json }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }} />;
}

const orgId = () => `${absoluteUrl("/")}#organization`;

/** Organization (layout): datos de company.ts; teléfono y mail desde env. Empresa ficticia. */
export async function OrganizationJsonLd({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Meta" });
  const { email, phoneE164 } = contactInfo();
  const { address } = company;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": orgId(),
        name: company.name,
        legalName: company.legalName,
        description: t("description"),
        url: absoluteUrl(getPathname({ locale, href: "/" })),
        logo: absoluteUrl("/icons/icon-512.png"),
        foundingDate: String(company.founded),
        numberOfEmployees: { "@type": "QuantitativeValue", value: company.figures.employees },
        address: {
          "@type": "PostalAddress",
          streetAddress: address.street[locale],
          addressLocality: address.city,
          addressRegion: address.department,
          addressCountry: "UY",
        },
        contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email, telephone: phoneE164, availableLanguage: ["es", "en"] }],
      }}
    />
  );
}

/** BreadcrumbList a partir de [nombre, ruta] (rutas relativas, se vuelven absolutas). */
export function BreadcrumbJsonLd({ items }: { items: [name: string, path: string][] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
      }}
    />
  );
}

/** NewsArticle de una noticia. Autor y editor: la organización (ficticia). */
export function NewsArticleJsonLd({
  locale,
  url,
  headline,
  description,
  datePublished,
  image,
}: {
  locale: Locale;
  url: string;
  headline: string;
  description: string;
  datePublished: string;
  image: string | null;
}) {
  const org = { "@type": "Organization", "@id": orgId(), name: company.name, url: absoluteUrl("/"), logo: absoluteUrl("/icons/icon-512.png") };
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(url) },
        url: absoluteUrl(url),
        headline,
        description,
        inLanguage: locale,
        datePublished,
        dateModified: datePublished,
        ...(image ? { image: [absoluteUrl(image)] } : {}),
        author: org,
        publisher: org,
      }}
    />
  );
}
