"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/brand/logo";
import { IconClose, IconMenu } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import { Link, usePathname } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";

export type MenuLink = { key: string; href: StaticPathname; label: string; highlight?: boolean };

type Props = {
  main: MenuLink[];
  utility: MenuLink[];
  /** Selector de idioma y datos de contacto (renderizados en el servidor). */
  footer: ReactNode;
};

/**
 * Menú móvil: botón con aria-expanded/aria-controls y panel modal.
 * Foco atrapado dentro del panel, Escape cierra y devuelve el foco al botón,
 * se cierra al navegar y bloquea el scroll del fondo.
 * El panel se monta en <body> con un portal: el header sticky usa backdrop-filter,
 * que convierte al header en el contenedor de los `position: fixed` descendientes.
 */
export function MobileMenu({ main, utility, footer }: Props) {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Cerrar al cambiar de ruta (sin devolver foco: la página nueva lo maneja).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      panel ? [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')] : [];
    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-surface-muted"
      >
        <IconMenu width={24} height={24} />
        <span className="sr-only">{t("openMenu")}</span>
      </button>

      {open &&
        createPortal(
      <div
        id={panelId}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        className="fixed inset-0 z-50 flex flex-col bg-surface"
      >
        <div className="flex h-header shrink-0 items-center justify-between border-b border-line px-4">
          <Logo />
          <button
            type="button"
            onClick={close}
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-surface-muted"
          >
            <IconClose width={24} height={24} />
            <span className="sr-only">{t("closeMenu")}</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
          {main.length > 0 && (
            <nav aria-label={t("mainNav")}>
              <ul className="divide-y divide-line">
                {main.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-11 items-center justify-between py-2 font-serif text-xl",
                        item.highlight ? "text-earth-700" : "text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {utility.length > 0 && (
            <nav aria-label={t("utilityNav")} className="mt-3">
              <ul className="flex flex-wrap gap-x-5">
                {utility.map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className="block py-2 text-base text-ink-muted hover:text-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className={cn(main.length + utility.length > 0 && "mt-3 border-t border-line pt-4")}>{footer}</div>
        </div>
      </div>,
          document.body,
        )}
    </div>
  );
}
