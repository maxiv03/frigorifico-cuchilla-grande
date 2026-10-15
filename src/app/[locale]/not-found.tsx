import { useTranslations } from "next-intl";
import { Isotype } from "@/components/brand/logo";
import { IconArrowRight } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <Container className="flex flex-1 flex-col items-start justify-center py-24 sm:py-32">
      <Isotype className="size-14 text-brand-700" />
      <h1 className="mt-8 text-4xl font-semibold text-ink sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-muted">{t("text")}</p>
      <ButtonLink href="/" className="mt-8" icon={<IconArrowRight />}>
        {t("back")}
      </ButtonLink>
    </Container>
  );
}
