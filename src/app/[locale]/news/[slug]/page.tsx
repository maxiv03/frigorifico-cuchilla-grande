import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { SetAlternates } from "@/components/i18n/alternates";
import { Markdown } from "@/components/news/markdown";
import { NewsCard, newsDate } from "@/components/news/news-card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getPathname, Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getNews, getNewsSlugs } from "@/lib/data/editorial";
import { newsImage } from "@/lib/news/images";

type Params = { locale: string; slug: string };

/**
 * Detalle de noticia. Como el detalle de corte: params fuera de <Suspense> a propósito, todas las
 * noticias se prerenderizan (generateStaticParams) y el contenido queda en el HTML estático.
 */
export const instant = false;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const posts = await getNews(params.locale as Locale);
  return posts.map((p) => ({ slug: p.slug }));
}

async function load(params: Promise<Params>) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const posts = await getNews(locale);
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const slugs = (await getNewsSlugs())[post.id];
  // Ruta de la misma noticia en cada idioma (slug traducido).
  const hrefs = Object.fromEntries(
    routing.locales.map((other) => [
      other,
      getPathname({ locale: other, href: { pathname: "/news/[slug]", params: { slug: slugs?.[other] ?? slug } } }),
    ]),
  ) as Record<Locale, string>;
  return { locale, post, posts, hrefs };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, post, hrefs } = await load(params);
  const t = await getTranslations({ locale, namespace: "News" });
  const image = newsImage(post.image);
  const title = t("metaDetail", { title: post.title });
  return {
    title,
    description: post.excerpt,
    alternates: { canonical: hrefs[locale], languages: { ...hrefs, "x-default": hrefs[routing.defaultLocale] } },
    openGraph: {
      type: "article",
      title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      images: image ? [image.src.src] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<Params> }) {
  const { locale, post, posts, hrefs } = await load(params);
  const t = await getTranslations({ locale, namespace: "News" });
  const tNav = await getTranslations({ locale, namespace: "Nav" });
  const format = await getFormatter({ locale });
  const image = newsImage(post.image);
  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <>
      <SetAlternates hrefs={hrefs} />
      <div className="border-b border-line bg-surface-muted">
        <Container>
          <nav aria-label={t("breadcrumb")} className="py-4 text-sm">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
              <li>
                <Link href="/" className="hover:text-brand-700 hover:underline">
                  {tNav("home")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/news" className="hover:text-brand-700 hover:underline">
                  {tNav("news")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-semibold text-ink">
                {post.title}
              </li>
            </ol>
          </nav>
        </Container>
      </div>

      <article className="bg-surface py-12 lg:py-16" data-news-article={post.id}>
        <Container className="max-w-3xl">
          <header>
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              <time dateTime={post.publishedAt} className="font-semibold">
                {format.dateTime(newsDate(post.publishedAt), { dateStyle: "long", timeZone: "UTC" })}
              </time>
              <Badge tone="neutral">{t("fictitious")}</Badge>
            </div>
            <h1 className="mt-3 text-3xl leading-tight font-semibold text-ink sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">{post.excerpt}</p>
          </header>
          {image && (
            <Image
              src={image.src}
              alt={t(`images.${image.key}`)}
              sizes="(min-width: 768px) 720px, 100vw"
              placeholder="blur"
              loading="eager"
              fetchPriority="high"
              className="mt-8 aspect-[16/10] w-full rounded-lg object-cover shadow-raised"
            />
          )}
          <div className="mt-4 text-lg leading-relaxed text-ink">
            <Markdown source={post.bodyMd} />
          </div>
          <p className="mt-12 border-t border-line pt-6">
            <Link href="/news" className="font-semibold text-brand-700 hover:underline">
              {t("back")}
            </Link>
          </p>
        </Container>
      </article>

      {more.length > 0 && (
        <Section tone="muted" aria-labelledby="more-news">
          <h2 id="more-news" className="text-2xl font-semibold text-ink sm:text-3xl">
            {t("more")}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {more.map((p) => (
              <li key={p.id} className="flex min-w-0">
                <NewsCard post={p} headingLevel="h3" className="w-full" />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
