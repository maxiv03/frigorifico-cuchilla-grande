import { AudienceCards } from "@/components/home/audience-cards";
import { FeaturedCuts } from "@/components/home/featured-cuts";
import { FiguresBand } from "@/components/home/figures-band";
import { Hero } from "@/components/home/hero";
import { OriginBlock } from "@/components/home/origin-block";
import { PriceSummary } from "@/components/home/price-summary";

// Los destacados de mercados y calidad se suman en la fase 3.
export default function HomePage() {
  return (
    <>
      <Hero />
      <FiguresBand />
      <AudienceCards />
      <FeaturedCuts />
      <OriginBlock />
      <PriceSummary />
    </>
  );
}
