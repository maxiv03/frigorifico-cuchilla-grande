import { getLocale, getTranslations } from "next-intl/server";
import { IconArrowRight } from "@/components/icons";
import { NewsCard } from "@/components/news/news-card";
import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { getNews } from "@/lib/data/editorial";

/** Home: las 3 noticias más recientes (datos en 'use cache', dentro del prerender). */
export async function LatestNews() {
  const locale = await getLocale();
  const t = await getTranslations("Home.news");
  const posts = (await getNews(locale)).slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <Section tone="muted" aria-labelledby="latest-news" data-latest-news>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader id="latest-news" eyebrow={t("eyebrow")} title={t("title")} />
        <ButtonLink href="/news" variant="secondary" icon={<IconArrowRight />} className="self-start lg:self-auto">
          {t("cta")}
        </ButtonLink>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} className="flex min-w-0">
            <NewsCard post={post} headingLevel="h3" className="w-full" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
