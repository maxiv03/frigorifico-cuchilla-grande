import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { IconMail, IconWhatsApp } from "@/components/icons";
import { Container } from "@/components/ui/container";
import { cn } from "@/components/ui/cn";
import { mainNav, utilityNav, visible } from "@/config/navigation";
import { Link } from "@/i18n/navigation";
import { contactInfo, whatsappUrl } from "@/lib/contact";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu, type MenuLink } from "./mobile-menu";

export async function SiteHeader() {
  const t = await getTranslations("Header");
  const nav = await getTranslations("Nav");
  const contact = contactInfo();

  const main: MenuLink[] = visible(mainNav).map((i) => ({ ...i, label: nav(i.key) }));
  const utility: MenuLink[] = visible(utilityNav).map((i) => ({ ...i, label: nav(i.key) }));

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-md bg-brand-700 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skip")}
      </a>

      {/* Barra superior (escritorio): secundarias + idioma */}
      <div className="hidden border-b border-line bg-surface-muted lg:block">
        <Container className="flex h-9 items-center justify-end gap-6 text-sm">
          {utility.length > 0 && (
            <nav aria-label={t("utilityNav")}>
              <ul className="flex items-center gap-5">
                {utility.map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className="text-ink-muted hover:text-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <LocaleSwitcher />
        </Container>
      </div>

      {/* Barra principal sticky */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
        <Container className="flex h-header items-center justify-between gap-6">
          <Link href="/" className="rounded-sm" aria-label={t("home")}>
            <Logo />
          </Link>

          {main.length > 0 && (
            <nav aria-label={t("mainNav")} className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {main.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-md px-3 py-2 text-[0.95rem] font-semibold transition-colors",
                        item.highlight
                          ? "ml-2 bg-earth-100 text-earth-800 ring-1 ring-earth-300 ring-inset hover:bg-earth-200"
                          : "text-ink hover:bg-surface-muted hover:text-brand-700",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="flex items-center gap-2 lg:hidden">
            <LocaleSwitcher />
            <MobileMenu
            main={main}
            utility={utility}
            footer={
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-muted">{t("language")}</span>
                  <LocaleSwitcher />
                </div>
                <div className="space-y-1 text-base">
                  <a
                    href={whatsappUrl(t("whatsappMessage"))}
                    className="flex items-center gap-3 py-1.5 text-ink hover:text-brand-700"
                    rel="noopener"
                    target="_blank"
                  >
                    <IconWhatsApp className="text-brand-700" />
                    <span>{contact.phoneDisplay}</span>
                  </a>
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-3 py-1.5 text-ink hover:text-brand-700">
                    <IconMail className="text-brand-700" />
                    <span>{contact.email}</span>
                  </a>
                </div>
              </div>
            }
            />
          </div>
        </Container>
      </header>
    </>
  );
}
