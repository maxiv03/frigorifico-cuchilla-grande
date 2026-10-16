import { AudienceCards } from "@/components/home/audience-cards";
import { CertStrip } from "@/components/home/cert-strip";
import { FeaturedCuts } from "@/components/home/featured-cuts";
import { FiguresBand } from "@/components/home/figures-band";
import { Hero } from "@/components/home/hero";
import { LatestNews } from "@/components/home/latest-news";
import { MarketsPreview } from "@/components/home/markets-preview";
import { OriginBlock } from "@/components/home/origin-block";
import { PriceSummary } from "@/components/home/price-summary";

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
