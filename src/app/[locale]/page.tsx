import { AudienceCards } from "@/components/home/audience-cards";
import { FiguresBand } from "@/components/home/figures-band";
import { Hero } from "@/components/home/hero";
import { OriginBlock } from "@/components/home/origin-block";
import { PriceSummary } from "@/components/home/price-summary";

// Los destacados de cortes, mercados y calidad se suman en sus fases (2 y 3).
export default function HomePage() {
  return (
    <>
      <Hero />
      <FiguresBand />
      <AudienceCards />
      <OriginBlock />
      <PriceSummary />
    </>
  );
}
