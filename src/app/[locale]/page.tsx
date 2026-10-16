import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AudienceCards } from "@/components/home/audience-cards";
import { CertStrip } from "@/components/home/cert-strip";
import { FeaturedCuts } from "@/components/home/featured-cuts";
import { FiguresBand } from "@/components/home/figures-band";
import { Hero } from "@/components/home/hero";
import { LatestNews } from "@/components/home/latest-news";
import { MarketsPreview } from "@/components/home/markets-preview";
import { OriginBlock } from "@/components/home/origin-block";
import { PriceSummary } from "@/components/home/price-summary";
import { pageMetadata, staticHrefs } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Meta");
  return pageMetadata({ locale, hrefs: staticHrefs("/"), title: { absolute: t("homeTitle") }, description: t("description") });
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FiguresBand />
      <AudienceCards />
      <FeaturedCuts />
      <CertStrip />
      <MarketsPreview />
      <OriginBlock />
      <PriceSummary />
      <LatestNews />
    </>
  );
}
