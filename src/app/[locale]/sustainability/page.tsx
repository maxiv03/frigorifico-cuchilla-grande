import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComponentType, SVGProps } from "react";
import { IconAlert, IconCheck, IconClock, IconCloud, IconHand, IconSun, IconTrendUp, IconUsers, IconWater } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";
import { Section, SectionHeader } from "@/components/ui/section";
import { Tabs } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { GOAL_TOPICS, getSustainabilityGoals, type GoalTopic, type SustainabilityGoal } from "@/lib/data/editorial";
import { formatDecimal, formatFigure } from "@/lib/format";
import { staticPageMetadata } from "@/lib/metadata";

type IconT = ComponentType<SVGProps<SVGSVGElement>>;

const TOPIC_ICONS = {
  energy: IconSun,
  water: IconWater,
  emissions: IconCloud,
  animal_welfare: IconHand,
  community: IconUsers,
} as const satisfies Record<GoalTopic, IconT>;

/** Estado: ícono + texto (nunca solo color). */
const STATUS = {
  achieved: { icon: IconCheck, tone: "earth", bar: "bg-up" },
  on_track: { icon: IconTrendUp, tone: "neutral", bar: "bg-earth-600" },
  in_progress: { icon: IconClock, tone: "neutral", bar: "bg-earth-600" },
  at_risk: { icon: IconAlert, tone: "brand", bar: "bg-brand-700" },
} as const satisfies Record<SustainabilityGoal["status"], { icon: IconT; tone: "earth" | "neutral" | "brand"; bar: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Sustainability");
  return staticPageMetadata(locale, "/sustainability", t("metaTitle"), t("metaDescription"));
}

/** Metas de sostenibilidad (sustainability_goals) en pestañas por tema. Estático: datos en 'use cache'. */
export default async function SustainabilityPage() {
  const locale = await getLocale();
  const t = await getTranslations("Sustainability");
  const goals = await getSustainabilityGoals(locale);

  const items = GOAL_TOPICS.filter((topic) => goals.some((g) => g.topic === topic)).map((topic) => {
    const Icon = TOPIC_ICONS[topic];
    return {
      id: topic,
      label: t(`topics.${topic}.tab`),
      icon: <Icon width={18} height={18} />,
      panel: (
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-semibold text-ink">{t(`topics.${topic}.title`)}</h2>
            <p className="mt-3 leading-relaxed text-ink-muted">{t(`topics.${topic}.text`)}</p>
          </div>
          <ul className="grid gap-6 lg:col-span-8">
            {goals
              .filter((g) => g.topic === topic)
              .map((g) => (
                <li key={g.id}>
                  <GoalCard goal={g} locale={locale} t={t} />
                </li>
              ))}
          </ul>
        </div>
      ),
    };
  });

  return (
    <>
      <Section tone="muted" className="lg:pt-16 lg:pb-16">
        <SectionHeader eyebrow={t("eyebrow")} as="h1" title={t("title")} lead={t("lead")} />
      </Section>
      <Section className="lg:pt-16">
        <Tabs items={items} label={t("tabsLabel")} idPrefix="goals" />
        <aside className="mt-14 rounded-lg bg-earth-50 p-6 text-ink ring-1 ring-earth-200">
          <h2 className="font-sans text-lg font-semibold">{t("method.title")}</h2>
          <p className="mt-2 leading-relaxed text-ink-muted">{t("method.text")}</p>
          <p className="mt-3">
            <Link href="/news" className="font-semibold text-brand-700 hover:underline">
              {t("method.news")}
            </Link>
          </p>
        </aside>
      </Section>
    </>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"Sustainability">>>;

function GoalCard({ goal: g, locale, t }: { goal: SustainabilityGoal; locale: Locale; t: T }) {
  const status = STATUS[g.status];
  const StatusIcon = status.icon;
  const value = (n: number) => {
    const num = Number.isInteger(n) ? formatFigure(n, locale) : formatDecimal(n, locale);
    return g.unit === "%" ? t("percent", { value: num }) : t("withUnit", { value: num, unit: g.unit });
  };
  const pct = Math.round(g.progress * 100);
  return (
    <article data-goal={g.id} className="rounded-lg bg-surface p-6 shadow-card ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-sans text-lg leading-snug font-semibold text-ink">{g.title}</h3>
        <Badge tone={status.tone} className="text-sm" data-status={g.status}>
          <StatusIcon width={14} height={14} />
          {t(`status.${g.status}`)}
        </Badge>
      </div>
      <p className="mt-2 leading-relaxed text-ink-muted">{g.description}</p>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-ink-muted">{t("baseline", { year: String(g.baselineYear) })}</dt>
          <dd className="mt-0.5 text-base font-semibold text-ink tabular-nums">{value(g.baseline)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">{t("current")}</dt>
          <dd className="mt-0.5 text-base font-semibold text-ink tabular-nums">{value(g.current)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">{t("target", { year: String(g.targetYear) })}</dt>
          <dd className="mt-0.5 text-base font-semibold text-ink tabular-nums">{value(g.target)}</dd>
        </div>
      </dl>
      <div className="mt-5">
        <div className="flex items-baseline justify-between text-sm">
          <span id={`progress-${g.id}`} className="font-semibold text-ink">
            {t("progress")}
          </span>
          <span className="font-semibold text-ink tabular-nums" data-progress={pct}>
            {t("percent", { value: formatFigure(pct, locale) })}
          </span>
        </div>
        <div
          role="progressbar"
          aria-labelledby={`progress-${g.id}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={t("progressText", { pct: formatFigure(pct, locale), year: String(g.targetYear) })}
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted ring-1 ring-line ring-inset"
        >
          <div className={cn("h-full rounded-full", status.bar)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </article>
  );
}
