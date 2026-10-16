import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NewsCard } from "@/components/news/news-card";
import { Section, SectionHeader } from "@/components/ui/section";
import { getNews } from "@/lib/data/editorial";
import { staticPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("News");
  return staticPageMetadata(locale, "/news", t("metaTitle"), t("metaDescription"));
}

/** Listado de noticias (seed), de la más nueva a la más vieja. Estático: datos en 'use cache'. */
export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("News");
  const posts = await getNews(locale);

  return (
    <Section tone="muted" className="lg:pt-16">
      <SectionHeader eyebrow={t("eyebrow")} as="h1" title={t("title")} lead={t("lead")} />
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-8">
        {posts.map((post, i) => (
          <li key={post.id} className="flex min-w-0">
            <NewsCard post={post} eager={i < 3} className="w-full" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
