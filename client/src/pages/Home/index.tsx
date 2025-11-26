import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { StorefrontSection } from "./StorefrontSection";
import { PsychologySection } from "./PsychologySection";
import { CollectiveSection } from "./CollectiveSection";
import { PartnershipSection } from "./PartnershipSection";
import { FutureStateSection } from "./FutureStateSection";
import { FinalCTASection } from "./FinalCTASection";

/**
 * Home page - Managed Storefronts & The Collective
 *
 * Premium editorial landing page targeting high-value service businesses:
 * horse farms, elopement agencies, wedding photographers, event planners.
 *
 * Section flow:
 * 1. Hero - AI-powered storefronts headline
 * 2. Problem - Pain points they recognize
 * 3. Storefront - 3-tier model explanation
 * 4. Psychology - Why 3 tiers work
 * 5. Collective - AI + team capabilities
 * 6. Partnership - Revenue-share model
 * 7. FutureState - Transformation narrative
 * 8. FinalCTA - Book a discovery call
 */
export function Home() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <StorefrontSection />
      <PsychologySection />
      <CollectiveSection />
      <PartnershipSection />
      <FutureStateSection />
      <FinalCTASection />
    </main>
  );
}
