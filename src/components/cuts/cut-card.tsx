import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { IconMail } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";
import { CutDiagram } from "./cut-diagram";
import { Link } from "@/i18n/navigation";
import { cutImage } from "@/lib/catalog/images";
import { speciesSlugs } from "@/lib/catalog/species";
import type { Bone, Presentation, Species } from "@/lib/catalog/types";
import { buildMailto } from "@/lib/mailto";

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
  /** Mail del equipo (desde env, resuelto en el servidor). */
  email: string;
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
 * "Pedir cotización" es un mailto aparte, por encima del enlace.
 */
export function CutCard({
  cut,
  email,
  headingLevel: H = "h3",
  visual = "diagram",
  eager,
  sizes = "(min-width: 1216px) 384px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw",
  className,
}: Props) {
  const t = useTranslations("Products");
  const locale = useLocale();
  const image = visual === "photo" ? cutImage(cut.image, cut.species) : null;
  const subject = t("card.quoteSubject", { cut: cut.name, species: t(`species.${cut.species}`) });

  return (
    <article
      data-cut={cut.id}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg bg-surface shadow-card ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-700 hover:shadow-raised",
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
        <div className="border-b border-line bg-surface-muted px-5 pt-4 pb-3">
          <CutDiagram
            species={cut.species}
            selected={cut.zone}
            zones={[{ key: cut.zone, name: cut.zoneName, label: cut.zoneName }]}
            label={t("detail.diagramLabel", { species: t(`detail.speciesInline.${cut.species}`), zone: cut.zoneName })}
            showLabels={false}
            className="mx-auto max-w-52 sm:max-w-72"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold tracking-[0.12em] text-earth-700 uppercase">{t("card.zone", { zone: cut.zoneName })}</p>
        <H className="mt-2 font-serif text-xl leading-snug font-semibold text-ink">
          <Link
            href={{ pathname: "/products/[species]/[cut]", params: { species: speciesSlugs[cut.species][locale], cut: cut.slug } }}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {cut.name}
          </Link>
        </H>
        {cut.alias && <p className="mt-0.5 text-sm text-ink-muted">{cut.alias}</p>}
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {cut.presentations.map((p) => (
            <li key={p}>
              <Badge tone="earth">{t(`presentation.${p}`)}</Badge>
            </li>
          ))}
          <li>
            <Badge tone="neutral">{t(`bone.${cut.bone}`)}</Badge>
          </li>
        </ul>
        <div className="mt-auto pt-5">
          <a
            href={buildMailto(email, subject)}
            aria-label={t("card.quoteFor", { cut: cut.name })}
            className="relative z-10 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            <IconMail width={16} height={16} />
            {t("card.quote")}
          </a>
        </div>
      </div>
    </article>
  );
}
