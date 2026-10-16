import { getImageProps } from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { IconArrowRight } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { company } from "@/data/company";
import { formatFigure } from "@/lib/format";
import heroH from "../../../public/images/home/hero-angus-campo-h.jpg";
import heroV from "../../../public/images/home/hero-angus-campo-v.jpg";

/** Hero a pantalla completa. Encuadre horizontal en escritorio y vertical en móvil. */
export async function Hero() {
  const t = await getTranslations("Home.hero");
  const locale = await getLocale();
  const { figures, address } = company;

  // Dos candidatas a LCP según viewport: eager + fetchPriority, sin preload. El `preload` de
  // next/image precargaría las dos variantes, y `preload()` de React (con `media`) viaja en el
  // payload RSC: como las demás páginas precargan la home (logo, "Inicio"), todas bajaban esta foto
  // con prioridad alta (medido en la fase 7). La foto está al principio del HTML y se descubre igual.
  const common = { alt: t("imageAlt"), sizes: "100vw", loading: "eager", fetchPriority: "high", quality: 75 } as const;
  const { props: desktop } = getImageProps({ ...common, src: heroH, placeholder: "blur" });
  const {
    props: { srcSet: mobileSrcSet, ...mobile },
  } = getImageProps({ ...common, src: heroV, placeholder: "blur" });

  return (
    <section className="relative isolate flex min-h-[calc(100svh-var(--spacing-header))] items-end overflow-hidden bg-night lg:min-h-[calc(100svh-var(--spacing-header)-2.25rem)]">
      <picture>
        <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes="100vw" />
        <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt viene en las props de getImageProps */}
        <img {...mobile} className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_0%] md:object-center" />
      </picture>
      {/* Oscurecido para contraste del texto (AA sobre la foto) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-night from-35% via-night/65 via-60% to-night/0 to-85% md:bg-gradient-to-r md:from-night/90 md:from-0% md:via-night/55 md:via-50% md:to-transparent md:to-100%"
      />

      <Container className="pt-24 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-earth-200 uppercase">
            {t("eyebrow", { city: address.city, department: address.department })}
          </p>
          <h1 className="mt-4 text-4xl leading-[1.08] font-semibold text-white sm:text-5xl lg:text-6xl">{t("title")}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-earth-100 sm:text-xl">
            {t("lead", {
              cattle: formatFigure(figures.cattlePerDay, locale),
              sheep: formatFigure(figures.sheepPerDay, locale),
              countries: formatFigure(figures.countries, locale),
            })}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/products" size="lg" icon={<IconArrowRight />}>
              {t("ctaBuyer")}
            </ButtonLink>
            <ButtonLink href="/producers" size="lg" variant="outlineLight">
              {t("ctaProducer")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
