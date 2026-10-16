import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense, type ComponentProps } from "react";
import { ContactTabs } from "@/components/contact/contact-tabs";
import type { CutOption } from "@/components/contact/cut-picker";
import { LocationMap } from "@/components/contact/location-map";
import { IconArrowRight, IconClock, IconMail, IconMapPin, IconWhatsApp } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/ui/section";
import { company } from "@/data/company";
import { Link } from "@/i18n/navigation";
import { contactInfo, mailtoUrl, whatsappUrl } from "@/lib/contact";
import { getCatalog } from "@/lib/data/catalog";
import { isContactTab } from "@/lib/forms/contact-rules";
import { staticPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Contact");
  return staticPageMetadata(locale, "/contact", t("metaTitle"), t("metaDescription"));
}

type TabsProps = ComponentProps<typeof ContactTabs>;

/**
 * Contacto: pedido de cotización y consulta de productores en pestañas (?tab=quote|producer) y
 * precarga del corte (?cut=beef_tenderloin, id neutro igual en todos los idiomas). Como el
 * catálogo: el shell estático trae las pestañas sin parámetros (fallback) y el límite dinámico
 * aplica los de cada URL.
 */
export default async function ContactPage({ searchParams }: PageProps<"/[locale]/contact">) {
  const locale = await getLocale();
  const t = await getTranslations("Contact");
  const tp = await getTranslations("Products");
  const catalog = await getCatalog(locale);
  const contact = contactInfo();
  const { address } = company;

  const cuts: CutOption[] = catalog.cuts.map((c) => ({ id: c.id, species: c.species, name: c.name, alias: c.alias }));
  const props: Omit<TabsProps, "initialTab" | "initialCuts"> = {
    cuts,
    speciesLabels: { beef: tp("species.beef"), lamb: tp("species.lamb") },
    quoteIntro: <p className="mb-6 max-w-3xl leading-relaxed text-ink-muted">{t("quote.intro")}</p>,
    producerIntro: (
      <div className="mb-6 flex flex-col gap-4 rounded-lg bg-earth-50 p-5 ring-1 ring-earth-200 sm:flex-row sm:items-center sm:justify-between" data-offer-link>
        <p className="text-ink">{t("producer.offerText")}</p>
        <Link
          href={{ pathname: "/producers", hash: "offer" }}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-earth-800 underline-offset-4 hover:underline"
        >
          {t("producer.offerLink")}
          <IconArrowRight width={18} height={18} />
        </Link>
      </div>
    ),
  };

  return (
    <>
      <Section tone="muted" className="lg:pt-16 lg:pb-14">
        <SectionHeader eyebrow={t("eyebrow")} as="h1" title={t("title")} lead={t("lead")} />
      </Section>
      <Section className="lg:pt-14">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-8">
            <Suspense fallback={<ContactTabs initialTab="quote" initialCuts={[]} {...props} />}>
              <ContactFromUrl searchParams={searchParams} known={new Set(cuts.map((c) => c.id))} {...props} />
            </Suspense>
          </div>

          <aside aria-labelledby="contact-aside" className="space-y-6 lg:col-span-4">
            <h2 id="contact-aside" className="sr-only">
              {t("aside.title")}
            </h2>
            <div className="rounded-lg bg-surface-muted p-6 ring-1 ring-line">
              <h3 className="font-sans text-lg font-semibold text-ink">{t("aside.plant")}</h3>
              <div className="mt-3 flex gap-3">
                <IconMapPin className="mt-0.5 shrink-0 text-brand-700" />
                <address className="not-italic">
                  {company.legalName}
                  <br />
                  {address.street[locale]}
                  <br />
                  {address.city}, {address.department}, {address.country}
                </address>
              </div>
              <div className="mt-5">
                <LocationMap />
              </div>
            </div>

            <div className="rounded-lg bg-surface-muted p-6 ring-1 ring-line">
              <h3 className="font-sans text-lg font-semibold text-ink">{t("aside.team")}</h3>
              <ul className="mt-3 space-y-3">
                <li>
                  <a href={whatsappUrl(t("aside.whatsappMessage"))} target="_blank" rel="noopener" className="flex gap-3 hover:text-brand-700">
                    <IconWhatsApp className="mt-0.5 shrink-0 text-brand-700" />
                    <span>
                      {contact.phoneDisplay}
                      <span className="block text-sm text-ink-muted">{t("aside.whatsapp")}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a href={mailtoUrl(t("aside.mailSubject"))} className="flex gap-3 hover:text-brand-700">
                    <IconMail className="mt-0.5 shrink-0 text-brand-700" />
                    <span className="min-w-0">
                      <span className="break-all">{contact.email}</span>
                      <span className="block text-sm text-ink-muted">{t("aside.mail")}</span>
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-surface-muted p-6 ring-1 ring-line" data-hours>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
                  <IconClock className="text-brand-700" />
                  {t("aside.hours.title")}
                </h3>
                <Badge tone="neutral">{t("aside.hours.fictitious")}</Badge>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {(["office", "livestock", "dispatch"] as const).map((k) => (
                  <div key={k}>
                    <dt className="font-semibold text-ink">{t(`aside.hours.${k}.label`)}</dt>
                    <dd className="text-ink-muted">{t(`aside.hours.${k}.value`)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

/** Espera los searchParams (render por request): pestaña y cortes precargados válidos. */
async function ContactFromUrl({
  searchParams,
  known,
  ...props
}: Omit<TabsProps, "initialTab" | "initialCuts"> & { searchParams: Promise<Record<string, string | string[] | undefined>>; known: Set<string> }) {
  const sp = await searchParams;
  const tab = isContactTab(sp.tab) ? sp.tab : "quote";
  const raw = sp.cut;
  const initialCuts = [...new Set((Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((v) => v.split(",")))].filter((id) => known.has(id));
  return <ContactTabs initialTab={tab} initialCuts={initialCuts} {...props} />;
}
