import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { IconArrowRight } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";
import { CutDiagram } from "./cut-diagram";
import { Link } from "@/i18n/navigation";
import { cutImage } from "@/lib/catalog/images";
import { speciesSlugs } from "@/lib/catalog/species";
import type { Bone, Presentation, Species } from "@/lib/catalog/types";

export type CardCut = {
  id: string;
  species: Species;
  zone: string;
  zoneName: string;
  bone: Bone;
  presentations: Presentation[];
  image: string | null;
  slug: string;
  name: string;
  alias: string | null;
};

type Props = {
  cut: CardCut;
  headingLevel?: "h2" | "h3";
  /**
   * Ilustración: mini-silueta con la zona resaltada (catálogo) o foto de la pieza (destacados
   * de la home; sin foto propia, vuelve a la silueta).
   */
  visual?: "diagram" | "photo";
  /** Prioridad de carga de la foto (solo la primera fila visible). */
  eager?: boolean;
  /** `sizes` de la foto. */
  sizes?: string;
  className?: string;
};

/**
 * Tarjeta de corte: mini-silueta del animal con la zona del corte (o la foto de la pieza),
 * nombre, alias, zona y badges. Toda la tarjeta lleva al detalle (enlace estirado sobre el título);
 * "Pedir cotización" es un link aparte, por encima del enlace, a /contacto?tab=quote&cut=<id>
 * (id neutro: el formulario precarga el corte en cualquier idioma).
 * Con silueta, en móvil (< sm) es compacta y horizontal: silueta chica a la izquierda, texto a la
 * derecha y sin la línea de zona (la silueta ya la muestra y la nombra).
 */
export function CutCard({
  cut,
  headingLevel: H = "h3",
  visual = "diagram",
  eager,
  sizes = "(min-width: 1216px) 384px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw",
  className,
}: Props) {
  const t = useTranslations("Products");
  const locale = useLocale();
  const image = visual === "photo" ? cutImage(cut.image, cut.species) : null;
  const compact = !image;
  // En la tarjeta compacta, badges más ceñidos para que entren en una sola línea.
  const badge = compact ? "max-sm:px-1.5 max-sm:tracking-normal" : undefined;

  return (
    <article
      data-cut={cut.id}
      className={cn(
        "group relative flex overflow-hidden rounded-lg bg-surface shadow-card ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-700 hover:shadow-raised",
        compact ? "flex-row sm:flex-col" : "flex-col",
        className,
      )}
    >
      {image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
          <Image
            src={image.src}
            alt={t(`images.${image.key}`)}
            fill
            placeholder="blur"
            loading={eager ? "eager" : "lazy"}
            sizes={sizes}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="flex w-24 shrink-0 items-center border-r border-line bg-surface-muted px-2 sm:block sm:w-auto sm:border-r-0 sm:border-b sm:px-5 sm:pt-4 sm:pb-3">
          <CutDiagram
            species={cut.species}
            selected={cut.zone}
            zones={[{ key: cut.zone, name: cut.zoneName, label: cut.zoneName }]}
            label={t("detail.diagramLabel", {
              species: t(`detail.speciesInline.${cut.species}`),
              zone: cut.zoneName,
            })}
            showLabels={false}
            className="mx-auto sm:max-w-72"
          />
        </div>
      )}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          compact ? "px-3 py-3 sm:p-5" : "p-5",
        )}
      >
        <p
          className={cn(
            "text-xs font-semibold tracking-[0.12em] text-earth-700 uppercase",
            compact && "max-sm:hidden",
          )}
        >
          {t("card.zone", { zone: cut.zoneName })}
        </p>
        <H
          className={cn(
            "font-serif leading-snug font-semibold text-ink",
            compact ? "text-lg sm:mt-2 sm:text-xl" : "mt-2 text-xl",
          )}
        >
          <Link
            href={{
              pathname: "/products/[species]/[cut]",
              params: {
                species: speciesSlugs[cut.species][locale],
                cut: cut.slug,
              },
            }}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {cut.name}
          </Link>
        </H>
        {cut.alias && (
          <p className="mt-0.5 text-sm text-ink-muted">{cut.alias}</p>
        )}
        <ul
          className={cn(
            "flex flex-wrap gap-1.5",
            compact ? "mt-2 sm:mt-4" : "mt-4",
          )}
        >
          {cut.presentations.map((p) => (
            <li key={p}>
              <Badge tone="earth" className={badge}>
                {t(`presentation.${p}`)}
              </Badge>
            </li>
          ))}
          <li>
            <Badge tone="neutral" className={badge}>
              {t(`bone.${cut.bone}`)}
            </Badge>
          </li>
        </ul>
        <div className={cn("mt-auto", compact ? "pt-2 sm:pt-5" : "pt-5")}>
          <Link
            href={{ pathname: "/contact", query: { tab: "quote", cut: cut.id } }}
            data-quote-link={cut.id}
            aria-label={t("card.quoteFor", { cut: cut.name })}
            className="relative z-10 inline-flex min-h-6 items-center gap-1.5 rounded-sm text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            {t("card.quote")}
            <IconArrowRight width={16} height={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
