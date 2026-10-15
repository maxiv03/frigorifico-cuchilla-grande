import Image, { type StaticImageData } from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { IconArrowRight, IconCheck, IconWhatsApp } from "@/components/icons";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";
import { isEnabled } from "@/config/navigation";
import { mailtoUrl, whatsappUrl } from "@/lib/contact";
import buyersImg from "../../../public/images/home/compradores-buque.jpg";
import producersImg from "../../../public/images/home/productores-hereford.jpg";

/** Accesos separados para cada público. Los ids son el destino de los CTA del hero. */
export async function AudienceCards() {
  const t = await getTranslations("Home.audiences");

  return (
    <Section tone="muted" aria-labelledby="publicos">
      <SectionHeader id="publicos" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <AudienceCard
          id="compradores"
          image={buyersImg}
          imageAlt={t("buyers.imageAlt")}
          title={t("buyers.title")}
          text={t("buyers.text")}
          benefits={[t("buyers.benefit1"), t("buyers.benefit2"), t("buyers.benefit3")]}
          cta={
            isEnabled("contact") ? (
              <ButtonLink href={{ pathname: "/contact", query: { tab: "quote" } }} icon={<IconArrowRight />}>
                {t("buyers.cta")}
              </ButtonLink>
            ) : (
              <ButtonAnchor href={mailtoUrl(t("buyers.mailSubject"))} icon={<IconArrowRight />}>
                {t("buyers.cta")}
              </ButtonAnchor>
            )
          }
        />
        <AudienceCard
          id="productores"
          accent="earth"
          image={producersImg}
          imageAlt={t("producers.imageAlt")}
          title={t("producers.title")}
          text={t("producers.text")}
          benefits={[t("producers.benefit1"), t("producers.benefit2"), t("producers.benefit3")]}
          cta={
            <ButtonAnchor
              variant="earth"
              href={whatsappUrl(t("producers.whatsappMessage"))}
              target="_blank"
              rel="noopener"
              icon={<IconWhatsApp />}
            >
              {t("producers.cta")}
            </ButtonAnchor>
          }
        />
      </div>
    </Section>
  );
}

type CardProps = {
  id: string;
  image: StaticImageData;
  imageAlt: string;
  title: string;
  text: string;
  benefits: string[];
  cta: ReactNode;
  accent?: "brand" | "earth";
};

function AudienceCard({ id, image, imageAlt, title, text, benefits, cta, accent = "brand" }: CardProps) {
  return (
    <Card id={id} aria-labelledby={`${id}-title`}>
      <div className="relative aspect-[16/9] bg-surface-muted">
        <Image
          src={image}
          alt={imageAlt}
          fill
          placeholder="blur"
          sizes="(min-width: 1216px) 584px, (min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <CardBody>
        <h3 id={`${id}-title`} className="text-2xl font-semibold text-ink">
          {title}
        </h3>
        <p className="mt-3 leading-relaxed text-ink-muted">{text}</p>
        <ul className="mt-6 space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex gap-3">
              <IconCheck className={accent === "earth" ? "mt-0.5 shrink-0 text-earth-700" : "mt-0.5 shrink-0 text-brand-700"} />
              <span className="text-ink">{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 pt-2">{cta}</div>
      </CardBody>
    </Card>
  );
}
