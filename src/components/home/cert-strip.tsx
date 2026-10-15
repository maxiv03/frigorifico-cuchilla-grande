import { getLocale, getTranslations } from "next-intl/server";
import { IconArrowRight } from "@/components/icons";
import { CertBadge } from "@/components/quality/cert-badge";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { getInstitutional } from "@/lib/data/institutional";

/** Franja de certificaciones (badges propios) con link a Calidad. */
export async function CertStrip() {
  const locale = await getLocale();
  const t = await getTranslations("Home.certStrip");
  const { certifications } = await getInstitutional(locale);

  return (
    <section aria-labelledby="certificaciones" className="border-y border-line bg-surface-muted">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h2 id="certificaciones" className="font-sans text-sm font-semibold tracking-[0.14em] text-ink uppercase">
            {t("title")}
          </h2>
          <Link
            href="/quality"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {t("cta")}
            <IconArrowRight width={18} height={18} />
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {certifications.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <CertBadge icon={c.icon} className="size-12" />
              <span className="text-[0.95rem] leading-snug font-semibold text-ink">{c.name}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
