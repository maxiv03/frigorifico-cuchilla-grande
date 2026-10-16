import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/components/ui/cn";
import { Link } from "@/i18n/navigation";
import type { NewsPost } from "@/lib/data/editorial";
import { formatDate } from "@/lib/format";
import { newsImage } from "@/lib/news/images";

/**
 * Tarjeta de noticia: foto, fecha, título y extracto. Toda la tarjeta lleva al detalle (enlace
 * estirado sobre el título).
 */
export async function NewsCard({
  post,
  headingLevel: H = "h2",
  sizes = "(min-width: 1216px) 384px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw",
  eager,
  className,
}: {
  post: NewsPost;
  /** Primera fila visible del listado: carga sin lazy. */
  eager?: boolean;
  headingLevel?: "h2" | "h3";
  sizes?: string;
  className?: string;
}) {
  const t = await getTranslations("News");
  const locale = await getLocale();
  const image = newsImage(post.image);
  return (
    <article
      data-news-card={post.id}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg bg-surface shadow-card ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-brand-700 hover:shadow-raised",
        className,
      )}
    >
      {image && (
        <Image
          src={image.src}
          alt={t(`images.${image.key}`)}
          sizes={sizes}
          placeholder="blur"
          loading={eager ? "eager" : undefined}
          className="aspect-[16/10] w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-semibold text-ink-muted">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
        </p>
        <H className="mt-2 font-serif text-xl leading-snug font-semibold text-ink">
          <Link
            href={{ pathname: "/news/[slug]", params: { slug: post.slug } }}
            className="outline-none after:absolute after:inset-0 after:content-[''] hover:text-brand-700"
          >
            {post.title}
          </Link>
        </H>
        <p className="mt-3 leading-relaxed text-ink-muted">{post.excerpt}</p>
        <p aria-hidden="true" className="mt-auto pt-5 text-sm font-semibold text-brand-700">
          {t("readMore")}
        </p>
      </div>
    </article>
  );
}
