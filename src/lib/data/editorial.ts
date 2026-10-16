import { cacheLife, cacheTag } from "next/cache";
import { routing, type Locale } from "@/i18n/routing";
import { publicDb } from "@/lib/supabase/public";

export type NewsPost = {
  id: string;
  publishedAt: string;
  image: string;
  featured: boolean;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
};

export type GoalTopic = "energy" | "water" | "emissions" | "animal_welfare" | "community";
export const GOAL_TOPICS: GoalTopic[] = ["energy", "water", "emissions", "animal_welfare", "community"];

export type SustainabilityGoal = {
  id: string;
  topic: GoalTopic;
  unit: string;
  baseline: number;
  baselineYear: number;
  target: number;
  targetYear: number;
  current: number;
  status: "achieved" | "on_track" | "in_progress" | "at_risk";
  title: string;
  description: string;
  /** Avance hacia el objetivo, 0–1: (actual − base) / (objetivo − base). Sirve si la meta sube o baja. */
  progress: number;
};

/**
 * Noticias de un idioma, de la más nueva a la más vieja. Contenido del seed: solo cambia con
 * `npm run db:seed` + deploy (cacheLife("days") por las dudas).
 */
export async function getNews(locale: Locale): Promise<NewsPost[]> {
  "use cache";
  cacheTag("news");
  cacheLife("days");

  const { data, error } = await publicDb()
    .from("news_posts")
    .select("id, published_at, image, featured, news_translations(slug, title, excerpt, body_md)")
    .eq("news_translations.locale", locale)
    .order("published_at", { ascending: false });
  if (error) throw new Error(`news_posts: ${error.message}`);
  return data.flatMap((n) => {
    const t = n.news_translations[0];
    if (!t) return [];
    return [
      {
        id: n.id,
        publishedAt: n.published_at,
        image: n.image ?? "",
        featured: n.featured,
        slug: t.slug,
        title: t.title,
        excerpt: t.excerpt,
        bodyMd: t.body_md,
      },
    ];
  });
}

/** Slugs de cada noticia en todos los idiomas: id → { es, en }. */
export async function getNewsSlugs(): Promise<Record<string, Record<Locale, string>>> {
  "use cache";
  cacheTag("news");
  cacheLife("days");

  const { data, error } = await publicDb().from("news_translations").select("post_id, locale, slug");
  if (error) throw new Error(`news_translations: ${error.message}`);
  const out: Record<string, Record<Locale, string>> = {};
  for (const row of data) {
    if (!(routing.locales as readonly string[]).includes(row.locale)) continue;
    (out[row.post_id] ??= {} as Record<Locale, string>)[row.locale as Locale] = row.slug;
  }
  return out;
}

export async function getSustainabilityGoals(locale: Locale): Promise<SustainabilityGoal[]> {
  "use cache";
  cacheTag("sustainability");
  cacheLife("days");

  const { data, error } = await publicDb()
    .from("sustainability_goals")
    .select("id, topic, unit, baseline, baseline_year, target, target_year, current, status, sort, sustainability_goal_translations(title, description)")
    .eq("sustainability_goal_translations.locale", locale)
    .order("sort");
  if (error) throw new Error(`sustainability_goals: ${error.message}`);
  return data.flatMap((g) => {
    const t = g.sustainability_goal_translations[0];
    if (!t || !g.topic) return [];
    const baseline = Number(g.baseline);
    const target = Number(g.target);
    const current = Number(g.current);
    const progress = target === baseline ? 1 : Math.min(1, Math.max(0, (current - baseline) / (target - baseline)));
    return [
      {
        id: g.id,
        topic: g.topic as GoalTopic,
        unit: g.unit,
        baseline,
        baselineYear: g.baseline_year ?? 0,
        target,
        targetYear: g.target_year,
        current,
        status: g.status as SustainabilityGoal["status"],
        title: t.title,
        description: t.description,
        progress,
      },
    ];
  });
}
