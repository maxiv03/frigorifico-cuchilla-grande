import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Section, SectionHeader } from "@/components/ui/section";
import { contactInfo } from "@/lib/contact";
import { staticPageMetadata } from "@/lib/metadata";

/** Secciones de la política (mismo orden en todos los idiomas). */
const SECTIONS = ["demo", "what", "why", "where", "retention", "rights", "cookies"] as const;
/** Datos que guarda cada envío (lista en "Qué guardamos"). */
const STORED = ["fields", "technical", "ip"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Privacy");
  return staticPageMetadata(locale, "/privacy", t("metaTitle"), t("metaDescription"));
}

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");
  const { email } = contactInfo();
  const mail = (chunks: React.ReactNode) => (
    <a href={`mailto:${email}`} className="font-semibold text-brand-700 underline underline-offset-2">
      {chunks}
    </a>
  );

  return (
    <>
      <Section tone="muted" className="lg:pt-16 lg:pb-16">
        <SectionHeader eyebrow={t("eyebrow")} as="h1" title={t("title")} lead={t("lead")} />
        <p className="mt-4 text-sm text-ink-muted">{t("updated")}</p>
      </Section>
      <Section>
        <div className="max-w-3xl space-y-10">
          {SECTIONS.map((key) => (
            <section key={key} aria-labelledby={`privacy-${key}`}>
              <h2 id={`privacy-${key}`} className="text-2xl font-semibold text-ink">
                {t(`sections.${key}.title`)}
              </h2>
              <p className="mt-3 leading-relaxed text-ink-muted">{t.rich(`sections.${key}.text`, { mail, email })}</p>
              {key === "what" && (
                <ul className="mt-3 list-disc space-y-1.5 pl-6 text-ink-muted marker:text-earth-500">
                  {STORED.map((item) => (
                    <li key={item}>{t(`sections.what.items.${item}`)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
