"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Isotype } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";

/** Error inesperado dentro de una página: mensaje localizado, reintentar y volver al inicio. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Error");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container className="flex flex-1 flex-col items-start justify-center py-24 sm:py-32">
      <Isotype className="size-14 text-brand-700" />
      <h1 className="mt-8 text-4xl font-semibold text-ink sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-muted">{t("text")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={buttonClasses({})}>
          {t("retry")}
        </button>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>
          {t("home")}
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-sm text-ink-muted">{t("digest", { digest: error.digest })}</p>}
    </Container>
  );
}
