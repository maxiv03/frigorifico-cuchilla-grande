import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { IconMail, IconMapPin, IconWhatsApp } from "@/components/icons";
import { Container } from "@/components/ui/container";
import { mainNav, utilityNav, visible } from "@/config/navigation";
import { company } from "@/data/company";
import { Link } from "@/i18n/navigation";
import { contactInfo, whatsappUrl } from "@/lib/contact";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const locale = await getLocale();
  const contact = contactInfo();
  const { address } = company;
  const links = visible([...mainNav, ...utilityNav]);

  return (
    <footer className="bg-night text-earth-200">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-5">
          <Logo variant="light" />
          <p className="mt-5 max-w-sm leading-relaxed">{t("about")}</p>
        </div>

        <div className="lg:col-span-4">
          <h2 className="font-sans text-sm font-semibold tracking-[0.14em] text-white uppercase">{t("contactTitle")}</h2>
          <ul className="mt-4 space-y-3">
            <li className="flex gap-3">
              <IconMapPin className="mt-0.5 shrink-0 text-earth-300" />
              <address className="not-italic">
                {address.street[locale]}
                <br />
                {address.city}, {address.department}, {address.country}
              </address>
            </li>
            <li>
              <a
                href={whatsappUrl(t("whatsappMessage"))}
                target="_blank"
                rel="noopener"
                className="flex gap-3 hover:text-white"
              >
                <IconWhatsApp className="mt-0.5 shrink-0 text-earth-300" />
                <span>
                  {contact.phoneDisplay}
                  <span className="sr-only"> {t("whatsappHint")}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="flex gap-3 hover:text-white">
                <IconMail className="mt-0.5 shrink-0 text-earth-300" />
                <span>{contact.email}</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="font-sans text-sm font-semibold tracking-[0.14em] text-white uppercase">{t("navTitle")}</h2>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/" className="hover:text-white">
                {nav("home")}
              </Link>
            </li>
            {links.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="hover:text-white">
                  {nav(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-white">{t("disclaimer")}</p>
            <p>{t("mgap", { number: company.mgapNumber })}</p>
          </div>
          <p>
            {t.rich("credit", {
              link: (chunks) => (
                <a
                  href="https://fourvexa.com"
                  className="font-semibold text-white underline decoration-earth-500 underline-offset-4 hover:decoration-white"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </Container>
      </div>
    </footer>
  );
}
